import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Download,
    Eye,
    ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";



import { jobStore, JobData, PageItem } from "@/services/jobStore";
import { useEffect } from "react";

// interface LogEntry stays...
interface LogEntry {
    id: string;
    timestamp: string;
    stage: string;
    message: string;
    level: "info" | "warning" | "error";
}

const MOCK_LOGS: LogEntry[] = []; // Keep logs empty for now, or implement logging


const getStatusBadge = (status: PageItem["status"]): { label: string; type: StatusType } => {
    switch (status) {
        case "valid":
            return { label: "완료", type: "success" };
        case "warning":
            return { label: "주의", type: "warning" };
        case "error":
            return { label: "오류", type: "danger" };
        default:
            return { label: "대기", type: "info" };
    }
};

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("summary");

    const [job, setJob] = useState<JobData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchJob = async () => {
            setLoading(true);
            try {
                const data = await jobStore.getJob(id);
                if (data) setJob(data);
            } catch (error) {
                console.error("Failed to fetch job:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">작업 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <h2 className="text-xl font-semibold">작업을 찾을 수 없습니다</h2>
                <p className="text-muted-foreground">요청하신 작업 ID({id})에 해당하는 정보를 찾을 수 없습니다.</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/")}>대시보드로 이동</Button>
                    <Button onClick={() => navigate("/jobs")}>작업 목록으로 이동</Button>
                </div>
            </div>
        );
    }

    const fileColumns: Column<PageItem>[] = [
        {
            key: "id",
            header: "파일명/ID",
            render: (row) => <span className="font-medium text-xs font-mono">{row.id.slice(0, 8)}...</span>,
        },
        {
            key: "pageNumber",
            header: "페이지",
            align: "right",
            render: (row) => <span className="font-mono-nums">{row.pageNumber}</span>,
        },
        {
            key: "status",
            header: "상태",
            align: "center",
            render: (row) => {
                const badge = getStatusBadge(row.status);
                return <StatusBadge status={badge.type}>{badge.label}</StatusBadge>;
            },
        },
        {
            key: "imageUrl",
            header: "보기",
            width: "100px",
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(row.imageUrl || row.thumbnailUrl, '_blank')}>
                        <Eye className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            {/* Back Button & Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/jobs")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    작업 목록으로
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-h1">{job.name}</h1>
                        <p className="text-body text-muted-foreground mt-1">
                            {/* Project Name logic would go here if we had it, for now hardcode or omit */}
                            워크스페이스 · {new Date(job.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status="primary">진행중 {job.progress}%</StatusBadge>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            내보내기
                        </Button>
                        <Button onClick={() => navigate(`/validation/${job.id}`)}>
                            검수하기
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <Card className="mb-6">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-body font-medium">전체 진행률</span>
                        <span className="text-body font-mono-nums">{job.progress}%</span>
                    </div>
                    <ProgressBar value={job.progress} size="md" />
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="summary">요약</TabsTrigger>
                    <TabsTrigger value="files">파일</TabsTrigger>
                    <TabsTrigger value="logs">로그</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="전체 파일"
                            value={job.totalFiles}
                            icon={FileText}
                        />
                        <KpiCard
                            label="총 페이지"
                            value={job.pages.length}
                            icon={FileText}
                        />
                        <KpiCard
                            label="추출 항목(예시)"
                            value={Object.values(job.results || {}).reduce((acc, curr) => acc + (curr.fields?.length || 0), 0)}
                            icon={CheckCircle2}
                        />
                        <KpiCard
                            label="오류 페이지"
                            value={job.pages.filter(p => p.status === 'error').length}
                            icon={AlertTriangle}
                        />
                    </div>
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-h3">파일 목록</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={fileColumns}
                                data={job.pages}
                                keyField="id"
                                className="border-0 rounded-none shadow-none"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-h3">처리 로그</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {MOCK_LOGS.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`flex items-start gap-3 p-3 rounded-[var(--radius-sm)] ${log.level === "error"
                                            ? "bg-danger-50"
                                            : log.level === "warning"
                                                ? "bg-warning-50"
                                                : "bg-muted"
                                            }`}
                                    >
                                        <span className="text-small font-mono-nums text-muted-foreground w-16 flex-shrink-0">
                                            {log.timestamp}
                                        </span>
                                        <StatusBadge
                                            status={
                                                log.level === "error"
                                                    ? "danger"
                                                    : log.level === "warning"
                                                        ? "warning"
                                                        : "info"
                                            }
                                        >
                                            {log.stage}
                                        </StatusBadge>
                                        <span
                                            className={`text-body ${log.level === "error" ? "text-danger" : ""
                                                }`}
                                        >
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
