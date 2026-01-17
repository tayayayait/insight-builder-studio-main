/**
 * Report Store Service
 * Firestore에서 리포트 데이터를 관리합니다.
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

export interface Report {
    id: string;
    title: string;
    projectName: string;
    projectId?: string;
    format: "pdf" | "pptx" | "xlsx";
    createdAt: string;
    fileSize: string;
    downloadUrl?: string;
}

const COLLECTION_NAME = "reports";

export const reportStore = {
    // Get all reports
    getReports: async (): Promise<Report[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as Report);
        } catch (error) {
            console.error("Error fetching reports:", error);
            return [];
        }
    },

    // Get a single report by ID
    getReport: async (id: string): Promise<Report | undefined> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Report;
            }
            return undefined;
        } catch (error) {
            console.error("Error fetching report:", error);
            return undefined;
        }
    },

    // Create a new report
    createReport: async (data: Omit<Report, "id" | "createdAt">): Promise<Report> => {
        const id = `report_${Date.now()}`;
        const newReport: Report = {
            ...data,
            id,
            createdAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, COLLECTION_NAME, id), newReport);
            return newReport;
        } catch (error) {
            console.error("Error creating report:", error);
            throw error;
        }
    },

    // Delete a report
    deleteReport: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting report:", error);
            throw error;
        }
    }
};
