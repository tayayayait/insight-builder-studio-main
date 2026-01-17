import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, CheckCircle2, Play, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobStore, JobData } from "@/services/jobStore";

interface ValidationJobRow extends JobData {
    batchName: string;
    pageCount: number;
    errorCount: number;
}

const getStatusBadge = (status: JobData["status"]): { label: string; type: StatusType; icon: React.ReactNode } => {
    switch (status) {
        case "completed":
            return { label: "완료", type: "success", icon: <CheckCircle2 className="w-4 h-4" /> };
        case "processing":
            return { label: "진행중", type: "primary", icon: <Play className="w-4 h-4" /> };
        case "error":
            return { label: "오류", type: "danger", icon: <AlertCircle className="w-4 h-4" /> };
        default:
            return { label: "대기중", type: "default", icon: <Clock className="w-4 h-4" /> };
    }
};

export default function ValidationHome() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<ValidationJobRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const data = await jobStore.getJobs();
                const mapped = data.map(job => ({
                    ...job,
                    batchName: job.name,
                    pageCount: job.pages?.length || 0,
                    errorCount: job.pages?.filter(p => p.status === "error").length || 0,
                }));
                setJobs(mapped);
            } catch (error) {
                console.error("Failed to load jobs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        if (!searchValue) return jobs;
        const query = searchValue.toLowerCase();
        return jobs.filter(job => job.batchName.toLowerCase().includes(query));
    }, [jobs, searchValue]);

    const columns: Column<ValidationJobRow>[] = [
        {
            key: "batchName",
            header: "배치명",
            render: (row) => (
                <div>
                    <span className="font-medium text-foreground">{row.batchName}</span>
                    <p className="text-small text-muted-foreground mt-0.5">
                        {new Date(row.createdAt).toLocaleString()}
                    </p>
                </div>
            ),
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
            key: "pageCount",
            header: "페이지",
            align: "right",
            render: (row) => <span className="font-mono-nums">{row.pageCount}</span>,
        },
        {
            key: "progress",
            header: "진행률",
            width: "140px",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <ProgressBar
                        value={row.progress}
                        size="sm"
                        variant={row.status === "error" ? "danger" : "default"}
                    />
                    <span className="text-small font-mono-nums w-10 text-right">
                        {row.progress}%
                    </span>
                </div>
            ),
        },
        {
            key: "errorCount",
            header: "오류",
            align: "right",
            render: (row) => (
                <span className={`font-mono-nums ${row.errorCount > 0 ? "text-danger" : "text-muted-foreground"}`}>
                    {row.errorCount}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            width: "120px",
            render: (row) => (
                <Button
                    size="sm"
                    onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/validation/${row.id}`);
                    }}
                >
                    검수하기
                </Button>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="OCR 검수"
                description="검수할 배치를 선택해주세요."
                actions={
                    <Button onClick={() => navigate("/upload")}>
                        <FileText className="w-4 h-4 mr-2" />
                        새 업로드
                    </Button>
                }
            />

            <div className="mb-4 max-w-sm">
                <Input
                    placeholder="배치명 검색..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">작업을 불러오는 중...</div>
            ) : filteredJobs.length === 0 ? (
                <EmptyState
                    type="analysis"
                    title="검수할 배치가 없습니다"
                    description="새 설문지를 업로드하면 OCR 검수를 진행할 수 있습니다."
                    actionLabel="업로드하기"
                    onAction={() => navigate("/upload")}
                />
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredJobs}
                    keyField="id"
                    onRowClick={(row) => navigate(`/validation/${row.id}`)}
                />
            )}
        </AppLayout>
    );
}
