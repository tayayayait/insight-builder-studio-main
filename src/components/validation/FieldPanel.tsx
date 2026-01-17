import * as React from "react";
import {
    Check,
    AlertTriangle,
    RotateCcw,
    Edit2,
    CheckSquare,
    Square,
    Save,
    MoreVertical,
    Sparkles,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface FieldData {
    id: string;
    label: string;
    value: string | number | boolean;
    originalValue?: string | number | boolean;
    type: "text" | "number" | "checkbox";
    confidence: number;
    status: "valid" | "warning" | "error" | "pending";
    isEdited?: boolean;
}

interface FieldPanelProps {
    fields: FieldData[];
    selectedFieldId?: string;
    onFieldSelect: (id: string) => void;
    onFieldUpdate: (id: string, value: any) => void;
    onFieldConfirm: (id: string) => void;
    onAutoFix?: (id: string) => void;
    className?: string;
}

export function FieldPanel({
    fields,
    selectedFieldId,
    onFieldSelect,
    onFieldUpdate,
    onFieldConfirm,
    onAutoFix,
    className,
}: FieldPanelProps) {
    // Group fields by sections if needed later. For now flat list.

    const getStatusColor = (status: FieldData["status"]) => {
        switch (status) {
            case "valid":
                return "bg-success-50 text-success border-success/20";
            case "warning":
                return "bg-warning-50 text-warning border-warning/20";
            case "error":
                return "bg-danger-50 text-danger border-danger/20";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    const renderInput = (field: FieldData) => {
        switch (field.type) {
            case "checkbox":
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "justify-start flex-1",
                                field.value ? "bg-primary-50 border-primary text-primary" : "text-muted-foreground"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onFieldUpdate(field.id, !field.value);
                            }}
                        >
                            {field.value ? (
                                <>
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    선택됨
                                </>
                            ) : (
                                <>
                                    <Square className="w-4 h-4 mr-2" />
                                    선택 안됨
                                </>
                            )}
                        </Button>
                    </div>
                );
            case "number":
            case "text":
            default:
                return (
                    <Input
                        value={String(field.value)}
                        onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()} // Prevent selecting field row when clicking input
                    />
                );
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header Stat */}
            <div className="p-4 border-b space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">확인 진행률</span>
                    <span className="font-mono-nums font-bold">
                        {Math.round((fields.filter(f => f.status === 'valid').length / fields.length) * 100)}%
                    </span>
                </div>
                <Progress value={(fields.filter(f => f.status === 'valid').length / fields.length) * 100} className="h-1.5" />
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            className={cn(
                                "group relative border rounded-[var(--radius-sm)] p-3 transition-all outline-none",
                                selectedFieldId === field.id
                                    ? "ring-2 ring-primary border-primary bg-primary-50/10"
                                    : "hover:border-primary/50",
                                field.status === "error" && selectedFieldId !== field.id && "border-danger bg-danger-50/10",
                                field.status === "warning" && selectedFieldId !== field.id && "border-warning bg-warning-50/10"
                            )}
                            onClick={() => onFieldSelect(field.id)}
                            tabIndex={0}
                        >
                            <div className="flex item-start justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    {field.label}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("h-5 px-1.5 font-normal", getStatusColor(field.status))}>
                                        {Math.round(field.confidence * 100)}%
                                    </Badge>

                                    {/* AI Auto-Fix Button */}
                                    {onAutoFix && field.status !== "valid" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-violet-500 hover:text-violet-600 hover:bg-violet-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAutoFix(field.id);
                                            }}
                                            title="AI 스마트 수정"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </Button>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onFieldUpdate(field.id, field.originalValue)}>
                                                <RotateCcw className="w-3 h-3 mr-2" />
                                                원래 값으로 복구
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    {renderInput(field)}
                                </div>
                                {/* Confirm Action */}
                                {field.status !== "valid" && (
                                    <Button
                                        size="sm"
                                        variant={field.status === "error" ? "outline" : "ghost"}
                                        className={cn(
                                            "h-8 w-8 p-0 shrink-0",
                                            field.status === "error" ? "text-danger border-danger hover:bg-danger-50" : "text-muted-foreground hover:text-success hover:bg-success-50"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFieldConfirm(field.id);
                                        }}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Feedback Message */}
                            {field.status === "error" && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-danger">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>인식 신뢰도가 낮습니다. 값을 확인해주세요.</span>
                                </div>
                            )}

                            {/* Edited Indicator */}
                            {field.isEdited && (
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                    <Edit2 className="w-3 h-3" />
                                    <span>수정됨</span>
                                    {field.originalValue !== undefined && (
                                        <span className="opacity-70 line-through ml-1">{String(field.originalValue)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Undo/Auto-save Footer (Optional) */}
            <div className="p-2 border-t bg-muted/20 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <Save className="w-3 h-3" />
                모든 변경사항이 자동 저장됩니다
            </div>
        </div>
    );
}
