import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Default/Mock correlation matrix data
const DEFAULT_VARIABLES = ["전체만족", "서비스", "가격", "직원", "시설", "접근성"];

const DEFAULT_MATRIX = [
    [1.0, 0.82, 0.65, 0.78, 0.71, 0.58],
    [0.82, 1.0, 0.54, 0.69, 0.62, 0.45],
    [0.65, 0.54, 1.0, 0.42, 0.38, 0.51],
    [0.78, 0.69, 0.42, 1.0, 0.73, 0.39],
    [0.71, 0.62, 0.38, 0.73, 1.0, 0.44],
    [0.58, 0.45, 0.51, 0.39, 0.44, 1.0],
];

// Color scale for correlation values
const getCorrelationColor = (value: number): string => {
    if (value >= 0.7) return "bg-primary text-primary-foreground";
    if (value >= 0.5) return "bg-primary/70 text-primary-foreground";
    if (value >= 0.3) return "bg-primary/40 text-foreground";
    if (value >= 0) return "bg-primary/20 text-foreground";
    if (value >= -0.3) return "bg-danger/20 text-foreground";
    if (value >= -0.5) return "bg-danger/40 text-foreground";
    return "bg-danger/70 text-danger-foreground";
};

interface CorrelationData {
    variables: string[];
    matrix: number[][];
}

interface CorrelationHeatmapProps {
    className?: string;
    data?: CorrelationData;
    onCellClick?: (row: number, col: number, value: number) => void;
}

export function CorrelationHeatmap({ className, data, onCellClick }: CorrelationHeatmapProps) {
    const [hoveredCell, setHoveredCell] = React.useState<{ row: number; col: number } | null>(null);

    // Use provided data or fall back to defaults
    const VARIABLES = data?.variables || DEFAULT_VARIABLES;
    const CORRELATION_MATRIX = data?.matrix || DEFAULT_MATRIX;

    // Calculate top correlations from the matrix
    const topCorrelations = React.useMemo(() => {
        const pairs: { pair: string; value: number }[] = [];

        for (let i = 0; i < VARIABLES.length; i++) {
            for (let j = i + 1; j < VARIABLES.length; j++) {
                pairs.push({
                    pair: `${VARIABLES[i]} ↔ ${VARIABLES[j]}`,
                    value: CORRELATION_MATRIX[i][j]
                });
            }
        }

        return pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 5);
    }, [VARIABLES, CORRELATION_MATRIX]);

    return (
        <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
            {/* Heatmap Card */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-h3">상관관계 히트맵</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-small text-muted-foreground"></th>
                                    {VARIABLES.map((v) => (
                                        <th key={v} className="p-2 text-center text-small font-medium min-w-[60px]">
                                            {v}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {VARIABLES.map((rowVar, rowIdx) => (
                                    <tr key={rowVar}>
                                        <td className="p-2 text-small font-medium text-right pr-3">{rowVar}</td>
                                        {CORRELATION_MATRIX[rowIdx].map((value, colIdx) => {
                                            const isHovered =
                                                hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx;
                                            const isExact =
                                                hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={cn(
                                                        "p-0 text-center transition-all cursor-pointer",
                                                        isHovered && !isExact && "opacity-80"
                                                    )}
                                                    onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                    onClick={() => onCellClick?.(rowIdx, colIdx, value)}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-full aspect-square flex items-center justify-center text-xs font-mono-nums transition-transform",
                                                            getCorrelationColor(value),
                                                            isExact && "scale-110 ring-2 ring-foreground z-10 relative rounded-sm"
                                                        )}
                                                    >
                                                        {value.toFixed(2)}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                        <span className="text-muted-foreground">약함</span>
                        <div className="flex">
                            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                                <div
                                    key={v}
                                    className={cn("w-6 h-4", getCorrelationColor(v))}
                                    title={v.toString()}
                                />
                            ))}
                        </div>
                        <span className="text-muted-foreground">강함</span>
                    </div>
                </CardContent>
            </Card>

            {/* Top Correlations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h3">상위 상관관계</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topCorrelations.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-[var(--radius-sm)]"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-small font-medium text-muted-foreground w-5">
                                        {idx + 1}.
                                    </span>
                                    <span className="text-body">{item.pair}</span>
                                </div>
                                <span
                                    className={cn(
                                        "font-mono-nums font-bold px-2 py-0.5 rounded text-sm",
                                        item.value >= 0.7 ? "bg-primary/20 text-primary" : "bg-muted"
                                    )}
                                >
                                    {item.value.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        * 상관계수 0.7 이상은 강한 상관관계를 나타냅니다
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
