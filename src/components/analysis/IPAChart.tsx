import * as React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ZAxis,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IPAItem {
    questionId: string;
    label: string;
    importance: number;
    performance: number;
    quadrant: 1 | 2 | 3 | 4;
}

interface IPAResult {
    items: IPAItem[];
    importanceMean: number;
    performanceMean: number;
    method?: "stated" | "derived";
}

interface IPADataPoint {
    name: string;
    importance: number;
    performance: number;
    quadrant: "keep" | "focus" | "low" | "possible";
}

const QUADRANT_CONFIG = {
    keep: { label: "유지 강화", color: "var(--success)", bg: "bg-success-50" },
    focus: { label: "집중 개선", color: "var(--danger)", bg: "bg-danger-50" },
    low: { label: "우선 개선", color: "var(--warning)", bg: "bg-warning-50" },
    possible: { label: "과잉 투자", color: "var(--chart-3)", bg: "bg-muted" },
};

const QUADRANT_MAP: Record<IPAItem["quadrant"], IPADataPoint["quadrant"]> = {
    1: "keep",
    2: "focus",
    3: "low",
    4: "possible",
};

const getDomain = (values: number[]) => {
    if (values.length === 0) return [0, 5];
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = Math.max(0.5, (maxValue - minValue) * 0.1);
    return [Math.max(0, minValue - padding), maxValue + padding];
};

interface IPAChartProps {
    className?: string;
    data?: IPAResult;
}

export function IPAChart({ className, data }: IPAChartProps) {
    const [selectedPoint, setSelectedPoint] = React.useState<IPADataPoint | null>(null);
    const items = data?.items ?? [];

    const chartData = React.useMemo<IPADataPoint[]>(
        () =>
            items.map((item) => ({
                name: item.label,
                importance: item.importance,
                performance: item.performance,
                quadrant: QUADRANT_MAP[item.quadrant],
            })),
        [items]
    );

    const avgImportance =
        data?.importanceMean ?? (items.length > 0 ? items.reduce((sum, item) => sum + item.importance, 0) / items.length : 0);
    const avgPerformance =
        data?.performanceMean ?? (items.length > 0 ? items.reduce((sum, item) => sum + item.performance, 0) / items.length : 0);

    const performanceDomain = React.useMemo(() => getDomain(items.map((item) => item.performance)), [items]);
    const importanceDomain = React.useMemo(() => getDomain(items.map((item) => item.importance)), [items]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload as IPADataPoint;
            return (
                <div className="bg-popover border shadow-lg rounded-[var(--radius-sm)] p-3">
                    <p className="font-medium text-foreground">{dataPoint.name}</p>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <p>
                            중요도 <span className="font-mono-nums">{dataPoint.importance.toFixed(2)}</span>
                        </p>
                        <p>
                            성과 <span className="font-mono-nums">{dataPoint.performance.toFixed(2)}</span>
                        </p>
                    </div>
                    <p className={`text-xs mt-2 px-1.5 py-0.5 rounded ${QUADRANT_CONFIG[dataPoint.quadrant].bg}`}>
                        {QUADRANT_CONFIG[dataPoint.quadrant].label}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
            {/* Chart */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-h3">IPA 분석 (중요도-성과)</CardTitle>
                    <CardDescription>
                        중요도와 성과를 비교하여 개선 우선순위를 도출합니다.
                        {data?.method && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({data.method === "stated" ? "표기 중요도" : "파생 중요도"})
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="performance"
                                        name="성과"
                                        domain={performanceDomain as [number, number]}
                                        label={{ value: "성과 점수", position: "insideBottom", offset: -10 }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="importance"
                                        name="중요도"
                                        domain={importanceDomain as [number, number]}
                                        label={{ value: "중요도 점수", angle: -90, position: "insideLeft" }}
                                    />
                                    <ZAxis range={[100, 100]} />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* Reference lines for quadrants */}
                                    <ReferenceLine
                                        x={avgPerformance}
                                        stroke="var(--border)"
                                        strokeDasharray="5 5"
                                    />
                                    <ReferenceLine
                                        y={avgImportance}
                                        stroke="var(--border)"
                                        strokeDasharray="5 5"
                                    />

                                    <Scatter name="항목" data={chartData} onClick={(dataPoint) => setSelectedPoint(dataPoint)}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={QUADRANT_CONFIG[entry.quadrant].color}
                                                stroke={selectedPoint?.name === entry.name ? "var(--foreground)" : "none"}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                IPA 분석 데이터가 없습니다.
                            </div>
                        )}
                    </div>

                    {/* Quadrant Labels */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-center">
                        <div className="p-2 bg-danger-50 rounded-[var(--radius-sm)]">
                            <span className="font-medium text-danger">② 집중 개선</span>
                            <p className="text-muted-foreground">High Importance, Low Performance</p>
                        </div>
                        <div className="p-2 bg-success-50 rounded-[var(--radius-sm)]">
                            <span className="font-medium text-success">① 유지 강화</span>
                            <p className="text-muted-foreground">High Importance, High Performance</p>
                        </div>
                        <div className="p-2 bg-warning-50 rounded-[var(--radius-sm)]">
                            <span className="font-medium text-warning">③ 우선 개선</span>
                            <p className="text-muted-foreground">Low Importance, Low Performance</p>
                        </div>
                        <div className="p-2 bg-muted rounded-[var(--radius-sm)]">
                            <span className="font-medium text-muted-foreground">④ 과잉 투자</span>
                            <p className="text-muted-foreground">Low Importance, High Performance</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Insights Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h3">분석 인사이트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {chartData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            IPA 분석에 사용할 문항 페어(중요도/만족도)가 없거나 데이터가 부족합니다.
                        </p>
                    ) : (
                        <>
                            <div>
                                <h4 className="text-sm font-medium text-danger mb-2">집중 개선 필요</h4>
                                <ul className="space-y-1.5">
                                    {chartData.filter((d) => d.quadrant === "focus").map((item) => (
                                        <li
                                            key={item.name}
                                            className="text-sm p-2 bg-danger-50/50 rounded-[var(--radius-sm)]"
                                        >
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-success mb-2">현재 강점</h4>
                                <ul className="space-y-1.5">
                                    {chartData.filter((d) => d.quadrant === "keep").map((item) => (
                                        <li
                                            key={item.name}
                                            className="text-sm p-2 bg-success-50/50 rounded-[var(--radius-sm)]"
                                        >
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
