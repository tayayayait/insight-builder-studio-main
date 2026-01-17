import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";

export type JobStatus = "pending" | "processing" | "completed" | "error";

export type JobStage = "upload" | "ocr" | "refinement" | "analysis" | "report";

export interface JobCardProps {
    title: string;
    description?: string;
    status: JobStatus;
    progress: number;
    currentStage?: JobStage;
    eta?: string;
    createdAt?: string;
    onClick?: () => void;
    className?: string;
}

const STAGES: { key: JobStage; label: string }[] = [
    { key: "upload", label: "업로드" },
    { key: "ocr", label: "OCR" },
    { key: "refinement", label: "정제" },
    { key: "analysis", label: "분석" },
    { key: "report", label: "리포트" },
];

const getStatusConfig = (status: JobStatus): { label: string; type: StatusType; icon: React.ReactNode } => {
    switch (status) {
        case "completed":
            return {
                label: "완료",
                type: "success",
                icon: <CheckCircle2 className="w-4 h-4 text-success" />,
            };
        case "processing":
            return {
                label: "진행중",
                type: "primary",
                icon: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
            };
        case "error":
            return {
                label: "오류",
                type: "danger",
                icon: <AlertCircle className="w-4 h-4 text-danger" />,
            };
        case "pending":
        default:
            return {
                label: "대기중",
                type: "default",
                icon: <Clock className="w-4 h-4 text-muted-foreground" />,
            };
    }
};

const getStageIndex = (stage: JobStage): number => {
    return STAGES.findIndex((s) => s.key === stage);
};

export function JobCard({
    title,
    description,
    status,
    progress,
    currentStage,
    eta,
    createdAt,
    onClick,
    className,
}: JobCardProps) {
    const statusConfig = getStatusConfig(status);
    const currentStageIndex = currentStage ? getStageIndex(currentStage) : -1;

    return (
        <div
            onClick={onClick}
            className={cn(
                "surface-card p-4 transition-all",
                onClick && "cursor-pointer hover:shadow-[var(--shadow-2)]",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">{statusConfig.icon}</div>
                    <div className="min-w-0">
                        <h3 className="text-body font-medium text-foreground truncate">{title}</h3>
                        {description && (
                            <p className="text-small text-muted-foreground truncate mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <StatusBadge status={statusConfig.type}>{statusConfig.label}</StatusBadge>
            </div>

            {/* Progress */}
            {status === "processing" && (
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-small text-muted-foreground">진행률</span>
                        <span className="text-small font-medium font-mono-nums">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            {/* Stages */}
            {status === "processing" && currentStage && (
                <div className="flex items-center gap-1 mb-3">
                    {STAGES.map((stage, index) => {
                        const isCompleted = index < currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        const isPending = index > currentStageIndex;

                        return (
                            <React.Fragment key={stage.key}>
                                <div
                                    className={cn(
                                        "flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-medium transition-colors",
                                        isCompleted && "bg-success-50 text-success",
                                        isCurrent && "bg-primary-50 text-primary",
                                        isPending && "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {stage.label}
                                </div>
                                {index < STAGES.length - 1 && (
                                    <div
                                        className={cn(
                                            "w-3 h-0.5 rounded-full",
                                            isCompleted ? "bg-success" : "bg-border"
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-small text-muted-foreground">
                {eta && status === "processing" && (
                    <span>예상 완료: {eta}</span>
                )}
                {createdAt && (
                    <span className="font-mono-nums">{createdAt}</span>
                )}
            </div>
        </div>
    );
}
