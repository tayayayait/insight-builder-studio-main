import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { jobStore } from "@/services/jobStore";

interface QueueItem {
    id: string;
    jobId: string;
    jobName: string;
    pageNumber: number;
    fieldName: string;
    extractedValue: string;
    confidence: number;
    status: "warning" | "error" | "pending";
}

export default function ValidationQueue() {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch validation queue items from jobs with warning/error fields
    useEffect(() => {
        const fetchQueueItems = async () => {
            try {
                const jobs = await jobStore.getJobs();
                const items: QueueItem[] = [];

                for (const job of jobs) {
                    if (job.results) {
                        for (const [pageId, pageData] of Object.entries(job.results)) {
                            const page = job.pages.find(p => p.id === pageId);
                            if (pageData.fields) {
                                for (const field of pageData.fields) {
                                    if (field.confidence < 0.85 || field.status !== "valid") {
                                        items.push({
                                            id: `${job.id}_${pageId}_${field.id}`,
                                            jobId: job.id,
                                            jobName: job.name,
                                            pageNumber: page?.pageNumber || 0,
                                            fieldName: field.label,
                                            extractedValue: String(field.value),
                                            confidence: field.confidence,
                                            status: field.status === "error" ? "error" : field.confidence < 0.7 ? "error" : "warning"
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                setQueueItems(items);
            } catch (error) {
                console.error("Failed to fetch queue items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueueItems();
    }, []);

    const filteredData = queueItems.filter((item) => {
        if (filterStatus !== "all" && item.status !== filterStatus) return false;
        if (searchValue && !item.jobName.toLowerCase().includes(searchValue.toLowerCase())) return false;
        return true;
    });

    const columns: Column<QueueItem>[] = [
        {
            key: "status",
            header: "상태",
            width: "100px",
            render: (row) => {
                let type: StatusType = "default";
                if (row.status === "error") type = "danger";
                if (row.status === "warning") type = "warning";
                return <StatusBadge status={type}>{row.status}</StatusBadge>;
            },
        },
        {
            key: "jobName",
            header: "작업/문항",
            render: (row) => (
                <div>
                    <div className="font-medium">{row.jobName}</div>
                    <div className="text-small text-muted-foreground">
                        p.{row.pageNumber} · {row.fieldName}
                    </div>
                </div>
            ),
        },
        {
            key: "extractedValue",
            header: "추출 값",
            render: (row) => (
                <span className="font-medium text-foreground">{row.extractedValue}</span>
            ),
        },
        {
            key: "confidence",
            header: "신뢰도",
            width: "100px",
            align: "right",
            render: (row) => (
                <span className={`font-mono-nums ${row.confidence < 0.7 ? "text-danger" : "text-warning"}`}>
                    {(row.confidence * 100).toFixed(0)}%
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            width: "100px",
            render: (row) => (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/validation/${row.jobId}`)}
                >
                    검수하기
                </Button>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="미확정 항목"
                description="신뢰도가 낮거나 확인이 필요한 OCR 결과를 검수합니다."
                actions={
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        뒤로
                    </Button>
                }
            />

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="작업명 검색..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="error">오류</SelectItem>
                        <SelectItem value="warning">주의</SelectItem>
                        <SelectItem value="pending">대기</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                    미확정 항목을 불러오는 중...
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-16">
                    <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                    <h3 className="text-h3 font-semibold">미확정 항목이 없습니다</h3>
                    <p className="text-muted-foreground mt-2">
                        모든 항목이 확정되었거나 검토가 필요한 항목이 없습니다.
                    </p>
                </div>
            ) : (
                <DataTable columns={columns} data={filteredData} keyField="id" />
            )}
        </AppLayout>
    );
}
