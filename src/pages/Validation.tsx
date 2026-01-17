import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, Keyboard } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ValidationLayout } from "@/components/validation/ValidationLayout";
import { ThumbnailPanel } from "@/components/validation/ThumbnailPanel";
import { DocumentViewer } from "@/components/validation/DocumentViewer";
import { FieldPanel } from "@/components/validation/FieldPanel";
import { jobStore, PageItem, FieldData, BoundingBox } from "@/services/jobStore";
import { openaiService } from "@/services/openaiService";

export default function Validation() {
    const navigate = useNavigate();
    const { id: jobId } = useParams();

    // State
    const [pages, setPages] = useState<PageItem[]>([]);
    const [currentPageId, setCurrentPageId] = useState<string>("");
    const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();
    const [fields, setFields] = useState<FieldData[]>([]);
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const [currentJob, setCurrentJob] = useState<any>(null);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    // Load Job Data
    useEffect(() => {
        if (!jobId) {
            toast({
                title: "검수 대상이 없습니다",
                description: "작업을 선택한 뒤 검수를 진행해주세요.",
                variant: "destructive"
            });
            navigate("/jobs");
            return;
        }

        const fetchJob = async () => {
            const job = await jobStore.getJob(jobId);

            if (job) {
                setCurrentJob(job);
                // Ensure pages are sorted by pageNumber
                const sortedPages = [...job.pages].sort((a, b) => a.pageNumber - b.pageNumber);
                console.log("Loaded pages:", sortedPages.map(p => `${p.pageNumber}:${p.id}`));
                setPages(sortedPages);

                if (sortedPages.length > 0) {
                    // If no current page is set (initial load), set the first one
                    // Or if the current page is not in the list (rare)
                    setCurrentPageId(prev => {
                        if (prev && sortedPages.some(p => p.id === prev)) return prev;
                        return sortedPages[0].id;
                    });
                }
            } else {
                toast({
                    title: "작업을 찾을 수 없습니다",
                    description: "유효하지 않은 작업 ID입니다.",
                    variant: "destructive"
                });
                navigate("/jobs");
            }
        };

        fetchJob();
    }, [jobId, navigate]);

    // Derived Data: Update fields/boxes when currentPageId changes
    useEffect(() => {
        if (!currentJob || !currentPageId) return;

        const results = currentJob.results[currentPageId];
        if (results) {
            setFields(results.fields || []);
            setBoxes(results.boxes || []);
        } else {
            setFields([]);
            setBoxes([]);
        }
        setSelectedFieldId(undefined);
    }, [currentPageId, currentJob]);

    // Handlers
    const handlePageSelect = (pageId: string) => {
        setCurrentPageId(pageId);
    };

    const handlePageChange = (pageDesc: number) => {
        const page = pages.find(p => p.pageNumber === pageDesc);
        if (page) setCurrentPageId(page.id);
    };

    const handleFieldSelect = (id: string) => {
        setSelectedFieldId(id);
    };

    const handleFieldUpdate = (id: string, value: any) => {
        setFields(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, value, isEdited: true, status: "valid" };
            }
            return f;
        }));

        setBoxes(prev => prev.map(b => {
            if (b.id === id) {
                return { ...b, status: "valid" };
            }
            return b;
        }));

        toast({
            description: "값이 수정되었습니다.",
            duration: 1000,
        });
    };

    const handleFieldConfirm = (id: string) => {
        setFields(prev => prev.map(f => {
            if (f.id === id) return { ...f, status: "valid" };
            return f;
        }));
        setBoxes(prev => prev.map(b => {
            if (b.id === id) return { ...b, status: "valid" };
            return b;
        }));
    };

    const handleAutoFix = async (id: string) => {
        const field = fields.find(f => f.id === id);
        if (!field) return;

        if (!openaiService.isConfigured()) {
            toast({
                title: "설정 필요",
                description: "AI 기능이 설정되지 않았습니다. API Key를 확인해주세요.",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "AI 분석 중...",
            description: "가장 적절한 값을 찾고 있습니다.",
        });

        try {
            const result = await openaiService.correctValue({
                fieldLabel: field.label,
                ocrValue: String(field.value)
            });

            if (result && result.correctedValue !== null) {
                // Update with corrected value
                handleFieldUpdate(id, result.correctedValue);
                toast({
                    title: "AI 자동 수정 완료",
                    description: `${result.reasoning} (신뢰도: ${Math.round(result.confidence * 100)}%)`,
                });
            } else {
                toast({
                    title: "수정 실패",
                    description: "AI가 적절한 값을 찾지 못했습니다.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Auto-fix failed", error);
            toast({
                title: "오류",
                description: "AI 서비스 연결에 실패했습니다.",
                variant: "destructive"
            });
        }
    };

    const handleCompletePage = async () => {
        console.log("handleCompletePage called", { currentPageId, jobId, hasJob: !!currentJob });

        if (!currentJob || !jobId) {
            console.error("Missing job data", { jobId, currentJob });
            toast({
                title: "오류",
                description: "작업 정보를 찾을 수 없습니다. 새로고침 해주세요.",
                variant: "destructive"
            });
            return;
        }

        try {
            // 1. Prepare updated data
            const updatedResults = {
                ...currentJob.results,
                [currentPageId]: {
                    fields: fields,
                    boxes: boxes
                }
            };

            const updatedPages = pages.map(p =>
                p.id === currentPageId ? { ...p, status: "valid" as const } : p
            );

            // Calculate progress
            const validPagesCount = updatedPages.filter(p => p.status === "valid").length;
            const newProgress = Math.round((validPagesCount / updatedPages.length) * 100);

            console.log("Saving page:", currentPageId, "New Progress:", newProgress);

            // 2. Local State Optimistic Update
            setPages(updatedPages);
            setCurrentJob({
                ...currentJob,
                results: updatedResults,
                progress: newProgress
            });

            // 3. Firestore Update
            await jobStore.updateJob(jobId, {
                results: updatedResults,
                pages: updatedPages,
                progress: newProgress
            });

            // 4. Navigation or Completion
            const currentIndex = pages.findIndex(p => p.id === currentPageId);
            console.log("Page Index:", currentIndex, "Total:", pages.length);

            if (currentIndex < pages.length - 1) {
                // Move to next page
                const nextPageId = pages[currentIndex + 1].id;
                setCurrentPageId(nextPageId);
                toast({
                    title: "페이지 완료",
                    description: "저장되었습니다. 다음 페이지로 이동합니다.",
                    duration: 1500,
                });
            } else {
                // Last page finished
                const allValid = updatedPages.every(p => p.status === "valid");
                if (allValid) {
                    await jobStore.updateJob(jobId, { status: 'completed' });
                }
                setShowCompleteDialog(true);
            }
        } catch (error) {
            console.error("Failed to save validation:", error);
            toast({
                title: "저장 실패",
                description: "변경사항 저장에 실패했습니다.",
                variant: "destructive"
            });
        }
    };

    const handleGoToAnalysis = () => {
        navigate("/analysis");
    };

    const handleGoToJobs = () => {
        navigate("/jobs");
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCompletePage();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentPageId, pages, currentJob]); // Added currentJob dependency

    const currentPageNumber = pages.find(p => p.id === currentPageId)?.pageNumber || 1;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Top Header (Compact) */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        나가기
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">배치 #2024-01-16</span>
                        <span className="text-muted-foreground text-sm">고객 만족도 조사</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Keyboard className="w-4 h-4 mr-2" />
                                단축키
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <span className="flex-1">페이지 이동</span>
                                <span className="text-xs text-muted-foreground ml-4">PgUp/PgDn</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span className="flex-1">확대/축소</span>
                                <span className="text-xs text-muted-foreground ml-4">Ctrl +/-</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span className="flex-1">필드 확정</span>
                                <span className="text-xs text-muted-foreground ml-4">Enter</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span className="flex-1">페이지 완료</span>
                                <span className="text-xs text-muted-foreground ml-4">Ctrl+Enter</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={handleCompletePage}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        페이지 완료 (Ctrl+Enter)
                    </Button>
                </div>
            </header>

            {/* Main Layout */}
            <ValidationLayout
                className="flex-1"
                thumbnailPanel={
                    <ThumbnailPanel
                        pages={pages}
                        currentPageId={currentPageId}
                        onPageSelect={handlePageSelect}
                    />
                }
                viewerPanel={
                    <DocumentViewer
                        imageUrl={pages.find(p => p.id === currentPageId)?.imageUrl}
                        currentPage={currentPageNumber}
                        totalPages={pages.length}
                        onPageChange={handlePageChange}
                        boxes={boxes}
                        selectedBoxId={selectedFieldId}
                        onBoxSelect={handleFieldSelect}
                    />
                }
                fieldPanel={
                    <FieldPanel
                        fields={fields}
                        selectedFieldId={selectedFieldId}
                        onFieldSelect={handleFieldSelect}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldConfirm={handleFieldConfirm}
                        onAutoFix={handleAutoFix}
                    />
                }
            />

            {/* Completion Dialog */}
            <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>검수 완료</AlertDialogTitle>
                        <AlertDialogDescription>
                            모든 페이지의 검수가 완료되었습니다.<br />
                            바로 통계 분석을 진행하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleGoToJobs}>목록으로</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGoToAnalysis}>분석하러 가기</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
