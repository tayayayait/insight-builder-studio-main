import * as React from "react";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight } from "lucide-react";

interface ValidationLayoutProps {
    thumbnailPanel: React.ReactNode;
    viewerPanel: React.ReactNode;
    fieldPanel: React.ReactNode;
    className?: string;
    defaultLayout?: number[];
}

export function ValidationLayout({
    thumbnailPanel,
    viewerPanel,
    fieldPanel,
    className,
    defaultLayout = [20, 50, 30],
}: ValidationLayoutProps) {
    const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = React.useState(false);

    // Responsive logic could be added here or handled by parent page
    // For now, we use ResizablePanelGroup for desktop layout

    return (
        <div className={cn("h-[calc(100vh-4rem)] overflow-hidden bg-background", className)}>
            <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">

                {/* Left Panel: Thumbnails */}
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={0}
                    collapsible={true}
                    minSize={15}
                    maxSize={25}
                    onCollapse={() => setIsLeftCollapsed(true)}
                    onExpand={() => setIsLeftCollapsed(false)}
                    className={cn(
                        "min-w-[50px] transition-all duration-300 ease-in-out border-r bg-muted/10",
                        isLeftCollapsed && "min-w-[50px] max-w-[50px]"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between p-2 border-b h-[40px]">
                            <span className={cn("text-xs font-semibold px-2", isLeftCollapsed && "sr-only")}>
                                페이지
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                            >
                                <PanelLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        {!isLeftCollapsed && (
                            <ScrollArea className="flex-1">
                                {thumbnailPanel}
                            </ScrollArea>
                        )}
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Center Panel: Viewer */}
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <div className="h-full flex flex-col bg-muted/30">
                        {viewerPanel}
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel: Fields */}
                <ResizablePanel
                    defaultSize={defaultLayout[2]}
                    collapsedSize={0}
                    collapsible={true}
                    minSize={20}
                    maxSize={40}
                    onCollapse={() => setIsRightCollapsed(true)}
                    onExpand={() => setIsRightCollapsed(false)}
                    className={cn(
                        "min-w-[50px] transition-all duration-300 ease-in-out border-l bg-background",
                        isRightCollapsed && "min-w-[50px] max-w-[50px]"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between p-2 border-b h-[40px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsRightCollapsed(!isRightCollapsed)}
                            >
                                <PanelRight className="h-4 w-4" />
                            </Button>
                            <span className={cn("text-xs font-semibold px-2", isRightCollapsed && "sr-only")}>
                                추출 데이터
                            </span>
                        </div>
                        {!isRightCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                {fieldPanel}
                            </div>
                        )}
                    </div>
                </ResizablePanel>

            </ResizablePanelGroup>
        </div>
    );
}
