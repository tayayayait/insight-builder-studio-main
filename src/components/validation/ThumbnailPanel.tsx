import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type PageStatus = "valid" | "warning" | "error" | "pending";

export interface PageItem {
    id: string;
    pageNumber: number;
    thumbnailUrl?: string;
    status: PageStatus;
    issueCount?: number;
}

interface ThumbnailPanelProps {
    pages: PageItem[];
    currentPageId: string;
    onPageSelect: (id: string) => void;
    className?: string;
}

export function ThumbnailPanel({
    pages,
    currentPageId,
    onPageSelect,
    className,
}: ThumbnailPanelProps) {
    const [filterUnchecked, setFilterUnchecked] = React.useState(false);

    const filteredPages = React.useMemo(() => {
        if (!filterUnchecked) return pages;
        return pages.filter((p) => p.status !== "valid");
    }, [pages, filterUnchecked]);

    const getStatusIcon = (status: PageStatus) => {
        switch (status) {
            case "valid":
                return <Check className="w-3 h-3 text-success" />;
            case "error":
                return <XCircle className="w-3 h-3 text-danger" />;
            case "warning":
                return <AlertTriangle className="w-3 h-3 text-warning" />;
            default:
                return null;
        }
    };

    const statusColorMap: Record<PageStatus, string> = {
        valid: "border-success",
        warning: "border-warning bg-warning-50/10",
        error: "border-danger bg-danger-50/10",
        pending: "border-border",
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Filter Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-background sticky top-0 z-10">
                <span className="text-xs font-medium text-muted-foreground px-1">
                    {filteredPages.length} 페이지
                </span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Toggle
                            size="sm"
                            pressed={filterUnchecked}
                            onPressedChange={setFilterUnchecked}
                            className="h-7 w-7 p-0 data-[state=on]:bg-accent"
                        >
                            <Filter className="w-3.5 h-3.5" />
                        </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>미확정/오류 항목만 보기</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {filteredPages.map((page) => (
                        <div
                            key={page.id}
                            onClick={() => onPageSelect(page.id)}
                            className={cn(
                                "group relative cursor-pointer rounded-md border-2 transition-all p-1",
                                page.id === currentPageId
                                    ? "ring-2 ring-primary ring-offset-1 border-primary"
                                    : "hover:border-primary/50",
                                page.id !== currentPageId && statusColorMap[page.status]
                            )}
                        >
                            {/* Thumbnail Image Placeholder */}
                            <div className="relative aspect-[3/4] bg-muted rounded-sm overflow-hidden mb-1">
                                {page.thumbnailUrl ? (
                                    <img
                                        src={page.thumbnailUrl}
                                        alt={`Page ${page.pageNumber}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                        Page {page.pageNumber}
                                    </div>
                                )}

                                {/* Status Overlay for Issues */}
                                {(page.status === "error" || page.status === "warning") && (
                                    <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm">
                                        {getStatusIcon(page.status)}
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center justify-between px-1">
                                <span className={cn(
                                    "text-xs font-medium",
                                    page.id === currentPageId ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {page.pageNumber}
                                </span>
                                {page.status === "valid" && (
                                    <Check className="w-3 h-3 text-success" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
