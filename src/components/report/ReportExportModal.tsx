import * as React from "react";
import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Presentation, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { analysisResultStore } from "@/services/analysisResultStore";
import { exportAnalysisReportToPDF, exportAnalysisToExcel } from "@/services/exportService";

interface ReportExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportTitle?: string;
    analysisId: string;
}

const FORMAT_OPTIONS = [
    { id: "pdf", label: "PDF", icon: FileText, description: "문서 형식 리포트" },
    { id: "pptx", label: "PowerPoint", icon: Presentation, description: "프레젠테이션용" },
    { id: "xlsx", label: "Excel", icon: FileSpreadsheet, description: "데이터 분석용" },
];

export function ReportExportModal({
    open,
    onOpenChange,
    reportTitle = "리포트",
    analysisId,
}: ReportExportModalProps) {
    const [selectedFormat, setSelectedFormat] = useState("pdf");
    const [includeMasking, setIncludeMasking] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        if (!analysisId) {
            toast({
                title: "오류",
                description: "분석 결과를 찾을 수 없습니다.",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        setProgress(10);

        try {
            // 1. Fetch Data
            const result = await analysisResultStore.getResult(analysisId);
            setProgress(30);

            if (!result || !result.data) {
                throw new Error("분석 데이터를 불러올 수 없습니다.");
            }

            setProgress(50);

            // 2. Export based on format
            const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

            if (selectedFormat === 'pdf') {
                await exportAnalysisReportToPDF(result.data, {
                    title: reportTitle,
                    subtitle: `분석 일자: ${new Date(result.analyzedAt).toLocaleDateString()}`,
                    filename: `${filename}.pdf`
                });
            } else if (selectedFormat === 'xlsx') {
                exportAnalysisToExcel(result.data, {
                    filename: `${filename}.xlsx`
                });
            } else {
                toast({
                    title: "알림",
                    description: "PPTX 내보내기는 아직 준비 중입니다.",
                });
                setIsGenerating(false);
                return;
            }

            setProgress(100);

            toast({
                title: "다운로드 완료",
                description: "파일이 성공적으로 생성되었습니다.",
            });

            // Close modal after short delay
            setTimeout(() => {
                onOpenChange(false);
                setProgress(0);
            }, 1000);

        } catch (error) {
            console.error("Export failed:", error);
            toast({
                title: "내보내기 실패",
                description: "파일 생성 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>리포트 내보내기</DialogTitle>
                    <DialogDescription>
                        "{reportTitle}" 리포트를 다운로드할 형식을 선택하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <Label>파일 형식</Label>
                        <RadioGroup
                            value={selectedFormat}
                            onValueChange={setSelectedFormat}
                            className="grid grid-cols-3 gap-3"
                        >
                            {FORMAT_OPTIONS.map((format) => {
                                const Icon = format.icon;
                                const isSelected = selectedFormat === format.id;
                                return (
                                    <label
                                        key={format.id}
                                        className={cn(
                                            "flex flex-col items-center p-4 border rounded-[var(--radius-md)] cursor-pointer transition-all",
                                            isSelected
                                                ? "border-primary bg-primary-50/50 ring-1 ring-primary"
                                                : "hover:border-primary/50"
                                        )}
                                    >
                                        <RadioGroupItem value={format.id} className="sr-only" />
                                        <Icon
                                            className={cn(
                                                "w-8 h-8 mb-2",
                                                isSelected ? "text-primary" : "text-muted-foreground"
                                            )}
                                        />
                                        <span className="font-medium">{format.label}</span>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            {format.description}
                                        </span>
                                    </label>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* Options */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>개인정보 마스킹</Label>
                                <p className="text-small text-muted-foreground">
                                    주민번호, 전화번호 등을 자동으로 마스킹 처리합니다.
                                </p>
                            </div>
                            <Switch
                                checked={includeMasking}
                                onCheckedChange={setIncludeMasking}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    {isGenerating && (
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">리포트 생성 중...</span>
                                <span className="font-mono-nums">{progress}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        취소
                    </Button>
                    <Button onClick={handleExport} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                생성 중...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                다운로드
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
