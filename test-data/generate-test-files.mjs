/**
 * 테스트 데이터 파일 생성 스크립트
 * 
 * 실행: node test-data/generate-test-files.mjs
 */

import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 출력 디렉토리 확인
const outputDir = __dirname;
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

// ============================================
// 1. Excel 설문 응답 데이터 생성
// ============================================

/**
 * 고객 만족도 설문조사 데이터 생성
 */
function generateSatisfactionSurvey() {
    // 헤더 (문항)
    const headers = [
        '응답자ID',
        'Q1. 서비스 전반적 만족도',
        'Q2. 직원 친절도',
        'Q3. 시설 청결도',
        'Q4. 가격 적정성',
        'Q5. 서비스 품질',
        'Q6. 재방문 의향',
        'Q7. 추천 의향',
        'Q8. 대기시간 만족도',
        'Q9. 안내 정보 명확성',
        'Q10. 개선 요청사항'
    ];

    // 응답 데이터 생성 (50명)
    const data = [headers];

    // 개선 요청사항 보기
    const suggestions = [
        '대기시간 단축 필요',
        '주차공간 확대',
        '온라인 예약 시스템 개선',
        '야간 운영시간 연장',
        '휴게공간 확대',
        '직원 전문성 향상',
        '가격 인하',
        '없음'
    ];

    for (let i = 1; i <= 50; i++) {
        const respondentId = `R${String(i).padStart(3, '0')}`;
        const row = [
            respondentId,
            randomLikert(),           // Q1
            randomLikert(),           // Q2
            randomLikert(),           // Q3
            randomLikert(),           // Q4
            randomLikert(),           // Q5
            randomLikert(),           // Q6 재방문 의향
            randomLikert(),           // Q7 추천 의향
            randomLikert(),           // Q8
            randomLikert(),           // Q9
            suggestions[Math.floor(Math.random() * suggestions.length)] // Q10
        ];
        data.push(row);
    }

    // Excel 파일 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 컬럼 너비 설정
    ws['!cols'] = [
        { wch: 10 },  // 응답자ID
        { wch: 25 },  // Q1
        { wch: 18 },  // Q2
        { wch: 18 },  // Q3
        { wch: 18 },  // Q4
        { wch: 18 },  // Q5
        { wch: 18 },  // Q6
        { wch: 18 },  // Q7
        { wch: 20 },  // Q8
        { wch: 22 },  // Q9
        { wch: 25 }   // Q10
    ];

    XLSX.utils.book_append_sheet(wb, ws, '고객만족도조사');
    XLSX.writeFile(wb, join(outputDir, 'survey_satisfaction_data.xlsx'));
    console.log('✅ survey_satisfaction_data.xlsx 생성 완료 (50명 응답)');
}

/**
 * IPA 분석용 설문 데이터 생성 (중요도-성과 쌍)
 */
function generateIPASurvey() {
    const headers = [
        '응답자ID',
        '[서비스품질] 중요도',
        '[서비스품질] 만족도',
        '[직원친절] 중요도',
        '[직원친절] 만족도',
        '[시설환경] 중요도',
        '[시설환경] 만족도',
        '[가격] 중요도',
        '[가격] 만족도',
        '[접근성] 중요도',
        '[접근성] 만족도'
    ];

    const data = [headers];

    for (let i = 1; i <= 40; i++) {
        const respondentId = `R${String(i).padStart(3, '0')}`;

        // IPA 분석을 위해 의도적으로 패턴 있는 데이터 생성
        // 서비스품질: 중요도 높음, 만족도 보통
        // 직원친절: 중요도 높음, 만족도 높음
        // 시설환경: 중요도 보통, 만족도 낮음
        // 가격: 중요도 매우 높음, 만족도 낮음
        // 접근성: 중요도 낮음, 만족도 높음

        const row = [
            respondentId,
            randomLikertWeighted(4, 5),    // 서비스품질 중요도 (높음)
            randomLikertWeighted(3, 4),    // 서비스품질 만족도 (보통~높음)
            randomLikertWeighted(4, 5),    // 직원친절 중요도 (높음)
            randomLikertWeighted(4, 5),    // 직원친절 만족도 (높음)
            randomLikertWeighted(3, 4),    // 시설환경 중요도 (보통)
            randomLikertWeighted(2, 3),    // 시설환경 만족도 (낮음~보통)
            randomLikertWeighted(5, 5),    // 가격 중요도 (매우 높음)
            randomLikertWeighted(2, 3),    // 가격 만족도 (낮음)
            randomLikertWeighted(2, 3),    // 접근성 중요도 (낮음)
            randomLikertWeighted(4, 5)     // 접근성 만족도 (높음)
        ];
        data.push(row);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = Array(11).fill({ wch: 20 });

    XLSX.utils.book_append_sheet(wb, ws, 'IPA분석데이터');
    XLSX.writeFile(wb, join(outputDir, 'survey_ipa_data.xlsx'));
    console.log('✅ survey_ipa_data.xlsx 생성 완료 (40명 응답, IPA 분석용)');
}

/**
 * 소규모 테스트 데이터 (빠른 테스트용)
 */
function generateSmallTestData() {
    const headers = [
        '응답자ID',
        'Q1. 전반적 만족도',
        'Q2. 추천 의향',
        'Q3. 재방문 의향'
    ];

    const data = [
        headers,
        ['R001', 5, 5, 4],
        ['R002', 4, 4, 5],
        ['R003', 3, 3, 3],
        ['R004', 4, 5, 4],
        ['R005', 5, 4, 5],
        ['R006', 2, 2, 3],
        ['R007', 4, 4, 4],
        ['R008', 3, 3, 4],
        ['R009', 5, 5, 5],
        ['R010', 4, 3, 4]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, '테스트');
    XLSX.writeFile(wb, join(outputDir, 'survey_test_small.xlsx'));
    console.log('✅ survey_test_small.xlsx 생성 완료 (10명 응답, 빠른 테스트용)');
}

// ============================================
// 유틸리티 함수
// ============================================

function randomLikert() {
    // 1-5 리커트 척도 (정규분포에 가깝게)
    const weights = [0.05, 0.15, 0.30, 0.35, 0.15]; // 1,2,3,4,5 비율
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) return i + 1;
    }
    return 3;
}

function randomLikertWeighted(min, max) {
    // min ~ max 사이에서 더 자주 나오도록 가중치 부여
    const range = max - min;
    const base = min + Math.floor(Math.random() * (range + 1));

    // 약간의 변동 추가 (-1 ~ +1)
    const variation = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    return Math.max(1, Math.min(5, base + variation));
}

// ============================================
// 실행
// ============================================

console.log('📊 테스트 데이터 파일 생성 중...\n');

generateSatisfactionSurvey();
generateIPASurvey();
generateSmallTestData();

console.log('\n✨ 모든 테스트 데이터 파일이 생성되었습니다!');
console.log(`📁 위치: ${outputDir}`);
