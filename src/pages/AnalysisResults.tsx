import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Share2, RefreshCw, FileWarning, FileSpreadsheet, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { CorrelationHeatmap } from "@/components/analysis/CorrelationHeatmap";
import { IPAChart } from "@/components/analysis/IPAChart";
import { TextInsightCard } from "@/components/analysis/TextInsightCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { exportAnalysisReportToPDF, exportAnalysisToExcel } from "@/services/exportService";
import { toast } from "@/hooks/use-toast";

// Analysis Result 타입
interface AnalysisResult {
    projectId: string;
    projectName: string;
    analyzedAt: string;
    types: string[];
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
                };
                distribution: Array<{
                    value: number | string | boolean;
                    count: number;
                    percentage: number;
                }>;
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
            importanceMean: number;
            performanceMean: number;
            method?: "stated" | "derived";
        };
    };
}

interface TTestRow {
    id: string;
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
}


export default function AnalysisResults() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("summary");
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);

    // Custom Label State
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
    const [tempLabels, setTempLabels] = useState<Record<string, string>>({});

    type QuestionStat = NonNullable<AnalysisResult['data']['basic']>['questionStats'][number];

    const isTextQuestion = (stat: QuestionStat) => {
        if (stat.responseType) return stat.responseType === "text";
        // Fallback for old data
        const totalCount = stat.distribution?.reduce((sum, item) => sum + item.count, 0) ?? 0;
        const stringCount = stat.distribution?.reduce(
            (sum, item) => sum + (typeof item.value === "string" ? item.count : 0),
            0
        ) ?? 0;
        if (totalCount > 0 && stringCount / totalCount >= 0.6) return true;

        const hasStringValue = stat.distribution?.some(item => typeof item.value === "string");
        const numericCount = stat.stats?.count ?? 0;
        return Boolean(hasStringValue && numericCount === 0);
    };

    const formatNumber = (value: number, digits = 2) => {
        if (!Number.isFinite(value)) return "∞";
        return value.toFixed(digits);
    };

    const getLabel = (questionId: string, originalLabel: string) => {
        return customLabels[questionId] || originalLabel;
    };

    const handleSaveLabels = async () => {
        if (!analysisResult) return;
        try {
            const { analysisResultStore } = await import("@/services/analysisResultStore");
            await analysisResultStore.updateResultLabels(analysisResult.id || "", tempLabels);
            setCustomLabels(tempLabels);
            setIsLabelDialogOpen(false);
            toast({ title: "저장 완료", description: "항목 이름이 변경되었습니다." });
        } catch (error) {
            console.error(error);
            toast({ title: "저장 실패", variant: "destructive" });
        }
    };

    // Firestore에서 분석 결과 로드
    useEffect(() => {
        if (!id) return;

        const loadResult = async () => {
            setLoading(true);
            try {
                const { analysisResultStore } = await import("@/services/analysisResultStore");
                const result = await analysisResultStore.getResult(id);
                if (result) {
                    // matrixJson -> matrix 변환
                    const parsed = analysisResultStore.parseResult(result);
                    setAnalysisResult(parsed as AnalysisResult);
                    // Initialize custom labels
                    if (parsed.customLabels) {
                        setCustomLabels(parsed.customLabels);
                        setTempLabels(parsed.customLabels);
                    }
                }
            } catch (error) {
                console.error("Failed to load analysis result:", error);
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, [id]);

    // Insight Logic
    const insights = useMemo(() => {
        if (!analysisResult?.data?.basic?.questionStats) return null;

        // Filter numeric questions and sort by mean
        const numericStats = analysisResult.data.basic.questionStats
            .filter(q => q.stats.count > 0 && q.stats.mean > 0)
            .sort((a, b) => b.stats.mean - a.stats.mean);

        const strengths = numericStats.slice(0, 5).map(q => ({
            id: q.questionId,
            label: getLabel(q.questionId, q.questionLabel),
            score: q.stats.mean
        }));

        const weaknesses = numericStats
            .slice()
            .sort((a, b) => a.stats.mean - b.stats.mean)
            .slice(0, 5)
            .map(q => ({
                id: q.questionId,
                label: getLabel(q.questionId, q.questionLabel),
                score: q.stats.mean
            }));

        return { strengths, weaknesses };
    }, [analysisResult, customLabels]);

    const handleExportPDF = async () => {
        if (!analysisResult) return;

        // Capture Charts
        const scoreDistChart = document.getElementById('chart-score-dist');
        const categoryChart = document.getElementById('chart-category-score');

        let chartImages = {};
        try {
            const html2canvas = (await import('html2canvas')).default;
            if (scoreDistChart) {
                const canvas = await html2canvas(scoreDistChart, { scale: 2 });
                chartImages = { ...chartImages, scoreDist: canvas.toDataURL('image/png') };
            }
            if (categoryChart) {
                const canvas = await html2canvas(categoryChart, { scale: 2 });
                chartImages = { ...chartImages, categoryScore: canvas.toDataURL('image/png') };
            }
        } catch (e) {
            console.error("Chart capture failed", e);
        }

        exportAnalysisReportToPDF(analysisResult.data, {
            title: analysisResult.projectName || "설문 분석 결과",
            subtitle: `분석 일시: ${new Date(analysisResult.analyzedAt).toLocaleString()}`
        }, customLabels, chartImages);
    };

    // 차트 데이터 생성 (useMemo로 최적화)
    const chartData = useMemo(() => {
        if (!analysisResult?.data?.basic) return null;

        const basic = analysisResult.data.basic;
        const numericQuestionStats = basic.questionStats.filter(stat => !isTextQuestion(stat));

        // 점수 분포 (모든 문항의 분포 합산)
        const distributionMap = new Map<string, number>();
        numericQuestionStats.forEach(q => {
            q.distribution.forEach(d => {
                if (typeof d.value === "string") return;
                const key = String(d.value);
                distributionMap.set(key, (distributionMap.get(key) || 0) + d.count);
            });
        });

        const scoreDistribution = Array.from(distributionMap.entries())
            .map(([value, count], index) => ({
                score: value,
                count,
                fill: `hsl(${120 + index * 30}, 60%, 50%)`
            }))
            .sort((a, b) => String(a.score).localeCompare(String(b.score)));

        // 문항별 평균 점수
        const categoryScores = numericQuestionStats.map(q => ({
            category: getLabel(q.questionId, q.questionLabel).slice(0, 20) + (getLabel(q.questionId, q.questionLabel).length > 20 ? '...' : ''),
            score: q.stats.mean
        }));

        return {
            scoreDistribution,
            categoryScores,
            summary: {
                totalResponses: basic.totalResponses,
                totalQuestions: basic.totalQuestions,
                avgScore: basic.overallMean,
                completionRate: 100 // OCR 완료된 데이터만 있으므로 100%
            }
        };
    }, [analysisResult]);

    const textSummary = useMemo(() => {
        if (!analysisResult?.data?.basic) return [];
        const basic = analysisResult.data.basic;
        if (basic.textQuestions?.length) {
            return basic.textQuestions.filter(item => item.responseCount > 0);
        }

        return basic.questionStats
            .filter(stat => isTextQuestion(stat))
            .map(stat => {
                const responseCount = stat.responseCount
                    ?? stat.distribution.reduce((sum, item) => sum + item.count, 0);
                const totalLength = stat.distribution.reduce((sum, item) => {
                    return sum + String(item.value).length * item.count;
                }, 0);
                const averageLength = responseCount > 0 ? totalLength / responseCount : 0;
                return {
                    questionId: stat.questionId,
                    questionLabel: stat.questionLabel,
                    responseCount,
                    averageLength,
                    topKeywords: []
                };
            })
            .filter(item => item.responseCount > 0)
            .sort((a, b) => b.responseCount - a.responseCount);
    }, [analysisResult]);

    const ttestRows = useMemo<TTestRow[]>(() => {
        if (!analysisResult?.data?.ttest) return [];
        return analysisResult.data.ttest.map((item, index) => ({
            id: `${item.questionAId}-${item.questionBId}-${index}`,
            ...item
        }));
    }, [analysisResult]);

    const ttestColumns: Column<TTestRow>[] = [
        {
            key: "comparison",
            header: "비교 문항",
            render: (row) => (
                <div className="text-body">
                    <span className="font-medium">{row.questionALabel}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-medium">{row.questionBLabel}</span>
                </div>
            )
        },
        { key: "n", header: "N", align: "right" },
        {
            key: "meanA",
            header: "평균(전)",
            align: "right",
            render: (row) => formatNumber(row.meanA, 2)
        },
        {
            key: "meanB",
            header: "평균(후)",
            align: "right",
            render: (row) => formatNumber(row.meanB, 2)
        },
        {
            key: "meanDiff",
            header: "차이",
            align: "right",
            render: (row) => formatNumber(row.meanDiff, 2)
        },
        {
            key: "tStatistic",
            header: "t",
            align: "right",
            render: (row) => formatNumber(row.tStatistic, 3)
        },
        {
            key: "pValue",
            header: "p",
            align: "right",
            render: (row) => formatNumber(row.pValue, 4)
        },
        {
            key: "significant",
            header: "유의",
            align: "center",
            render: (row) => (
                <span className={row.significant ? "text-success font-medium" : "text-muted-foreground"}>
                    {row.significant ? "유의" : "비유의"}
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    if (!analysisResult) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <FileWarning className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">분석 결과를 찾을 수 없습니다.</p>
                    <Button onClick={() => navigate("/analysis")}>분석 페이지로 돌아가기</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate("/analysis")} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    분석 목록
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-h1">{analysisResult.projectName} 분석 결과</h1>
                        <p className="text-body text-muted-foreground mt-1">
                            {new Date(analysisResult.analyzedAt).toLocaleString()} 생성 · {chartData?.summary.totalResponses || 0} 응답 기반
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/analysis`)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            재분석
                        </Button>
                        <Button variant="outline" size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            공유
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    내보내기
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsLabelDialogOpen(true)}>
                                    <span className="flex items-center">🏷️ 이름 관리</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF 보고서 (그래프 포함)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    try {
                                        exportAnalysisToExcel(analysisResult.data, {
                                            filename: `${analysisResult.projectName}_data.xlsx`
                                        });
                                        toast({ title: "Excel 내보내기 완료", description: "데이터가 다운로드되었습니다." });
                                    } catch (e) {
                                        toast({ title: "내보내기 실패", variant: "destructive" });
                                    }
                                }}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Excel 데이터
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="summary">요약</TabsTrigger>
                    <TabsTrigger value="text">텍스트</TabsTrigger>
                    <TabsTrigger value="correlation">상관관계</TabsTrigger>
                    <TabsTrigger value="ttest">t-검정</TabsTrigger>
                    <TabsTrigger value="ipa">IPA</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary">
                    {chartData ? (
                        <>
                            {/* KPIs */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <KpiCard label="총 응답" value={chartData.summary.totalResponses.toLocaleString()} />
                                <KpiCard label="분석 문항" value={chartData.summary.totalQuestions} />
                                <KpiCard label="평균 점수" value={chartData.summary.avgScore.toFixed(2)} />
                                <KpiCard label="완료율" value={`${chartData.summary.completionRate}%`} />
                            </div>

                            {/* Executive Summary Card */}
                            {insights && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <Card className="border-green-200 bg-green-50/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2 text-green-700">
                                                <TrendingUp className="w-5 h-5" />
                                                현재 강점 (Top 5)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {insights.strengths.map((item, idx) => (
                                                    <li key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-green-100 shadow-sm">
                                                        <span className="font-medium text-slate-700 truncate flex-1 mr-2">
                                                            {idx + 1}. {item.label}
                                                        </span>
                                                        <span className="font-bold text-green-600">{item.score.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-orange-200 bg-orange-50/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                                                <TrendingDown className="w-5 h-5" />
                                                집중 개선 필요 (Bottom 5)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {insights.weaknesses.map((item, idx) => (
                                                    <li key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-orange-100 shadow-sm">
                                                        <span className="font-medium text-slate-700 truncate flex-1 mr-2">
                                                            {idx + 1}. {item.label}
                                                        </span>
                                                        <span className="font-bold text-orange-600">{item.score.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Charts */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Score Distribution */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-h3">점수 분포</CardTitle>
                                    </CardHeader>
                                    <CardContent id="chart-score-dist">
                                        <div className="h-[300px]">
                                            {chartData.scoreDistribution.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData.scoreDistribution}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="score" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Bar dataKey="count" name="응답 수">
                                                            {chartData.scoreDistribution.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    데이터가 없습니다
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Category Scores */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-h3">항목별 평균 점수</CardTitle>
                                    </CardHeader>
                                    <CardContent id="chart-category-score">
                                        <div className="h-[300px]">
                                            {chartData.categoryScores.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData.categoryScores} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" domain={[0, 'auto']} />
                                                        <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                                                        <Tooltip />
                                                        <Bar dataKey="score" fill="var(--primary)" name="평균 점수" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    데이터가 없습니다
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {textSummary.length > 0 && (
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-h3">텍스트 응답 요약</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3">
                                            {textSummary.slice(0, 5).map((item) => (
                                                <div
                                                    key={item.questionId}
                                                    className="rounded-[var(--radius-md)] border border-border/60 bg-muted/20 p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-body font-medium text-foreground">
                                                            {item.questionLabel}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            응답 {item.responseCount}건
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                        <span>평균 길이 {Math.round(item.averageLength)}자</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab("text")}>
                                                상세 텍스트 분석 결과 보기
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            기본 집계 데이터가 없습니다. 분석 시 "기본 집계"를 선택해주세요.
                        </div>
                    )}
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text">
                    {textSummary.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {textSummary.map((item) => (
                                <TextInsightCard
                                    key={item.questionId}
                                    questionLabel={item.questionLabel}
                                    keywords={item.topKeywords}
                                    responses={(() => {
                                        const questionStat = analysisResult?.data?.basic?.questionStats.find(
                                            q => q.questionId === item.questionId
                                        );
                                        if (!questionStat) return [];
                                        return questionStat.distribution.flatMap(d => Array(d.count).fill(String(d.value)));
                                    })()}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            텍스트 응답이 없습니다.
                        </div>
                    )}
                </TabsContent>

                {/* Correlation Tab */}
                <TabsContent value="correlation">
                    {analysisResult.data.correlation && analysisResult.data.correlation.variables.length >= 2 ? (
                        <CorrelationHeatmap
                            data={analysisResult.data.correlation}
                            onCellClick={(row, col, value) => {
                                toast({
                                    title: `상관계수: ${value.toFixed(3)}`,
                                    description: `${analysisResult.data.correlation?.variables[row]} ↔ ${analysisResult.data.correlation?.variables[col]}`
                                });
                            }}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            {analysisResult.types.includes("correlation")
                                ? "상관관계 분석에 필요한 숫자형 문항이 부족합니다."
                                : '상관관계 분석 데이터가 없습니다. 분석 시 "상관관계 분석"을 선택해주세요.'}
                        </div>
                    )}
                </TabsContent>

                {/* T-Test Tab */}
                <TabsContent value="ttest">
                    {analysisResult.data.ttest && analysisResult.data.ttest.length > 0 ? (
                        <DataTable
                            columns={ttestColumns}
                            data={ttestRows}
                            keyField="id"
                            emptyMessage="t-검정 결과가 없습니다."
                        />
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            {analysisResult.types.includes("ttest")
                                ? "사전/사후 문항 페어가 없어 t-검정을 수행할 수 없습니다."
                                : 't-검정 분석 데이터가 없습니다. 분석 시 "t-검정"을 선택해주세요.'}
                        </div>
                    )}
                </TabsContent>

                {/* IPA Tab */}
                <TabsContent value="ipa">
                    {analysisResult.data.ipa?.items?.length ? (
                        <IPAChart data={analysisResult.data.ipa} />
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            {analysisResult.types.includes("ipa")
                                ? "IPA 분석에 필요한 숫자형 문항이 부족합니다."
                                : 'IPA 분석 데이터가 없습니다. 분석 시 "IPA 분석"을 선택해주세요.'}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Label Management Dialog */ }
            <Dialog open={isLabelDialogOpen} onOpenChange={(open) => {
                setIsLabelDialogOpen(open);
                if (open && analysisResult?.data?.basic) {
                    // Reset temp items on open if needed, implies syncing logic
                    // For now, assume tempLabels tracks changes.
                    // If opening first time, seed from current customLabels
                    setTempLabels({ ...customLabels });
                }
            }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>분석 항목 이름 관리</DialogTitle>
                <p className="text-sm text-muted-foreground">
                    "텍스트 영역 12" 같은 어려운 이름을 "맛", "서비스" 등 쉬운 이름으로 변경하세요.
                    변경된 이름은 리포트와 분석 화면에 즉시 적용됩니다.
                </p>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4 py-4 -mr-4">
                <div className="space-y-4">
                    {analysisResult?.data?.basic?.questionStats.map((q) => (
                        <div key={q.questionId} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                            <div className="text-sm text-muted-foreground truncate" title={q.questionLabel}>
                                {q.questionLabel}
                            </div>
                            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                            <Input
                                placeholder="새 이름 입력 (예: 서비스 품질)"
                                value={tempLabels[q.questionId] || ""}
                                onChange={(e) => setTempLabels(prev => ({ ...prev, [q.questionId]: e.target.value }))}
                                className="h-9"
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>취소</Button>
                <Button onClick={handleSaveLabels}>저장하기</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
        </AppLayout >
    );
}
