/**
 * ocrParser.ts
 * 
 * OCR 결과물을 구조화된 문항/답변 데이터로 정규화
 * - 문항(Question) 인식: 번호 패턴, 키워드 기반
 * - 답변(Answer) 추출: 문항 다음에 오는 값
 * - 체크박스 판별: 특수문자 및 패턴 인식
 */

// ============================================
// 1. 타입 정의
// ============================================

export interface ParsedQuestion {
    id: string;
    number: number;
    text: string;
    type: 'text' | 'number' | 'checkbox' | 'multiselect' | 'likert';
    options?: string[];  // 선택지 (있는 경우)
}

export interface ParsedAnswer {
    questionId: string;
    value: string | number | boolean | string[];
    confidence: number;
    rawText: string;
}

export interface ParsedSurveyPage {
    pageNumber: number;
    questions: ParsedQuestion[];
    answers: ParsedAnswer[];
    respondentId?: string;
}

// ============================================
// 2. 문항 번호 패턴
// ============================================

// 다양한 문항 번호 패턴
const QUESTION_PATTERNS = [
    /^(\d+)\.\s*(.+)$/,                    // "1. 질문내용"
    /^Q(\d+)[.\s]*(.+)$/i,                 // "Q1. 질문내용" 또는 "Q1 질문내용"
    /^문(\d+)[.\s]*(.+)$/,                 // "문1. 질문내용"
    /^(\d+)\)\s*(.+)$/,                    // "1) 질문내용"
    /^\[(\d+)\]\s*(.+)$/,                  // "[1] 질문내용"
    /^【(\d+)】\s*(.+)$/,                  // "【1】질문내용"
    /^제(\d+)문[.\s]*(.+)$/,               // "제1문. 질문내용"
];

// 선택지 패턴
const OPTION_PATTERNS = [
    /^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.+)$/,         // ①매우불만족
    /^[ⓐⓑⓒⓓⓔ]\s*(.+)$/i,                // ⓐ 선택지
    /^[○●]\s*(.+)$/,                      // ○ 선택지
    /^[가나다라마바사]\.\s*(.+)$/,         // 가. 선택지
];

// ============================================
// 3. 체크박스 판별
// ============================================

// 체크된 상태를 나타내는 문자들
const CHECKED_SYMBOLS = [
    '☑', '✓', '✔', '■', '●', '◉', '⬛', '✅',
    '[x]', '[X]', '[v]', '[V]', '(v)', '(V)'
];

// 체크되지 않은 상태를 나타내는 문자들
const UNCHECKED_SYMBOLS = [
    '☐', '□', '○', '◯', '◻', '⬜', '[ ]', '()'
];

/**
 * 텍스트가 체크박스 패턴인지 확인하고 체크 상태 반환
 */
export function detectCheckbox(text: string): { isCheckbox: boolean; checked: boolean | null } {
    const trimmed = text.trim();

    // 체크된 상태 확인
    for (const symbol of CHECKED_SYMBOLS) {
        if (trimmed.includes(symbol)) {
            return { isCheckbox: true, checked: true };
        }
    }

    // 체크되지 않은 상태 확인
    for (const symbol of UNCHECKED_SYMBOLS) {
        if (trimmed.includes(symbol)) {
            return { isCheckbox: true, checked: false };
        }
    }

    return { isCheckbox: false, checked: null };
}

/**
 * 손글씨 체크 표시 인식 (좌표 기반)
 * - 체크박스 영역 내에 잉크가 있는지 확인
 */
export function detectHandwrittenCheck(
    boxBounds: { x: number; y: number; width: number; height: number },
    inkPoints: { x: number; y: number }[]
): boolean {
    if (inkPoints.length === 0) return false;

    let pointsInBox = 0;

    for (const point of inkPoints) {
        if (
            point.x >= boxBounds.x &&
            point.x <= boxBounds.x + boxBounds.width &&
            point.y >= boxBounds.y &&
            point.y <= boxBounds.y + boxBounds.height
        ) {
            pointsInBox++;
        }
    }

    // 박스 내에 일정 비율 이상의 점이 있으면 체크된 것으로 판단
    const coverageRatio = pointsInBox / inkPoints.length;
    return coverageRatio > 0.3;
}

// ============================================
// 4. 리커트 척도 인식
// ============================================

const LIKERT_PATTERNS: { pattern: RegExp; value: number }[] = [
    // 5점 척도
    { pattern: /매우\s*(불만족|나쁨|싫음|동의하지\s*않음)/i, value: 1 },
    { pattern: /^(불만족|나쁨|싫음|동의하지\s*않음)$/i, value: 2 },
    { pattern: /^(보통|중간|그저\s*그럼)$/i, value: 3 },
    { pattern: /^(만족|좋음|좋아함|동의)$/i, value: 4 },
    { pattern: /매우\s*(만족|좋음|좋아함|동의)/i, value: 5 },

    // 숫자 점수
    { pattern: /^1점?$/i, value: 1 },
    { pattern: /^2점?$/i, value: 2 },
    { pattern: /^3점?$/i, value: 3 },
    { pattern: /^4점?$/i, value: 4 },
    { pattern: /^5점?$/i, value: 5 },
];

/**
 * 리커트 척도 값 추출
 */
export function parseLikertValue(text: string): { isLikert: boolean; value: number | null } {
    const trimmed = text.trim();

    for (const { pattern, value } of LIKERT_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { isLikert: true, value };
        }
    }

    // 단순 숫자 (1-5, 1-7, 1-10 범위)
    const numMatch = trimmed.match(/^(\d+)$/);
    if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num >= 1 && num <= 10) {
            return { isLikert: true, value: num };
        }
    }

    return { isLikert: false, value: null };
}

// ============================================
// 5. OCR 텍스트 파싱
// ============================================

/**
 * OCR 텍스트 블록을 문항으로 파싱
 */
export function parseQuestion(text: string, index: number): ParsedQuestion | null {
    const trimmed = text.trim();

    for (const pattern of QUESTION_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            const number = parseInt(match[1]);
            const questionText = match[2].trim();

            // 문항 타입 추론
            let type: ParsedQuestion['type'] = 'text';

            if (questionText.includes('체크') || questionText.includes('해당')) {
                type = 'checkbox';
            } else if (questionText.includes('점수') || questionText.includes('평가')) {
                type = 'likert';
            } else if (questionText.match(/\d+점|척도/)) {
                type = 'likert';
            }

            return {
                id: `Q${number}`,
                number,
                text: questionText,
                type
            };
        }
    }

    return null;
}

/**
 * 답변 텍스트 파싱
 */
export function parseAnswer(
    text: string,
    questionId: string,
    questionType: ParsedQuestion['type']
): ParsedAnswer {
    const trimmed = text.trim();
    let value: ParsedAnswer['value'] = trimmed;
    let confidence = 0.8;

    switch (questionType) {
        case 'checkbox': {
            const checkResult = detectCheckbox(trimmed);
            if (checkResult.isCheckbox) {
                value = checkResult.checked ?? false;
                confidence = 0.95;
            }
            break;
        }

        case 'likert': {
            const likertResult = parseLikertValue(trimmed);
            if (likertResult.isLikert && likertResult.value !== null) {
                value = likertResult.value;
                confidence = 0.9;
            }
            break;
        }

        case 'number': {
            const numMatch = trimmed.match(/^-?\d+\.?\d*$/);
            if (numMatch) {
                value = parseFloat(numMatch[0]);
                confidence = 0.95;
            }
            break;
        }

        default:
            // 텍스트로 유지
            value = trimmed;
    }

    return {
        questionId,
        value,
        confidence,
        rawText: text
    };
}

/**
 * OCR 결과 전체를 파싱하여 구조화된 데이터로 변환
 */
export function parseOCRResult(
    textBlocks: Array<{ text: string; confidence?: number; bounds?: any }>,
    pageNumber: number
): ParsedSurveyPage {
    const questions: ParsedQuestion[] = [];
    const answers: ParsedAnswer[] = [];

    let currentQuestion: ParsedQuestion | null = null;
    let questionIndex = 0;

    for (const block of textBlocks) {
        const text = block.text;

        // 문항 패턴 확인
        const parsedQ = parseQuestion(text, questionIndex);
        if (parsedQ) {
            currentQuestion = parsedQ;
            questions.push(parsedQ);
            questionIndex++;
            continue;
        }

        // 현재 문항에 대한 답변으로 처리
        if (currentQuestion) {
            const answer = parseAnswer(text, currentQuestion.id, currentQuestion.type);
            answer.confidence = block.confidence ?? answer.confidence;
            answers.push(answer);
        }
    }

    return {
        pageNumber,
        questions,
        answers
    };
}

/**
 * 원본 텍스트에서 응답자 ID 추출 시도
 */
export function extractRespondentId(text: string): string | null {
    const patterns = [
        /응답자[\s:]*([A-Z0-9]+)/i,
        /ID[\s:]*([A-Z0-9]+)/i,
        /번호[\s:]*(\d+)/,
        /^([A-Z]\d{3,})$/,  // A001 형식
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

export default {
    detectCheckbox,
    detectHandwrittenCheck,
    parseLikertValue,
    parseQuestion,
    parseAnswer,
    parseOCRResult,
    extractRespondentId
};
