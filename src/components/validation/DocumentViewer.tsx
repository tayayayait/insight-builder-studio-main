import * as React from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCw,
    Move,
    Maximize,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    confidence?: number;
    status?: "valid" | "warning" | "error" | "pending";
}

interface DocumentViewerProps {
    imageUrl?: string;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    boxes?: BoundingBox[];
    selectedBoxId?: string;
    onBoxSelect?: (id: string) => void;
    className?: string;
}

export function DocumentViewer({
    imageUrl,
    currentPage,
    totalPages,
    onPageChange,
    boxes = [],
    selectedBoxId,
    onBoxSelect,
    className,
}: DocumentViewerProps) {
    const [zoom, setZoom] = React.useState(100);
    const [rotation, setRotation] = React.useState(0);
    const [showBoxes, setShowBoxes] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                case "PageUp":
                    e.preventDefault();
                    onPageChange(Math.max(1, currentPage - 1));
                    break;
                case "ArrowRight":
                case "PageDown":
                    e.preventDefault();
                    onPageChange(Math.min(totalPages, currentPage + 1));
                    break;
                case "+":
                case "=":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomIn();
                    }
                    break;
                case "-":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomOut();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentPage, totalPages, onPageChange]);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

    // Status colors for bounding boxes
    const getBoxStyle = (box: BoundingBox, isSelected: boolean) => {
        let borderColor = "var(--primary)";
        let bgColor = "rgba(var(--primary-rgb), 0.1)";

        if (box.status === "error") {
            borderColor = "var(--danger)";
            bgColor = "rgba(var(--danger-rgb), 0.1)";
        } else if (box.status === "warning") {
            borderColor = "var(--warning)";
            bgColor = "rgba(var(--warning-rgb), 0.1)";
        }

        return {
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            borderColor: isSelected ? borderColor : borderColor,
            backgroundColor: isSelected ? bgColor : "transparent",
            boxShadow: isSelected ? `0 0 0 2px ${borderColor}, 0 4px 8px rgba(0,0,0,0.2)` : "none",
            zIndex: isSelected ? 20 : 10,
        };
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-background shadow-sm z-30">
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleZoomOut}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>축소 (Ctrl -)</TooltipContent>
                    </Tooltip>

                    <div className="w-24 px-2">
                        <Slider
                            value={[zoom]}
                            min={50}
                            max={200}
                            step={10}
                            onValueChange={(v) => setZoom(v[0])}
                        />
                    </div>
                    <span className="text-xs font-mono-nums min-w-[3rem] text-center">
                        {zoom}%
                    </span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleZoomIn}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>확대 (Ctrl +)</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-4 bg-border mx-2" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleRotate}
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>회전</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setShowBoxes(!showBoxes)}
                            >
                                {showBoxes ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>OCR 영역 {showBoxes ? "숨기기" : "보이기"}</TooltipContent>
                    </Tooltip>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-muted/30 relative flex items-center justify-center p-8"
            >
                <div
                    className="relative transition-transform duration-200 ease-out shadow-lg bg-white"
                    style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        width: "fit-content",
                        height: "fit-content",
                    }}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Document"
                            className="max-w-none block"
                            loading="lazy"
                            draggable={false}
                            style={{
                                // A4 ratio placeholder if loading or mock
                                minWidth: "595px",
                                minHeight: "842px",
                            }}
                        />
                    ) : (
                        <div
                            className="bg-white flex items-center justify-center border border-border"
                            style={{ width: "595px", height: "842px" }}
                        >
                            <span className="text-muted-foreground">이미지 없음</span>
                        </div>
                    )}

                    {/* OCR Highlights Layer */}
                    {showBoxes && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            {boxes.map((box) => {
                                const isSelected = box.id === selectedBoxId;
                                return (
                                    <div
                                        key={box.id}
                                        className={cn(
                                            "absolute border-2 transition-all cursor-pointer pointer-events-auto hover:bg-primary/10",
                                            isSelected ? "ring-2 ring-primary ring-offset-1" : "opacity-60 hover:opacity-100"
                                        )}
                                        style={getBoxStyle(box, isSelected)}
                                        onClick={() => onBoxSelect?.(box.id)}
                                    >
                                        {isSelected && box.confidence && (
                                            <div className="absolute -top-6 left-0 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-30">
                                                {Math.round(box.confidence * 100)}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
