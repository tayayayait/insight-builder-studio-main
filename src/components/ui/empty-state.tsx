import * as React from "react";
import { LucideIcon, FolderOpen, FileSearch, Upload, BarChart3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmptyStateType = "default" | "upload" | "project" | "search" | "analysis" | "error";

export interface EmptyStateProps {
    type?: EmptyStateType;
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    className?: string;
}

const TYPE_ICONS: Record<EmptyStateType, LucideIcon> = {
    default: FolderOpen,
    upload: Upload,
    project: FolderOpen,
    search: FileSearch,
    analysis: BarChart3,
    error: AlertCircle,
};

export function EmptyState({
    type = "default",
    icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    className,
}: EmptyStateProps) {
    const Icon = icon || TYPE_ICONS[type];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-4 text-center",
                className
            )}
        >
            <div
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                    type === "error" ? "bg-danger-50" : "bg-primary-50"
                )}
            >
                <Icon
                    className={cn(
                        "w-8 h-8",
                        type === "error" ? "text-danger" : "text-primary"
                    )}
                />
            </div>

            <h3 className="text-h3 text-foreground mb-2">{title}</h3>

            {description && (
                <p className="text-body text-muted-foreground max-w-md mb-6">
                    {description}
                </p>
            )}

            {(actionLabel || secondaryActionLabel) && (
                <div className="flex items-center gap-3">
                    {secondaryActionLabel && onSecondaryAction && (
                        <Button variant="outline" onClick={onSecondaryAction}>
                            {secondaryActionLabel}
                        </Button>
                    )}
                    {actionLabel && onAction && (
                        <Button onClick={onAction}>{actionLabel}</Button>
                    )}
                </div>
            )}
        </div>
    );
}
