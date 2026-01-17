/**
 * Seed Test Data Script
 * Firestore에 테스트용 샘플 데이터를 생성합니다.
 * 
 * 실행: npx tsx scripts/seedTestData.ts
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    Timestamp
} from 'firebase/firestore';

// Firebase 설정 (환경변수 또는 직접 입력)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============= Sample Data =============

// Jobs (OCR 작업)
const sampleJobs = [
    {
        id: "job_2024_customer_satisfaction",
        name: "2024 고객만족도 조사",
        status: "completed",
        progress: 100,
        createdAt: new Date("2024-01-16T10:30:00").toISOString(),
        totalFiles: 50,
        pages: [
            { id: "page_1", pageNumber: 1, status: "valid", imageUrl: "https://placehold.co/595x842/png?text=Survey+Page+1" },
            { id: "page_2", pageNumber: 2, status: "valid", imageUrl: "https://placehold.co/595x842/png?text=Survey+Page+2" },
            { id: "page_3", pageNumber: 3, status: "warning", imageUrl: "https://placehold.co/595x842/png?text=Survey+Page+3" },
        ],
        results: {
            "page_1": {
                fields: [
                    { id: "f1", label: "응답자명", value: "홍길동", type: "text", confidence: 0.95, status: "valid" },
                    { id: "f2", label: "만족도", value: 4, type: "number", confidence: 0.88, status: "valid" },
                    { id: "f3", label: "재구매 의향", value: true, type: "checkbox", confidence: 0.92, status: "valid" },
                ],
                boxes: [
                    { id: "b1", x: 50, y: 100, width: 200, height: 30, status: "valid", confidence: 0.95 },
                    { id: "b2", x: 50, y: 150, width: 100, height: 30, status: "valid", confidence: 0.88 },
                ]
            },
            "page_2": {
                fields: [
                    { id: "f4", label: "서비스 품질", value: 5, type: "number", confidence: 0.91, status: "valid" },
                    { id: "f5", label: "추천 의향", value: 4, type: "number", confidence: 0.78, status: "warning" },
                ],
                boxes: []
            }
        }
    },
    {
        id: "job_employee_survey",
        name: "직원 설문조사 A팀",
        status: "processing",
        progress: 45,
        createdAt: new Date("2024-01-17T09:00:00").toISOString(),
        totalFiles: 30,
        pages: [
            { id: "page_1", pageNumber: 1, status: "valid", imageUrl: "https://placehold.co/595x842/png?text=Employee+Survey+1" },
        ],
        results: {}
    },
    {
        id: "job_service_feedback",
        name: "신규 서비스 피드백",
        status: "error",
        progress: 60,
        createdAt: new Date("2024-01-15T14:22:00").toISOString(),
        totalFiles: 15,
        pages: [
            { id: "page_1", pageNumber: 1, status: "error", imageUrl: "https://placehold.co/595x842/png?text=Service+Feedback" },
        ],
        results: {}
    }
];

// Projects (프로젝트)
const sampleProjects = [
    {
        id: "project_customer_research",
        name: "고객 리서치",
        description: "2024년 고객 만족도 및 니즈 조사",
        status: "active",
        createdAt: new Date("2024-01-01").toISOString(),
        updatedAt: new Date("2024-01-16").toISOString(),
        jobCount: 3,
        totalFiles: 95
    },
    {
        id: "project_employee_engagement",
        name: "직원 참여도 조사",
        description: "분기별 직원 참여도 및 만족도 측정",
        status: "active",
        createdAt: new Date("2024-01-05").toISOString(),
        updatedAt: new Date("2024-01-17").toISOString(),
        jobCount: 2,
        totalFiles: 60
    },
    {
        id: "project_product_feedback",
        name: "제품 피드백 수집",
        description: "신제품 사용성 테스트 결과",
        status: "completed",
        createdAt: new Date("2023-12-15").toISOString(),
        updatedAt: new Date("2024-01-10").toISOString(),
        jobCount: 5,
        totalFiles: 200
    }
];

// Analysis Results (분석 결과)
const sampleAnalysisResults = [
    {
        id: "analysis_2024_customer",
        projectId: "project_customer_research",
        name: "2024 고객만족도 분석 결과",
        createdAt: new Date("2024-01-16T15:00:00").toISOString(),
        analysisType: ["basicStats", "correlation", "ipa"],
        summary: {
            totalResponses: 150,
            averageSatisfaction: 4.2,
            nps: 45
        },
        basicStats: {
            satisfaction: { mean: 4.2, median: 4, mode: 5, stdDev: 0.8 },
            serviceQuality: { mean: 4.0, median: 4, mode: 4, stdDev: 0.9 },
            recommendation: { mean: 4.5, median: 5, mode: 5, stdDev: 0.7 }
        },
        correlation: {
            variables: ["만족도", "서비스품질", "추천의향", "가격만족"],
            matrix: [
                [1.0, 0.75, 0.82, 0.45],
                [0.75, 1.0, 0.68, 0.52],
                [0.82, 0.68, 1.0, 0.38],
                [0.45, 0.52, 0.38, 1.0]
            ]
        },
        ipa: {
            items: [
                { name: "응대 친절도", importance: 4.5, performance: 4.2, quadrant: "keep" },
                { name: "문제 해결력", importance: 4.8, performance: 3.5, quadrant: "concentrate" },
                { name: "대기 시간", importance: 3.2, performance: 3.8, quadrant: "lowPriority" },
                { name: "부가 서비스", importance: 2.8, performance: 4.0, quadrant: "overkill" }
            ]
        }
    }
];

// Reports (리포트)
const sampleReports = [
    {
        id: "report_customer_2024_q1",
        name: "2024 상반기 고객 만족도 분석",
        projectId: "project_customer_research",
        analysisId: "analysis_2024_customer",
        format: "PDF",
        size: "2.4 MB",
        createdAt: new Date("2024-01-16T14:30:00").toISOString(),
        status: "ready"
    },
    {
        id: "report_employee_2024",
        name: "직원 만족도 경향성 보고서",
        projectId: "project_employee_engagement",
        format: "PowerPoint",
        size: "5.1 MB",
        createdAt: new Date("2024-01-15T10:15:00").toISOString(),
        status: "ready"
    }
];

// Validation Queue (미확정 항목)
const sampleValidationQueue = [
    {
        id: "queue_item_1",
        jobId: "job_2024_customer_satisfaction",
        pageId: "page_3",
        fieldId: "f5",
        label: "추천 의향",
        value: "4",
        confidence: 0.78,
        reason: "신뢰도 낮음",
        createdAt: new Date("2024-01-16T11:00:00").toISOString()
    },
    {
        id: "queue_item_2",
        jobId: "job_service_feedback",
        pageId: "page_1",
        fieldId: "f1",
        label: "서비스 평점",
        value: "?",
        confidence: 0.45,
        reason: "인식 불가",
        createdAt: new Date("2024-01-15T15:00:00").toISOString()
    }
];

// ============= Seed Functions =============

async function seedCollection(collectionName: string, data: any[]) {
    console.log(`Seeding ${collectionName}...`);
    for (const item of data) {
        const docRef = doc(db, collectionName, item.id);
        await setDoc(docRef, item);
        console.log(`  - Added: ${item.name || item.id}`);
    }
    console.log(`✓ ${collectionName} seeded (${data.length} items)`);
}

async function seedAllData() {
    console.log("=== Starting Test Data Seed ===\n");

    try {
        await seedCollection("jobs", sampleJobs);
        await seedCollection("projects", sampleProjects);
        await seedCollection("analysisResults", sampleAnalysisResults);
        await seedCollection("reports", sampleReports);
        await seedCollection("validationQueue", sampleValidationQueue);

        console.log("\n=== Seed Complete ===");
        console.log("Test data has been added to Firestore.");
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

// Run
seedAllData();
