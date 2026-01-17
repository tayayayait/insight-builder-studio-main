import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FilterBar, FilterChip, FilterOption } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { jobStore, JobData } from "@/services/jobStore";

interface JobView extends JobData {
    // Add additional view-specific properties if needed, or just use JobData
    // For now we map JobData to what UI needs
    batchName: string;
    projectName: string;
    fileCount: number;
    pageCount: number;
    failedCount: number;
}





const STATUS_OPTIONS: FilterOption[] = [
    { value: "all", label: "전체 상태" },
    { value: "pending", label: "대기중" },
    { value: "processing", label: "진행중" },
    { value: "completed", label: "완료" },
    { value: "error", label: "오류" },
];

const getStatusBadge = (status: string): { label: string; type: StatusType; icon: React.ReactNode } => {
    switch (status) {
        case "completed":
            return { label: "완료", type: "success", icon: <CheckCircle2 className="w-4 h-4" /> };
        case "processing":
            return { label: "진행중", type: "primary", icon: <Play className="w-4 h-4" /> };
        case "error":
            return { label: "오류", type: "danger", icon: <AlertCircle className="w-4 h-4" /> };
        case "pending":
        default:
            return { label: "대기중", type: "default", icon: <Clock className="w-4 h-4" /> };
    }
};

export default function Jobs() {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [jobs, setJobs] = useState<JobView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const data = await jobStore.getJobs();
                const mappedJobs: JobView[] = data.map(job => ({
                    ...job,
                    batchName: job.name,
                    projectName: "연간 고객 만족도", // Example fixed project name or store project name in JobData
                    fileCount: job.totalFiles,
                    pageCount: job.pages?.length || 0,
                    failedCount: job.pages?.filter(p => p.status === "error").length || 0,
                    // Format Date nicely
                    formattedDate: new Date(job.createdAt).toLocaleString()
                }));
                setJobs(mappedJobs);
            } catch (error) {
                console.error("Failed to load jobs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            // Search filter
            if (searchValue) {
                const query = searchValue.toLowerCase();
                if (
                    !job.batchName.toLowerCase().includes(query) &&
                    !job.projectName.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== "all" && job.status !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [searchValue, statusFilter, jobs]);

    const filterChips: FilterChip[] = useMemo(() => {
        const chips: FilterChip[] = [];

        if (statusFilter !== "all") {
            const option = STATUS_OPTIONS.find((o) => o.value === statusFilter);
            if (option) {
                chips.push({ id: "status", label: "상태", value: option.label });
            }
        }

        if (dateRange?.from) {
            chips.push({
                id: "date",
                label: "기간",
                value: dateRange.to
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : dateRange.from.toLocaleDateString(),
            });
        }

        return chips;
    }, [statusFilter, dateRange]);

    const handleChipRemove = (id: string) => {
        if (id === "status") setStatusFilter("all");
        if (id === "date") setDateRange(undefined);
    };

    const columns: Column<JobView>[] = [
        {
            key: "batchName",
            header: "배치명",
            render: (row) => (
                <div>
                    <span className="font-medium text-foreground">{row.batchName}</span>
                    <p className="text-small text-muted-foreground mt-0.5">{row.projectName}</p>
                </div>
            ),
        },
        {
            key: "fileCount",
            header: "파일 수",
            align: "right",
            render: (row) => <span className="font-mono-nums">{row.fileCount}</span>,
        },
        {
            key: "pageCount",
            header: "페이지 수",
            align: "right",
            render: (row) => <span className="font-mono-nums">{row.pageCount}</span>,
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
            key: "failedCount",
            header: "실패",
            align: "right",
            render: (row) => (
                <span
                    className={`font-mono-nums ${row.failedCount > 0 ? "text-danger" : "text-muted-foreground"
                        }`}
                >
                    {row.failedCount}
                </span>
            ),
        },
        {
            key: "createdAt",
            header: "생성일",
            render: (row) => (
                <span className="text-muted-foreground font-mono-nums">
                    {new Date(row.createdAt).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="작업 현황"
                description="OCR 처리 및 분석 작업 현황을 확인합니다."
                actions={
                    <Button onClick={() => navigate("/upload")}>
                        <FileText className="w-4 h-4 mr-2" />
                        새 업로드
                    </Button>
                }
            />

            <FilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="배치명 또는 프로젝트명 검색..."
                statusOptions={STATUS_OPTIONS}
                statusValue={statusFilter}
                onStatusChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                chips={filterChips}
                onChipRemove={handleChipRemove}
                className="mb-4"
            />

            {filteredJobs.length === 0 ? (
                <EmptyState
                    type="search"
                    title="작업이 없습니다"
                    description={searchValue || statusFilter !== "all"
                        ? "검색 조건에 맞는 작업이 없습니다."
                        : "아직 업로드된 배치가 없습니다. 설문지를 업로드하여 OCR 처리를 시작하세요."
                    }
                    actionLabel="업로드하기"
                    onAction={() => navigate("/upload")}
                />
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredJobs}
                    keyField="id"
                    onRowClick={(row) => navigate(`/jobs/${row.id}`)}
                />
            )}
        </AppLayout>
    );
}
