import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    Layout,
    Settings,
    Eye,
    CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ReportExportModal } from "@/components/report/ReportExportModal";

// Step Configuration
const STEPS = [
    { id: 1, title: "대상 선택", icon: FileText },
    { id: 2, title: "템플릿", icon: Layout },
    { id: 3, title: "항목 선택", icon: Settings },
    { id: 4, title: "커버 정보", icon: FileText },
    { id: 5, title: "미리보기", icon: Eye },
];

// Mock data removed - fetching from store


const TEMPLATES = [
    { id: "basic", name: "기본 리포트", description: "핵심 지표 요약 및 차트" },
    { id: "detailed", name: "상세 리포트", description: "모든 문항별 분석 포함" },
    { id: "executive", name: "경영진용", description: "핵심 인사이트 중심 요약" },
];

const SECTIONS = [
    { id: "summary", label: "요약 통계", defaultChecked: true },
    { id: "distribution", label: "점수 분포", defaultChecked: true },
    { id: "category", label: "항목별 분석", defaultChecked: true },
    { id: "correlation", label: "상관관계 분석", defaultChecked: false },
    { id: "ipa", label: "IPA 분석", defaultChecked: false },
    { id: "comments", label: "주관식 응답", defaultChecked: false },
    { id: "recommendations", label: "개선 제안", defaultChecked: true },
];

import { projectStore } from "@/services/projectStore";
import { analysisResultStore, AnalysisResultData } from "@/services/analysisResultStore";

export default function ReportCreate() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showExportModal, setShowExportModal] = useState(false);

    // Data states
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResultData[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedAnalysisId, setSelectedAnalysisId] = useState("");

    // Load Projects
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const availableProjects = await projectStore.getActiveProjects();
                setProjects(availableProjects.map(p => ({ id: p.id, name: p.name })));
            } catch (err) {
                console.error("Failed to load projects", err);
                toast({
                    title: "프로젝트 로드 실패",
                    description: "프로젝트 목록을 불러오지 못했습니다.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, []);

    // Load Analysis Results when Project Changes
    useEffect(() => {
        if (!selectedProjectId) {
            setAnalysisResults([]);
            setSelectedAnalysisId("");
            return;
        }

        const loadAnalysisKey = async () => {
            try {
                const results = await analysisResultStore.getResultsByProject(selectedProjectId);
                setAnalysisResults(results);
                if (results.length > 0) {
                    // Optionally auto-select the latest one
                    // setSelectedAnalysisId(results[0].id);
                } else {
                    toast({
                        description: "해당 프로젝트에 완료된 분석 결과가 없습니다.",
                    });
                }
            } catch (err) {
                console.error("Failed to load analysis results", err);
            }
        };
        loadAnalysisKey();
    }, [selectedProjectId]);
    const [selectedTemplate, setSelectedTemplate] = useState("basic");
    const [selectedSections, setSelectedSections] = useState<string[]>(
        SECTIONS.filter((s) => s.defaultChecked).map((s) => s.id)
    );
    const [coverInfo, setCoverInfo] = useState({
        title: "",
        period: "",
        author: "",
    });

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return !!selectedProjectId && !!selectedAnalysisId;
            case 2:
                return !!selectedTemplate;
            case 3:
                return selectedSections.length > 0;
            case 4:
                return !!coverInfo.title && !!coverInfo.period;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep((prev) => prev + 1);
        } else {
            setShowExportModal(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSectionToggle = (sectionId: string) => {
        setSelectedSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    return (
        <AppLayout>
            <PageHeader
                title="리포트 생성"
                description="분석 결과를 바탕으로 리포트를 생성합니다."
                breadcrumbs={[
                    { label: "리포트", href: "/reports" },
                    { label: "새 리포트" },
                ]}
            />

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 px-4">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <div
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-full transition-colors",
                                    isActive && "bg-primary text-primary-foreground",
                                    isCompleted && "bg-success-50 text-success",
                                    !isActive && !isCompleted && "text-muted-foreground"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                        isActive && "bg-primary-foreground/20",
                                        isCompleted && "bg-success/20",
                                        !isActive && !isCompleted && "bg-muted"
                                    )}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                <span className="hidden sm:inline text-sm font-medium">
                                    {step.title}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 mx-2",
                                        isCompleted ? "bg-success" : "bg-border"
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <Card>
                <CardContent className="p-6">
                    {/* Step 1: Project Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <CardTitle className="text-h3 mb-4">분석 대상 선택</CardTitle>

                            {/* Project Select */}
                            <div className="space-y-2 max-w-md">
                                <Label>프로젝트</Label>
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loading ? "로딩 중..." : "프로젝트 선택..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground text-center">프로젝트가 없습니다</div>
                                        ) : (
                                            projects.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Analysis Result Select (Conditional) */}
                            {selectedProjectId && (
                                <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-top-1">
                                    <Label>분석 결과</Label>
                                    <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
                                        <SelectTrigger disabled={analysisResults.length === 0}>
                                            <SelectValue placeholder="분석 결과 선택..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {analysisResults.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">분석 결과가 없습니다</div>
                                            ) : (
                                                analysisResults.map((res) => (
                                                    <SelectItem key={res.id} value={res.id}>
                                                        {res.projectName} ({new Date(res.analyzedAt).toLocaleDateString()})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {analysisResults.length === 0 && (
                                        <p className="text-sm text-destructive mt-1">
                                            먼저 데이터 업로드 및 분석을 완료해야 합니다.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Template Selection */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <CardTitle className="text-h3 mb-4">템플릿 선택</CardTitle>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {TEMPLATES.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={cn(
                                            "p-4 border rounded-[var(--radius-md)] cursor-pointer transition-all",
                                            selectedTemplate === template.id
                                                ? "border-primary bg-primary-50/50 ring-1 ring-primary"
                                                : "hover:border-primary/50"
                                        )}
                                    >
                                        <h4 className="font-medium">{template.name}</h4>
                                        <p className="text-small text-muted-foreground mt-1">
                                            {template.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Section Selection */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <CardTitle className="text-h3 mb-4">포함 항목 선택</CardTitle>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {SECTIONS.map((section) => (
                                    <label
                                        key={section.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 border rounded-[var(--radius-sm)] cursor-pointer transition-colors",
                                            selectedSections.includes(section.id)
                                                ? "border-primary bg-primary-50/30"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedSections.includes(section.id)}
                                            onCheckedChange={() => handleSectionToggle(section.id)}
                                        />
                                        <span className="text-body">{section.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Cover Info */}
                    {currentStep === 4 && (
                        <div className="space-y-4 max-w-md">
                            <CardTitle className="text-h3 mb-4">커버 정보</CardTitle>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>리포트 제목 *</Label>
                                    <Input
                                        value={coverInfo.title}
                                        onChange={(e) =>
                                            setCoverInfo((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        placeholder="예: 2024년 상반기 고객 만족도 조사 결과"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>조사 기간 *</Label>
                                    <Input
                                        value={coverInfo.period}
                                        onChange={(e) =>
                                            setCoverInfo((prev) => ({ ...prev, period: e.target.value }))
                                        }
                                        placeholder="예: 2024.01.01 ~ 2024.06.30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>작성자</Label>
                                    <Input
                                        value={coverInfo.author}
                                        onChange={(e) =>
                                            setCoverInfo((prev) => ({ ...prev, author: e.target.value }))
                                        }
                                        placeholder="예: 마케팅팀 김철수"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Preview */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <CardTitle className="text-h3 mb-4">미리보기</CardTitle>
                            <div className="border rounded-[var(--radius-md)] p-6 bg-white min-h-[300px]">
                                <div className="text-center space-y-2 mb-8 pb-4 border-b">
                                    <h2 className="text-h1">{coverInfo.title || "리포트 제목"}</h2>
                                    <p className="text-muted-foreground">{coverInfo.period}</p>
                                    {coverInfo.author && (
                                        <p className="text-small text-muted-foreground">
                                            작성: {coverInfo.author}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-medium">포함 섹션:</h3>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                        {selectedSections.map((id) => {
                                            const section = SECTIONS.find((s) => s.id === id);
                                            return section ? <li key={id}>{section.label}</li> : null;
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    이전
                </Button>
                <Button onClick={handleNext} disabled={!canProceed()}>
                    {currentStep === 5 ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            리포트 생성
                        </>
                    ) : (
                        <>
                            다음
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>

            {/* Export Modal */}
            <ReportExportModal
                open={showExportModal}
                onOpenChange={setShowExportModal}
                reportTitle={coverInfo.title}
                analysisId={selectedAnalysisId}
            />
        </AppLayout>
    );
}
