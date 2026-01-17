import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    LineChart,
    GitCompare,
    Grid3X3,
    Play,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { jobStore } from "@/services/jobStore";
import { projectStore, Project } from "@/services/projectStore";
import { convertOCRToDataset } from "@/services/dataAdapter";
import { analysisService } from "@/services/analysisService";

// Job Selection Option
interface JobOption {
    id: string;
    name: string;
    batches: number;
    responses: number;
}

const ANALYSIS_TYPES = [
    {
        id: "basic",
        title: "기본 집계",
        description: "응답자 수, 평균, 표준편차, 빈도 분석",
        icon: BarChart3,
        enabled: true,
    },
    {
        id: "correlation",
        title: "상관관계 분석",
        description: "변수 간 피어슨/스피어만 상관계수",
        icon: GitCompare,
        enabled: true,
    },
    {
        id: "ttest",
        title: "t-검정",
        description: "그룹 간 평균 차이 검증",
        icon: LineChart,
        enabled: true,
    },
    {
        id: "ipa",
        title: "IPA 분석",
        description: "중요도-성과 분석 (4사분면)",
        icon: Grid3X3,
        enabled: true,
    },
];

export default function Analysis() {
    const navigate = useNavigate();

    // Data Source State (Job)
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [availableJobs, setAvailableJobs] = useState<JobOption[]>([]);

    // Target Project State (Where to save results)
    const [targetProjectId, setTargetProjectId] = useState<string>("");
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

    const [selectedTypes, setSelectedTypes] = useState<string[]>(["basic"]);
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [jobs, projects] = await Promise.all([
                    jobStore.getJobs(),
                    projectStore.getActiveProjects()
                ]);

                // Filter for completed jobs
                const completedJobs = jobs.filter(j => j.status === 'completed');
                const jobOptions: JobOption[] = completedJobs.map(job => ({
                    id: job.id,
                    name: job.name,
                    batches: 1,
                    responses: job.pages.length
                }));

                setAvailableJobs(jobOptions);
                setAvailableProjects(projects);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const selectedJob = availableJobs.find((j) => j.id === selectedJobId);
    const minSampleSize = 1;
    const hasEnoughSamples = selectedJob ? selectedJob.responses >= minSampleSize : false;

    const handleTypeToggle = (typeId: string) => {
        setSelectedTypes((prev) =>
            prev.includes(typeId)
                ? prev.filter((t) => t !== typeId)
                : [...prev, typeId]
        );
    };

    const handleRunAnalysis = async () => {
        if (!selectedJobId || !targetProjectId || selectedTypes.length === 0) {
            toast({
                title: "설정 부족",
                description: "작업(데이터 소스), 대상 프로젝트, 분석 유형을 모두 선택해주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsRunning(true);

        try {
            // 1. Firestore에서 Job 데이터 로드
            const job = await jobStore.getJob(selectedJobId);
            if (!job) {
                throw new Error("작업 데이터를 찾을 수 없습니다.");
            }

            // Find Target Project Name
            const targetProject = availableProjects.find(p => p.id === targetProjectId);
            const targetProjectName = targetProject ? targetProject.name : "Unknown Project";

            // 2. OCR 결과를 분석 데이터셋으로 변환
            const dataset = convertOCRToDataset(job);

            // 3. 선택된 분석 유형에 따라 분석 수행
            const analysisResults: any = {
                projectId: targetProjectId, // Link to the REAL Project
                projectName: targetProjectName,
                analyzedAt: new Date().toISOString(),
                types: selectedTypes,
                data: {}
            };

            if (selectedTypes.includes("basic")) {
                analysisResults.data.basic = analysisService.generateAnalysisSummary(dataset);
            }

            if (selectedTypes.includes("correlation")) {
                const correlationResult = analysisService.generateCorrelationMatrix(dataset);
                analysisResults.data.correlation = correlationResult;
            }

            if (selectedTypes.includes("ttest")) {
                analysisResults.data.ttest = analysisService.generatePairedTTests(dataset);
            }

            if (selectedTypes.includes("ipa")) {
                analysisResults.data.ipa = analysisService.generateIPAAnalysis(dataset);
            }

            // 4. 분석 결과를 Firestore에 저장
            const { analysisResultStore } = await import("@/services/analysisResultStore");
            const savedResult = await analysisResultStore.saveResult(analysisResults);

            toast({
                title: "분석 완료",
                description: "결과 페이지로 이동합니다.",
            });

            navigate(`/analysis/results/${savedResult.id}`);
        } catch (error) {
            console.error("Analysis error:", error);
            toast({
                title: "분석 실패",
                description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <AppLayout>
            <PageHeader
                title="통계 분석"
                description="수집된 설문 데이터를 분석하여 인사이트를 도출합니다."
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Project Selection */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-h3">1. 분석 설정</CardTitle>
                        <CardDescription>데이터 소스와 저장할 프로젝트를 선택하세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Job Selection */}
                        <div className="space-y-2">
                            <Label>데이터 소스 (Job)</Label>
                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="분석할 작업 선택..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableJobs.length === 0 ? (
                                        <SelectItem value="empty" disabled>
                                            {loading ? "로딩 중..." : "완료된 작업이 없습니다"}
                                        </SelectItem>
                                    ) : (
                                        availableJobs.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedJob && (
                                <div className="mt-2 p-3 bg-muted rounded-[var(--radius-sm)] space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">총 페이지</span>
                                        <span className="font-medium font-mono-nums">{selectedJob.responses}p</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-2 border-t mt-2">
                                        <span className="text-muted-foreground">데이터 상태</span>
                                        {hasEnoughSamples ? (
                                            <span className="flex items-center gap-1 text-success">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                충분
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-danger">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                부족
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Project Selection */}
                        <div className="space-y-2">
                            <Label>결과 저장 프로젝트</Label>
                            <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="프로젝트에 연결..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProjects.length === 0 ? (
                                        <SelectItem value="empty" disabled>
                                            프로젝트가 없습니다
                                        </SelectItem>
                                    ) : (
                                        availableProjects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                분석 결과는 선택한 프로젝트에 귀속됩니다.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Analysis Options */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-h3">2. 분석 유형 선택</CardTitle>
                        <CardDescription>실행할 분석 방법을 선택하세요 (복수 선택 가능)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {ANALYSIS_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedTypes.includes(type.id);
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => handleTypeToggle(type.id)}
                                        className={`p-4 border rounded-[var(--radius-md)] cursor-pointer transition-all ${isSelected
                                            ? "border-primary bg-primary-50/50 ring-1 ring-primary"
                                            : "hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                                                <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-foreground">{type.title}</h4>
                                                    <Checkbox checked={isSelected} />
                                                </div>
                                                <p className="text-small text-muted-foreground mt-1">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Run Button */}
            <div className="flex justify-end mt-6">
                <Button
                    size="lg"
                    onClick={handleRunAnalysis}
                    disabled={!selectedJobId || !targetProjectId || selectedTypes.length === 0 || isRunning}
                >
                    {isRunning ? (
                        <>분석 중...</>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            분석 실행
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </AppLayout>
    );
}
