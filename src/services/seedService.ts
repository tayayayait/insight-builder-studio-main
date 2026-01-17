/**
 * Test Data Seed Service
 * 브라우저에서 Firestore에 테스트 데이터를 직접 생성합니다.
 * 개발 환경에서만 사용하세요.
 * 
 * 사용법: 브라우저 콘솔에서 window.seedTestData() 호출
 */

import { db } from "./firestore";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

// ============= Sample Data =============

const sampleJobs = [
    {
        id: "job_2024_customer_satisfaction",
        name: "2024 고객만족도 조사",
        status: "completed",
        progress: 100,
        createdAt: new Date("2024-01-16T10:30:00").toISOString(),
        totalFiles: 50,
        pages: [
            { id: "page_1", pageNumber: 1, status: "valid", imageUrl: "https://placehold.co/595x842/f0f0f0/333?text=Survey+Page+1" },
            { id: "page_2", pageNumber: 2, status: "valid", imageUrl: "https://placehold.co/595x842/f0f0f0/333?text=Survey+Page+2" },
            { id: "page_3", pageNumber: 3, status: "warning", imageUrl: "https://placehold.co/595x842/f0f0f0/333?text=Survey+Page+3" },
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
            },
            "page_3": {
                fields: [
                    { id: "f6", label: "개선 의견", value: "배송이 더 빨랐으면 좋겠습니다", type: "text", confidence: 0.65, status: "warning" },
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
            { id: "page_1", pageNumber: 1, status: "valid", imageUrl: "https://placehold.co/595x842/e0e0ff/333?text=Employee+Survey" },
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
            { id: "page_1", pageNumber: 1, status: "error", imageUrl: "https://placehold.co/595x842/ffe0e0/333?text=Service+Feedback" },
        ],
        results: {}
    }
];

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
    }
];

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

// ============= Seed Functions =============

async function seedCollection(collectionName: string, data: any[]) {
    console.log(`Seeding ${collectionName}...`);
    for (const item of data) {
        const docRef = doc(db, collectionName, item.id);
        await setDoc(docRef, item);
        console.log(`  ✓ Added: ${item.name || item.id}`);
    }
    console.log(`✅ ${collectionName} seeded (${data.length} items)\n`);
}

async function clearCollection(collectionName: string) {
    console.log(`Clearing ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
    }
    console.log(`  Cleared ${snapshot.size} items`);
}

export async function seedTestData() {
    console.log("=== 테스트 데이터 시드 시작 ===\n");

    try {
        await seedCollection("jobs", sampleJobs);
        await seedCollection("projects", sampleProjects);
        await seedCollection("analysisResults", sampleAnalysisResults);

        console.log("=== 시드 완료 ===");
        console.log("테스트 데이터가 Firestore에 추가되었습니다.");
        console.log("페이지를 새로고침하여 확인하세요.");
        return true;
    } catch (error) {
        console.error("시드 실패:", error);
        return false;
    }
}

export async function clearTestData() {
    console.log("=== 테스트 데이터 삭제 시작 ===\n");

    try {
        await clearCollection("jobs");
        await clearCollection("projects");
        await clearCollection("analysisResults");

        console.log("\n=== 삭제 완료 ===");
        return true;
    } catch (error) {
        console.error("삭제 실패:", error);
        return false;
    }
}

// Expose to window for easy access in browser console
if (typeof window !== 'undefined') {
    (window as any).seedTestData = seedTestData;
    (window as any).clearTestData = clearTestData;
}
