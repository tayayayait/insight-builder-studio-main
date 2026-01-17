/**
 * AnalysisService.ts
 * 
 * 통계 분석 엔진 - PDF OCR 결과 및 Excel 데이터를 분석
 * 사용 라이브러리: simple-statistics
 */

import {
    mean,
    variance,
    standardDeviation,
    sampleCorrelation,
    min,
    max,
    median,
    mode as getMode,
    sum
} from 'simple-statistics';

// ============================================
// 1. 공통 데이터 타입 정의
// ============================================

/** 설문 응답 데이터 (PDF/Excel 공통 포맷) */
export interface SurveyResponse {
    id: string;
    respondentId: string;  // 응답자 ID
    questionId: string;    // 문항 ID (예: Q1, Q2)
    questionLabel: string; // 문항 텍스트
    value: number | string | boolean; // 응답 값
    category?: string;     // 문항 카테고리 (예: 서비스 품질, 가격 만족도)
    type: 'likert' | 'numeric' | 'text' | 'boolean'; // 응답 유형
}

/** 분석 대상 데이터셋 */
export interface AnalysisDataset {
    projectId: string;
    projectName: string;
    responses: SurveyResponse[];
    metadata: {
        totalRespondents: number;
        collectedAt: string;
        source: 'ocr' | 'excel' | 'mixed';
    };
}

// ============================================
// 2. 기본 통계 분석 결과 타입
// ============================================

export interface BasicStats {
    count: number;
    mean: number;
    median: number;
    mode: number | null;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
    sum: number;
}

export interface FrequencyDistribution {
    value: number | string | boolean;
    count: number;
    percentage: number;
}

export interface QuestionStats {
    questionId: string;
    questionLabel: string;
    category?: string;
    responseType: SurveyResponse['type'];
    responseCount: number;
    stats: BasicStats;
    distribution: FrequencyDistribution[];
}

export interface TextQuestionSummary {
    questionId: string;
    questionLabel: string;
    responseCount: number;
    averageLength: number;
    topKeywords: string[];
}

// ============================================
// 3. 상관관계 분석 결과 타입
// ============================================

export interface CorrelationResult {
    variable1: string;
    variable2: string;
    correlation: number;  // -1 ~ 1
    strength: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface CorrelationMatrix {
    variables: string[];
    matrix: number[][];  // 2D array of correlation values
}

// ============================================
// 4. T-Test 결과 타입
// ============================================

export interface TTestResult {
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
    significant: boolean;  // p < 0.05
}

// ============================================
// 5. IPA (Importance-Performance Analysis) 타입
// ============================================

export interface IPAItem {
    questionId: string;
    label: string;
    importance: number;  // 중요도 (X축)
    performance: number; // 만족도/성과 (Y축)
    quadrant: 1 | 2 | 3 | 4;  // 사분면
}

export interface IPAResult {
    items: IPAItem[];
    importanceMean: number;
    performanceMean: number;
    method?: 'stated' | 'derived';
}

const IPA_IMPORTANCE_TOKENS = [
    '중요도',
    '중요성',
    '중요',
    'importance'
];

const IPA_PERFORMANCE_TOKENS = [
    '만족도',
    '만족',
    '성과',
    'performance',
    'satisfaction'
];

const TTEST_PRE_TOKENS = [
    '사전',
    'pre',
    'before',
    'baseline',
    '1차',
    '1회',
    't1',
    'time1'
];

const TTEST_POST_TOKENS = [
    '사후',
    'post',
    'after',
    'followup',
    '2차',
    '2회',
    't2',
    'time2'
];

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const TEXT_TOKEN_REGEX = /[A-Za-z0-9\uAC00-\uD7A3]+/g;
const TEXT_KEYWORD_STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'have', 'from', 'your', 'you',
    'are', 'was', 'were', 'what', 'when', 'where', 'which', 'into', 'onto',
    'our', 'their', 'they', 'them', 'then', 'than', 'but', 'not', 'yes', 'no',
    'ok', 'okay', 'very', 'much', 'more', 'less'
]);

const getDominantResponseType = (responses: SurveyResponse[]): SurveyResponse['type'] => {
    if (responses.length === 0) return 'text';
    const counts = new Map<SurveyResponse['type'], number>();
    responses.forEach(response => {
        counts.set(response.type, (counts.get(response.type) || 0) + 1);
    });

    let dominant: SurveyResponse['type'] = responses[0].type;
    let maxCount = 0;
    counts.forEach((count, type) => {
        if (count > maxCount) {
            maxCount = count;
            dominant = type;
        }
    });
    return dominant;
};

const extractTopKeywords = (values: string[], limit = 5): string[] => {
    const frequency = new Map<string, number>();

    values.forEach(value => {
        const normalized = value.toLowerCase();
        const tokens = normalized.match(TEXT_TOKEN_REGEX) || [];
        tokens.forEach(token => {
            const cleaned = token.replace(/_/g, '').trim();
            if (cleaned.length < 2) return;
            if (/^\d+$/.test(cleaned)) return;
            if (TEXT_KEYWORD_STOPWORDS.has(cleaned)) return;
            frequency.set(cleaned, (frequency.get(cleaned) || 0) + 1);
        });
    });

    return Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([token]) => token);
};

const summarizeTextResponses = (responses: SurveyResponse[]): { responseCount: number; averageLength: number; topKeywords: string[] } => {
    const textValues = responses
        .map(response => (typeof response.value === 'string' ? response.value.trim() : ''))
        .filter(value => value.length > 0);

    const responseCount = textValues.length;
    const totalLength = textValues.reduce((sum, value) => sum + value.length, 0);
    const averageLength = responseCount > 0 ? totalLength / responseCount : 0;
    const topKeywords = responseCount > 0 ? extractTopKeywords(textValues) : [];

    return { responseCount, averageLength, topKeywords };
};

const coerceNumericValue = (value: SurveyResponse['value']): number | null => {
    if (isFiniteNumber(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;

        const normalized = trimmed.replace(/\s+/g, '').toLowerCase();
        const likertKeywords: Array<{ key: string; score: number }> = [
            { key: '매우불만족', score: 1 },
            { key: '불만족', score: 2 },
            { key: '보통', score: 3 },
            { key: '만족', score: 4 },
            { key: '매우만족', score: 5 },
        ];

        for (const item of likertKeywords) {
            if (normalized.includes(item.key)) {
                return item.score;
            }
        }

        const upper = trimmed.toUpperCase();
        if (/(^|[\s\W])(O|YES|TRUE)([\s\W]|$)/.test(upper) || normalized === '예') {
            return 1;
        }
        if (/(^|[\s\W])(X|NO|FALSE)([\s\W]|$)/.test(upper) || normalized === '아니오') {
            return 0;
        }

        // Direct numeric parsing
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) return parsed;

        // Fallback: extract first numeric token inside the string
        const match = trimmed.match(/-?\d+(?:\.\d+)?/);
        if (match) {
            const tokenValue = Number(match[0]);
            return Number.isFinite(tokenValue) ? tokenValue : null;
        }
        return null;
    }
    return null;
};

const normalizeLabel = (label: string) =>
    label
        .toLowerCase()
        .replace(/\[[^\]]*\]|\([^\)]*\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const normalizeIpaKey = (label: string) => {
    let key = normalizeLabel(label);
    const tokens = [...IPA_IMPORTANCE_TOKENS, ...IPA_PERFORMANCE_TOKENS];
    tokens.forEach(token => {
        const regex = new RegExp(token, 'gi');
        key = key.replace(regex, ' ');
    });
    return key.replace(/[^a-z0-9가-힣]/gi, '').trim();
};

const detectIpaLabelType = (label: string): 'importance' | 'performance' | null => {
    const lower = label.toLowerCase();
    const hasImportance = IPA_IMPORTANCE_TOKENS.some(token => lower.includes(token));
    const hasPerformance = IPA_PERFORMANCE_TOKENS.some(token => lower.includes(token));
    if (hasImportance && hasPerformance) return null;
    if (hasImportance) return 'importance';
    if (hasPerformance) return 'performance';
    return null;
};

const detectTTestTimepoint = (label: string): 'pre' | 'post' | null => {
    const lower = label.toLowerCase();
    const matchesToken = (token: string) => {
        if (/^[a-z0-9]+$/i.test(token)) {
            return new RegExp(`\\b${token}\\b`, 'i').test(lower);
        }
        return lower.includes(token);
    };
    const hasPre = TTEST_PRE_TOKENS.some(matchesToken);
    const hasPost = TTEST_POST_TOKENS.some(matchesToken);

    if (hasPre && hasPost) return null;
    if (hasPre) return 'pre';
    if (hasPost) return 'post';

    // Korean single-char tokens are too noisy; only match when bracketed
    if (/(^|[\s\(\[])전($|[\s\)\]])/i.test(label)) return 'pre';
    if (/(^|[\s\(\[])후($|[\s\)\]])/i.test(label)) return 'post';
    return null;
};

const normalizeTTestKey = (label: string) => {
    let key = normalizeLabel(label);
    [...TTEST_PRE_TOKENS, ...TTEST_POST_TOKENS].forEach(token => {
        const regex = new RegExp(token, 'gi');
        key = key.replace(regex, ' ');
    });
    key = key.replace(/(^|[\s\(\[])전($|[\s\)\]])/gi, ' ');
    key = key.replace(/(^|[\s\(\[])후($|[\s\)\]])/gi, ' ');
    return key.replace(/[^a-z0-9가-힣]/gi, '').trim();
};

const logGamma = (z: number): number => {
    const g = 7;
    const p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    if (z < 0.5) {
        return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }

    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) {
        x += p[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
};

const betacf = (a: number, b: number, x: number): number => {
    const MAXIT = 100;
    const EPS = 3e-7;
    const FPMIN = 1e-30;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= MAXIT; m++) {
        let m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;

        aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;

        if (Math.abs(del - 1.0) < EPS) break;
    }

    return h;
};

const regularizedIncompleteBeta = (x: number, a: number, b: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const bt = Math.exp(
        logGamma(a + b) - logGamma(a) - logGamma(b) +
        a * Math.log(x) +
        b * Math.log(1 - x)
    );

    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betacf(a, b, x)) / a;
    }

    return 1 - (bt * betacf(b, a, 1 - x)) / b;
};

const studentTCdf = (t: number, df: number): number => {
    if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return 0.5;
    const x = df / (df + t * t);
    const a = df / 2;
    const b = 0.5;
    const ib = regularizedIncompleteBeta(x, a, b);
    if (t >= 0) {
        return 1 - 0.5 * ib;
    }
    return 0.5 * ib;
};

// ============================================
// 6. 분석 서비스 클래스
// ============================================

export const analysisService = {
    /**
     * 숫자형 응답값만 추출
     */
    extractNumericValues(
        responses: SurveyResponse[],
        questionId: string,
        options?: { includeBoolean?: boolean; includeText?: boolean }
    ): number[] {
        return responses
            .filter(r => r.questionId === questionId)
            .map(r => {
                if (!options?.includeText && r.type === 'text') return null;
                if (options?.includeBoolean === false && r.type === 'boolean') return null;
                return coerceNumericValue(r.value);
            })
            .filter((value): value is number => value !== null);
    },

    /**
     * 문항 메타 정보 맵 생성
     */
    getQuestionMeta(dataset: AnalysisDataset): Map<string, { label: string; category?: string; type: SurveyResponse['type'] }> {
        const map = new Map<string, { label: string; category?: string; type: SurveyResponse['type'] }>();
        dataset.responses.forEach(response => {
            if (!map.has(response.questionId)) {
                map.set(response.questionId, {
                    label: response.questionLabel || response.questionId,
                    category: response.category,
                    type: response.type
                });
            }
        });
        return map;
    },

    /**
     * 숫자형 문항 ID 목록
     */
    getNumericQuestionIds(
        dataset: AnalysisDataset,
        minCount = 1,
        options?: { includeBoolean?: boolean; includeText?: boolean }
    ): string[] {
        const counts = new Map<string, number>();
        dataset.responses.forEach(response => {
            if (!options?.includeText && response.type === 'text') return;
            if (options?.includeBoolean === false && response.type === 'boolean') return;
            const numericValue = coerceNumericValue(response.value);
            if (numericValue === null) return;
            counts.set(response.questionId, (counts.get(response.questionId) || 0) + 1);
        });
        return Array.from(counts.entries())
            .filter(([, count]) => count >= minCount)
            .map(([questionId]) => questionId);
    },

    /**
     * 기본 통계 계산 (평균, 중앙값, 최빈값, 분산 등)
     */
    calculateBasicStats(values: number[]): BasicStats {
        if (values.length === 0) {
            return {
                count: 0, mean: 0, median: 0, mode: null,
                min: 0, max: 0, variance: 0, stdDev: 0, sum: 0
            };
        }

        const modeResult = getMode(values);
        const modeValue = Array.isArray(modeResult) ? modeResult[0] : modeResult;
        const varianceValue = values.length > 1 ? variance(values) : 0;
        const stdDevValue = values.length > 1 ? standardDeviation(values) : 0;

        return {
            count: values.length,
            mean: mean(values),
            median: median(values),
            mode: typeof modeValue === 'number' ? modeValue : null,
            min: min(values),
            max: max(values),
            variance: varianceValue,
            stdDev: stdDevValue,
            sum: sum(values)
        };
    },

    /**
     * 빈도 분포 계산
     */
    calculateFrequencyDistribution(values: (number | string | boolean)[]): FrequencyDistribution[] {
        if (values.length === 0) return [];

        const frequencyMap = new Map<number | string | boolean, number>();

        values.forEach(v => {
            frequencyMap.set(v, (frequencyMap.get(v) || 0) + 1);
        });

        const total = values.length;
        const distribution: FrequencyDistribution[] = [];

        frequencyMap.forEach((count, value) => {
            distribution.push({
                value,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0
            });
        });

        // Sort by value (ascending)
        return distribution.sort((a, b) => {
            if (typeof a.value === 'number' && typeof b.value === 'number') {
                return a.value - b.value;
            }
            return String(a.value).localeCompare(String(b.value));
        });
    },

    /**
     * 문항별 통계 분석
     */
    analyzeQuestions(dataset: AnalysisDataset): QuestionStats[] {
        const questionIds = [...new Set(dataset.responses.map(r => r.questionId))];

        return questionIds.map(questionId => {
            const questionResponses = dataset.responses.filter(r => r.questionId === questionId);
            const firstResponse = questionResponses[0];
            const responseType = getDominantResponseType(questionResponses);
            const responseCount = questionResponses.length;

            const numericValues = this.extractNumericValues(dataset.responses, questionId);
            const allValues = questionResponses.map(r => r.value);

            return {
                questionId,
                questionLabel: firstResponse?.questionLabel || questionId,
                category: firstResponse?.category,
                responseType,
                responseCount,
                stats: this.calculateBasicStats(numericValues),
                distribution: this.calculateFrequencyDistribution(allValues)
            };
        });
    },

    /**
     * 상관관계 분석 (두 변수 간)
     */
    calculateCorrelation(values1: number[], values2: number[]): CorrelationResult {
        if (values1.length !== values2.length || values1.length < 3) {
            return {
                variable1: '',
                variable2: '',
                correlation: 0,
                strength: 'none'
            };
        }

        const r = this.safeCorrelation(values1, values2);
        const absR = Math.abs(r);

        let strength: CorrelationResult['strength'] = 'none';
        if (absR >= 0.7) strength = 'strong';
        else if (absR >= 0.4) strength = 'moderate';
        else if (absR >= 0.2) strength = 'weak';

        return {
            variable1: '',
            variable2: '',
            correlation: r,
            strength
        };
    },

    /**
     * 상관계수 안전 계산
     */
    safeCorrelation(values1: number[], values2: number[]): number {
        if (values1.length < 3 || values2.length < 3) return 0;
        try {
            const r = sampleCorrelation(values1, values2);
            return Number.isFinite(r) ? r : 0;
        } catch (error) {
            return 0;
        }
    },

    /**
     * 상관관계 매트릭스 생성
     */
    generateCorrelationMatrix(dataset: AnalysisDataset, questionIds?: string[]): CorrelationMatrix {
        const numericQuestionIds = questionIds && questionIds.length > 0
            ? questionIds
            : this.getNumericQuestionIds(dataset, 2);

        const questionMeta = this.getQuestionMeta(dataset);
        const variables = numericQuestionIds.map(id => questionMeta.get(id)?.label || id);
        const n = variables.length;
        const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

        if (n === 0) {
            return { variables: [], matrix: [] };
        }

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1;
                } else if (j > i) {
                    const questionId1 = numericQuestionIds[i];
                    const questionId2 = numericQuestionIds[j];

                    // Align data by respondentId
                    const aligned = this.alignDataByRespondent(dataset.responses, questionId1, questionId2);

                    if (aligned.values1.length >= 3) {
                        const r = this.safeCorrelation(aligned.values1, aligned.values2);
                        matrix[i][j] = r;
                        matrix[j][i] = r;
                    }
                }
            }
        }

        return { variables, matrix };
    },

    /**
     * 응답자 ID 기준으로 데이터 정렬 (상관분석용)
     */
    alignDataByRespondent(
        responses: SurveyResponse[],
        questionId1: string,
        questionId2: string,
        options?: { includeBoolean?: boolean; includeText?: boolean }
    ): { values1: number[]; values2: number[] } {
        const map1 = new Map<string, number>();
        const map2 = new Map<string, number>();

        responses.forEach(r => {
            if (!options?.includeText && r.type === 'text') return;
            if (options?.includeBoolean === false && r.type === 'boolean') return;

            if (r.questionId === questionId1) {
                const numericValue = coerceNumericValue(r.value);
                if (numericValue !== null) {
                    map1.set(r.respondentId, numericValue);
                }
            }
            if (r.questionId === questionId2) {
                const numericValue = coerceNumericValue(r.value);
                if (numericValue !== null) {
                    map2.set(r.respondentId, numericValue);
                }
            }
        });

        const values1: number[] = [];
        const values2: number[] = [];

        map1.forEach((v1, respondentId) => {
            const v2 = map2.get(respondentId);
            if (v2 !== undefined) {
                values1.push(v1);
                values2.push(v2);
            }
        });

        return { values1, values2 };
    },

    /**
     * Paired T-Test (자동 페어링 기반)
     */
    generatePairedTTests(dataset: AnalysisDataset): TTestResult[] {
        const questionMeta = this.getQuestionMeta(dataset);
        const buckets = new Map<string, { pre: string[]; post: string[] }>();

        questionMeta.forEach((meta, questionId) => {
            if (meta.type === 'text') return;
            const timepoint = detectTTestTimepoint(meta.label);
            if (!timepoint) return;
            const key = normalizeTTestKey(meta.label);
            if (!key) return;

            const bucket = buckets.get(key) || { pre: [], post: [] };
            bucket[timepoint].push(questionId);
            buckets.set(key, bucket);
        });

        const pairs: Array<{ questionAId: string; questionBId: string }> = [];
        buckets.forEach(bucket => {
            const pre = [...bucket.pre].sort();
            const post = [...bucket.post].sort();
            const pairCount = Math.min(pre.length, post.length);
            for (let i = 0; i < pairCount; i++) {
                pairs.push({ questionAId: pre[i], questionBId: post[i] });
            }
        });

        return pairs
            .map(pair => this.performPairedTTest(dataset, pair.questionAId, pair.questionBId, questionMeta))
            .filter((result): result is TTestResult => result !== null);
    },

    /**
     * Paired T-Test (단일 페어)
     */
    performPairedTTest(
        dataset: AnalysisDataset,
        questionAId: string,
        questionBId: string,
        questionMeta?: Map<string, { label: string; category?: string; type: SurveyResponse['type'] }>
    ): TTestResult | null {
        const meta = questionMeta || this.getQuestionMeta(dataset);
        const labelA = meta.get(questionAId)?.label || questionAId;
        const labelB = meta.get(questionBId)?.label || questionBId;

        const aligned = this.alignDataByRespondent(dataset.responses, questionAId, questionBId);
        const n = aligned.values1.length;
        if (n < 2) return null;

        const meanA = mean(aligned.values1);
        const meanB = mean(aligned.values2);
        const diffs = aligned.values2.map((v, idx) => v - aligned.values1[idx]);
        const meanDiff = mean(diffs);

        let tStatistic = 0;
        let pValue = 1;
        const varianceDiff = diffs.reduce((acc, v) => acc + Math.pow(v - meanDiff, 2), 0) / (n - 1);
        const stdDiff = Math.sqrt(Math.max(varianceDiff, 0));

        if (stdDiff === 0) {
            if (meanDiff !== 0) {
                tStatistic = meanDiff > 0 ? 999 : -999;
                pValue = 0;
            }
        } else {
            tStatistic = meanDiff / (stdDiff / Math.sqrt(n));
            pValue = this.tDistributionPValue(Math.abs(tStatistic), n - 1);
        }

        return {
            questionAId,
            questionBId,
            questionALabel: labelA,
            questionBLabel: labelB,
            n,
            meanA,
            meanB,
            meanDiff,
            tStatistic,
            pValue,
            significant: pValue < 0.05
        };
    },

    /**
     * 두 꼬리 p-value 계산 (Student t 분포)
     */
    tDistributionPValue(t: number, df: number): number {
        const cdf = studentTCdf(t, df);
        const pValue = 2 * Math.min(cdf, 1 - cdf);
        return Math.max(0, Math.min(1, pValue));
    },

    /**
     * IPA 분석 (자동 감지 + 파생 중요도)
     */
    generateIPAAnalysis(dataset: AnalysisDataset): IPAResult {
        const questionMeta = this.getQuestionMeta(dataset);
        const buckets = new Map<string, { importance: string[]; performance: string[] }>();

        questionMeta.forEach((meta, questionId) => {
            if (meta.type === 'text') return;
            const labelType = detectIpaLabelType(meta.label);
            if (!labelType) return;
            const key = normalizeIpaKey(meta.label);
            if (!key) return;

            const bucket = buckets.get(key) || { importance: [], performance: [] };
            bucket[labelType].push(questionId);
            buckets.set(key, bucket);
        });

        const pairs: Array<{ importanceId: string; performanceId: string }> = [];
        buckets.forEach(bucket => {
            const importance = [...bucket.importance].sort();
            const performance = [...bucket.performance].sort();
            const pairCount = Math.min(importance.length, performance.length);
            for (let i = 0; i < pairCount; i++) {
                pairs.push({ importanceId: importance[i], performanceId: performance[i] });
            }
        });

        if (pairs.length > 0) {
            const importanceQuestions = pairs.map(pair => pair.importanceId);
            const performanceQuestions = pairs.map(pair => pair.performanceId);
            const result = this.performIPAAnalysis(dataset, importanceQuestions, performanceQuestions);
            return { ...result, method: 'stated' };
        }

        return this.performDerivedIPAAnalysis(dataset);
    },

    performIPAAnalysis(
        dataset: AnalysisDataset,
        importanceQuestions: string[],  // 중요도 문항 ID들
        performanceQuestions: string[]  // 만족도 문항 ID들
    ): IPAResult {
        if (importanceQuestions.length !== performanceQuestions.length) {
            throw new Error('Importance and Performance question counts must match');
        }

        const items: IPAItem[] = [];
        const allImportance: number[] = [];
        const allPerformance: number[] = [];

        for (let i = 0; i < importanceQuestions.length; i++) {
            const impValues = this.extractNumericValues(dataset.responses, importanceQuestions[i]);
            const perfValues = this.extractNumericValues(dataset.responses, performanceQuestions[i]);

            const impMean = impValues.length > 0 ? mean(impValues) : 0;
            const perfMean = perfValues.length > 0 ? mean(perfValues) : 0;

            allImportance.push(impMean);
            allPerformance.push(perfMean);

            const questionResponse = dataset.responses.find(r => r.questionId === performanceQuestions[i]);

            items.push({
                questionId: performanceQuestions[i],
                label: questionResponse?.questionLabel || performanceQuestions[i],
                importance: impMean,
                performance: perfMean,
                quadrant: 1 // Will be calculated after we know the means
            });
        }

        const importanceMean = allImportance.length > 0 ? mean(allImportance) : 0;
        const performanceMean = allPerformance.length > 0 ? mean(allPerformance) : 0;

        // Assign quadrants based on means
        items.forEach(item => {
            if (item.importance >= importanceMean && item.performance >= performanceMean) {
                item.quadrant = 1; // Keep Up (고중요도-고성과)
            } else if (item.importance >= importanceMean && item.performance < performanceMean) {
                item.quadrant = 2; // Concentrate Here (고중요도-저성과)
            } else if (item.importance < importanceMean && item.performance < performanceMean) {
                item.quadrant = 3; // Low Priority (저중요도-저성과)
            } else {
                item.quadrant = 4; // Possible Overkill (저중요도-고성과)
            }
        });

        return {
            items,
            importanceMean,
            performanceMean
        };
    },

    performDerivedIPAAnalysis(dataset: AnalysisDataset): IPAResult {
        const questionMeta = this.getQuestionMeta(dataset);
        const numericQuestionIds = this.getNumericQuestionIds(dataset, 1);
        if (numericQuestionIds.length === 0) {
            return { items: [], importanceMean: 0, performanceMean: 0, method: 'derived' };
        }

        const respondentStats = new Map<string, { sum: number; count: number }>();
        dataset.responses.forEach(response => {
            if (response.type === 'text') return;
            const numericValue = coerceNumericValue(response.value);
            if (numericValue === null) return;
            const entry = respondentStats.get(response.respondentId) || { sum: 0, count: 0 };
            entry.sum += numericValue;
            entry.count += 1;
            respondentStats.set(response.respondentId, entry);
        });

        const questionValues = new Map<string, Array<{ respondentId: string; value: number }>>();
        dataset.responses.forEach(response => {
            if (response.type === 'text') return;
            const numericValue = coerceNumericValue(response.value);
            if (numericValue === null) return;
            const list = questionValues.get(response.questionId) || [];
            list.push({ respondentId: response.respondentId, value: numericValue });
            questionValues.set(response.questionId, list);
        });

        const items: IPAItem[] = [];

        numericQuestionIds.forEach(questionId => {
            const entries = questionValues.get(questionId) || [];
            if (entries.length === 0) return;

            const performanceValues = entries.map(entry => entry.value);
            const performance = mean(performanceValues);

            const corrValues: number[] = [];
            const overallValues: number[] = [];

            entries.forEach(entry => {
                const stats = respondentStats.get(entry.respondentId);
                if (!stats || stats.count < 2) return;
                const otherMean = (stats.sum - entry.value) / (stats.count - 1);
                if (!Number.isFinite(otherMean)) return;
                corrValues.push(entry.value);
                overallValues.push(otherMean);
            });

            let importance = 1;
            if (corrValues.length >= 3) {
                const r = this.safeCorrelation(corrValues, overallValues);
                const normalized = Math.min(1, Math.max(0, Math.abs(r)));
                importance = 1 + normalized * 4;
            }

            items.push({
                questionId,
                label: questionMeta.get(questionId)?.label || questionId,
                importance,
                performance,
                quadrant: 1
            });
        });

        if (items.length === 0) {
            return { items: [], importanceMean: 0, performanceMean: 0, method: 'derived' };
        }

        const importanceMean = mean(items.map(item => item.importance));
        const performanceMean = mean(items.map(item => item.performance));

        items.forEach(item => {
            if (item.importance >= importanceMean && item.performance >= performanceMean) {
                item.quadrant = 1;
            } else if (item.importance >= importanceMean && item.performance < performanceMean) {
                item.quadrant = 2;
            } else if (item.importance < importanceMean && item.performance < performanceMean) {
                item.quadrant = 3;
            } else {
                item.quadrant = 4;
            }
        });

        return {
            items,
            importanceMean,
            performanceMean,
            method: 'derived'
        };
    },

    /**
     * 전체 분석 요약 생성
     */
    generateAnalysisSummary(dataset: AnalysisDataset) {
        const questionStats = this.analyzeQuestions(dataset);
        const textQuestions = questionStats
            .filter(stat => stat.responseType === 'text')
            .map(stat => {
                const responses = dataset.responses.filter(r => r.questionId === stat.questionId);
                const summary = summarizeTextResponses(responses);
                return {
                    questionId: stat.questionId,
                    questionLabel: stat.questionLabel,
                    ...summary
                };
            })
            .sort((a, b) => b.responseCount - a.responseCount);

        const allNumericValues = dataset.responses
            .filter(response => response.type !== 'text')
            .map(response => coerceNumericValue(response.value))
            .filter((value): value is number => value !== null);

        return {
            projectName: dataset.projectName,
            totalResponses: dataset.metadata.totalRespondents,
            totalQuestions: questionStats.length,
            dataSource: dataset.metadata.source,
            collectedAt: dataset.metadata.collectedAt,
            questionStats,
            textQuestions,
            overallMean: allNumericValues.length > 0 ? mean(allNumericValues) : 0
        };
    }
};

export default analysisService;
