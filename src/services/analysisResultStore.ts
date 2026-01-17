/**
 * Analysis Result Store Service
 * Firestore에서 분석 결과 데이터를 저장/로드합니다.
 */

import { db } from "./firestore";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    where
} from "firebase/firestore";

export interface AnalysisResultData {
    id: string;
    projectId: string;
    projectName: string;
    analyzedAt: string;
    types: string[];
    // 사용자 정의 라벨 (questionId -> customName)
    customLabels?: Record<string, string>;
    data: {
        basic?: {
            projectName: string;
            totalResponses: number;
            totalQuestions: number;
            overallMean: number;
            questionStats: Array<{
                questionId: string;
                questionLabel: string;
                category?: string;
                responseType?: "likert" | "numeric" | "text" | "boolean";
                responseCount?: number;
                stats: {
                    count: number;
                    mean: number;
                    median: number;
                    stdDev: number;
                    min: number;
                    max: number;
                };
                distribution: Array<{ value: number | string | boolean; count: number; percentage: number }>;
            }>;
            textQuestions?: Array<{
                questionId: string;
                questionLabel: string;
                responseCount: number;
                averageLength: number;
                topKeywords: string[];
            }>;
        };
        correlation?: {
            variables: string[];
            matrix: number[][];
        };
        ttest?: Array<{
            questionAId: string;
            questionBId: string;
            questionALabel: string;
            questionBLabel: string;
            n: number;
            meanA: number;
            meanB: number;
            meanDiff: number;
            tStatistic: number;
            pValue: number;
            significant: boolean;
        }>;
        ipa?: {
            items: Array<{
                questionId: string;
                label: string;
                importance: number;
                performance: number;
                quadrant: 1 | 2 | 3 | 4;
            }>;
            importanceMean?: number;
            performanceMean?: number;
            method?: "stated" | "derived";
        };
    };
}

const COLLECTION_NAME = "analysisResults";

export const analysisResultStore = {
    // Get all analysis results
    getResults: async (): Promise<AnalysisResultData[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("analyzedAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as AnalysisResultData);
        } catch (error) {
            console.error("Error fetching analysis results:", error);
            return [];
        }
    },

    // Get a single result by ID
    getResult: async (id: string): Promise<AnalysisResultData | undefined> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as AnalysisResultData;
            }
            return undefined;
        } catch (error) {
            console.error("Error fetching analysis result:", error);
            return undefined;
        }
    },

    // Get results by project ID
    getResultsByProject: async (projectId: string): Promise<AnalysisResultData[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("projectId", "==", projectId)
            );
            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => doc.data() as AnalysisResultData);

            // Sort in memory to avoid "Composite Index" error
            return results.sort((a, b) =>
                new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
            );
        } catch (error) {
            console.error("Error fetching analysis results by project:", error);
            return [];
        }
    },

    // Helper: recursively remove undefined values from object
    _removeUndefined: (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
            return obj.map(item => analysisResultStore._removeUndefined(item));
        }
        if (typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== undefined) {
                    cleaned[key] = analysisResultStore._removeUndefined(value);
                }
            }
            return cleaned;
        }
        return obj;
    },

    // Update custom labels separately (Generic update for specific fields)
    updateResultLabels: async (id: string, labels: Record<string, string>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await setDoc(docRef, { customLabels: labels }, { merge: true });
        } catch (error) {
            console.error("Error updating labels:", error);
            throw error;
        }
    },

    // Save analysis result (중첩 배열 문제 해결을 위해 matrix를 문자열로 변환)
    saveResult: async (result: Omit<AnalysisResultData, "id">): Promise<AnalysisResultData> => {
        const id = `analysis_${Date.now()}`;

        // 1. undefined 값 제거
        let dataToSave: any = analysisResultStore._removeUndefined({
            ...result,
            id,
        });

        // 2. correlation.matrix가 있으면 문자열로 변환 (중첩 배열 문제 해결)
        if (dataToSave.data?.correlation?.matrix) {
            dataToSave.data.correlation.matrixJson = JSON.stringify(dataToSave.data.correlation.matrix);
            delete dataToSave.data.correlation.matrix;
        }

        try {
            await setDoc(doc(db, COLLECTION_NAME, id), dataToSave);
            return { ...result, id } as AnalysisResultData;
        } catch (error) {
            console.error("Error saving analysis result:", error);
            throw error;
        }
    },

    // Delete analysis result
    deleteResult: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting analysis result:", error);
            throw error;
        }
    },

    // Parse stored result (matrixJson을 다시 matrix로 변환)
    parseResult: (result: any): AnalysisResultData => {
        if (result.data?.correlation?.matrixJson) {
            result.data.correlation.matrix = JSON.parse(result.data.correlation.matrixJson);
            delete result.data.correlation.matrixJson;
        }
        return result as AnalysisResultData;
    }
};
