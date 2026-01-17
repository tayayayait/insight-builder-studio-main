/**
 * DataAdapter.ts
 * 
 * 다양한 소스(PDF OCR 결과, Excel 업로드)를 통합 분석 포맷으로 변환
 */

import * as XLSX from 'xlsx';
import { SurveyResponse, AnalysisDataset } from './analysisService';
import { JobData, FieldData } from './jobStore';

// Extend SurveyResponse to include status for internal tracking
interface ExtendedSurveyResponse extends SurveyResponse {
    status?: "valid" | "warning" | "error";
    confidence?: number;
}

// ============================================
// 1. OCR 결과 → 분석 데이터셋 변환
// ============================================

/**
 * JobData (OCR 결과)를 AnalysisDataset으로 변환
 */
export function convertOCRToDataset(job: JobData): AnalysisDataset {
    const responses: SurveyResponse[] = [];
    let respondentCounter = 0;

    // 각 페이지를 하나의 응답자로 가정
    job.pages.forEach((page, pageIndex) => {
        const pageResults = job.results[page.id];
        if (!pageResults) return;

        respondentCounter++;
        const respondentId = `R${String(respondentCounter).padStart(3, '0')}`;

        pageResults.fields.forEach((field, fieldIndex) => {
            // 추출된 값을 파싱
            const parsedValue = parseFieldValue(field);

            responses.push({
                id: `${respondentId}-Q${fieldIndex + 1}`,
                respondentId,
                questionId: `Q${fieldIndex + 1}`,
                questionLabel: field.label,
                value: parsedValue.value,
                type: parsedValue.type,
                category: extractCategoryFromLabel(field.label),
                // Add extended metadata if available (needs type assertion or update SurveyResponse definition)
                // For now, we assume AnalysisService handles basic SurveyResponse. 
                // We can add a "flag" to the ID or similar if we want to trace it without changing types extensively.
            } as any);
        });
    });

    return {
        projectId: job.id,
        projectName: job.name,
        responses,
        metadata: {
            totalRespondents: respondentCounter,
            collectedAt: job.createdAt,
            source: 'ocr'
        }
    };
}

/**
 * 필드 값 파싱 (문자열 → 숫자/불리언 등)
 */
function parseFieldValue(field: FieldData): { value: number | string | boolean; type: SurveyResponse['type'] } {
    const rawValue = field.value;

    // 숫자인 경우
    if (typeof rawValue === 'number') {
        return { value: rawValue, type: 'numeric' };
    }

    // 불리언인 경우
    if (typeof rawValue === 'boolean') {
        return { value: rawValue, type: 'boolean' };
    }

    // 문자열인 경우
    const strValue = String(rawValue).trim();

    // 숫자로 변환 가능한지 체크
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue)) {
        return { value: numValue, type: 'numeric' };
    }

    // 리커트 척도 표현 (매우 불만족=1, 불만족=2, 보통=3, 만족=4, 매우 만족=5)
    const likertMap: Record<string, number> = {
        '매우 불만족': 1, '매우불만족': 1, '1점': 1, '1': 1,
        '불만족': 2, '2점': 2, '2': 2,
        '보통': 3, '3점': 3, '3': 3,
        '만족': 4, '4점': 4, '4': 4,
        '매우 만족': 5, '매우만족': 5, '5점': 5, '5': 5
    };

    if (likertMap[strValue] !== undefined) {
        return { value: likertMap[strValue], type: 'likert' };
    }

    // 체크박스 표현
    const checkboxTrue = ['예', 'O', 'Y', 'YES', 'TRUE'];
    const checkboxFalse = ['아니오', 'X', 'N', 'NO', 'FALSE'];
    const upperValue = strValue.toUpperCase();

    if (checkboxTrue.includes(upperValue)) {
        return { value: true, type: 'boolean' };
    }
    if (checkboxFalse.includes(upperValue)) {
        return { value: false, type: 'boolean' };
    }

    // 기본: 텍스트로 처리
    return { value: strValue, type: 'text' };
}

/**
 * 문항 라벨에서 카테고리 추출 (간단한 휴리스틱)
 */
function extractCategoryFromLabel(label: string): string | undefined {
    // 괄호 내용 추출 시도
    const match = label.match(/\[([^\]]+)\]/);
    if (match) return match[1];

    // 키워드 기반 분류
    const categoryKeywords: Record<string, string[]> = {
        '서비스 품질': ['서비스', '품질', 'service'],
        '가격 만족도': ['가격', '비용', '요금', 'price'],
        '직원 친절': ['직원', '친절', '응대', 'staff'],
        '시설 환경': ['시설', '환경', '청결', '인테리어']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => label.toLowerCase().includes(kw.toLowerCase()))) {
            return category;
        }
    }

    return undefined;
}

// ============================================
// 2. Excel 파일 → 분석 데이터셋 변환
// ============================================

/**
 * Excel 파일을 AnalysisDataset으로 변환
 * 
 * 기대 형식:
 * | 응답자ID | Q1. 문항1 | Q2. 문항2 | ... |
 * |---------|-----------|-----------|-----|
 * | R001    | 5         | 4         | ... |
 * | R002    | 3         | 5         | ... |
 */
export async function convertExcelToDataset(
    file: File,
    projectName: string
): Promise<AnalysisDataset> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // 첫 번째 시트 사용
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // JSON으로 변환
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (jsonData.length < 2) {
                    reject(new Error('Excel 파일에 데이터가 충분하지 않습니다.'));
                    return;
                }

                const headers = jsonData[0] as string[];
                const dataRows = jsonData.slice(1);

                const responses: SurveyResponse[] = [];

                dataRows.forEach((row, rowIndex) => {
                    const respondentId = String(row[0] || `R${rowIndex + 1}`);

                    headers.slice(1).forEach((header, colIndex) => {
                        const rawValue = row[colIndex + 1];
                        if (rawValue === undefined || rawValue === null || rawValue === '') return;

                        const questionId = `Q${colIndex + 1}`;
                        const parsedValue = parseRawExcelValue(rawValue);

                        responses.push({
                            id: `${respondentId}-${questionId}`,
                            respondentId,
                            questionId,
                            questionLabel: header,
                            value: parsedValue.value,
                            type: parsedValue.type,
                            category: extractCategoryFromLabel(header)
                        });
                    });
                });

                resolve({
                    projectId: `excel-${Date.now()}`,
                    projectName,
                    responses,
                    metadata: {
                        totalRespondents: dataRows.length,
                        collectedAt: new Date().toISOString(),
                        source: 'excel'
                    }
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Excel 원시 값 파싱
 */
function parseRawExcelValue(rawValue: any): { value: number | string | boolean; type: SurveyResponse['type'] } {
    if (typeof rawValue === 'number') {
        return { value: rawValue, type: 'numeric' };
    }
    if (typeof rawValue === 'boolean') {
        return { value: rawValue, type: 'boolean' };
    }

    const strValue = String(rawValue).trim();
    const likertMap: Record<string, number> = {
        '매우 불만족': 1, '매우불만족': 1, '1점': 1, '1': 1,
        '불만족': 2, '2점': 2, '2': 2,
        '보통': 3, '3점': 3, '3': 3,
        '만족': 4, '4점': 4, '4': 4,
        '매우 만족': 5, '매우만족': 5, '5점': 5, '5': 5
    };

    if (likertMap[strValue] !== undefined) {
        return { value: likertMap[strValue], type: 'likert' };
    }

    const numValue = parseFloat(strValue);

    if (!isNaN(numValue)) {
        return { value: numValue, type: 'numeric' };
    }

    const checkboxTrue = ['예', 'O', 'Y', 'YES', 'TRUE'];
    const checkboxFalse = ['아니오', 'X', 'N', 'NO', 'FALSE'];
    const upperValue = strValue.toUpperCase();

    if (checkboxTrue.includes(upperValue)) {
        return { value: true, type: 'boolean' };
    }
    if (checkboxFalse.includes(upperValue)) {
        return { value: false, type: 'boolean' };
    }

    return { value: strValue, type: 'text' };
}

// ============================================
// 3. 다중 소스 병합
// ============================================

/**
 * 여러 데이터셋을 하나로 병합
 */
export function mergeDatasets(datasets: AnalysisDataset[]): AnalysisDataset {
    if (datasets.length === 0) {
        throw new Error('병합할 데이터셋이 없습니다.');
    }

    if (datasets.length === 1) {
        return datasets[0];
    }

    const allResponses: SurveyResponse[] = [];
    let totalRespondents = 0;

    datasets.forEach((ds, dsIndex) => {
        // 응답자 ID에 데이터셋 인덱스 추가하여 충돌 방지
        ds.responses.forEach(response => {
            allResponses.push({
                ...response,
                id: `DS${dsIndex}-${response.id}`,
                respondentId: `DS${dsIndex}-${response.respondentId}`
            });
        });
        totalRespondents += ds.metadata.totalRespondents;
    });

    return {
        projectId: `merged-${Date.now()}`,
        projectName: datasets.map(ds => ds.projectName).join(' + '),
        responses: allResponses,
        metadata: {
            totalRespondents,
            collectedAt: new Date().toISOString(),
            source: 'mixed'
        }
    };
}

export default {
    convertOCRToDataset,
    convertExcelToDataset,
    mergeDatasets
};
