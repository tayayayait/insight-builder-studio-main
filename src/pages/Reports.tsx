import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Trash2, Eye, FileText, MoreVertical } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { FilterBar, FilterOption } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { reportStore, Report } from "@/services/reportStore";

const FORMAT_LABELS: Record<string, string> = {
    pdf: "PDF",
    pptx: "PowerPoint",
    xlsx: "Excel",
};

const STATUS_OPTIONS: FilterOption[] = [
    { value: "all", label: "전체" },
    { value: "pdf", label: "PDF" },
    { value: "pptx", label: "PowerPoint" },
    { value: "xlsx", label: "Excel" },
];

export default function Reports() {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");
    const [formatFilter, setFormatFilter] = useState("all");
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch reports from Firestore
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await reportStore.getReports();
                setReports(data);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            if (searchValue && !report.title.toLowerCase().includes(searchValue.toLowerCase())) {
                return false;
            }
            if (formatFilter !== "all" && report.format !== formatFilter) {
                return false;
            }
            return true;
        });
    }, [reports, searchValue, formatFilter]);

    const handleDownload = (report: Report) => {
        toast({
            title: "다운로드 시작",
            description: `${report.title}.${report.format}`,
        });
    };

    const handleDelete = (report: Report) => {
        toast({
            title: "리포트 삭제됨",
            description: report.title,
            variant: "destructive",
        });
    };

    const columns: Column<Report>[] = [
        {
            key: "title",
            header: "리포트명",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="font-medium text-foreground">{row.title}</span>
                        <p className="text-small text-muted-foreground mt-0.5">
                            {row.projectName}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: "format",
            header: "형식",
            width: "100px",
            render: (row) => (
                <span className="px-2 py-0.5 bg-muted rounded text-small font-medium">
                    {FORMAT_LABELS[row.format]}
                </span>
            ),
        },
        {
            key: "fileSize",
            header: "크기",
            width: "100px",
            align: "right",
            render: (row) => (
                <span className="font-mono-nums text-muted-foreground">{row.fileSize}</span>
            ),
        },
        {
            key: "createdAt",
            header: "생성일",
            width: "150px",
            render: (row) => (
                <span className="text-muted-foreground font-mono-nums">{row.createdAt}</span>
            ),
        },
        {
            key: "actions",
            header: "",
            width: "100px",
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(row)}>
                            <Download className="w-4 h-4 mr-2" />
                            다운로드
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            미리보기
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-danger focus:text-danger"
                            onClick={() => handleDelete(row)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="리포트"
                description="생성된 분석 리포트를 관리합니다."
                actions={
                    <Button onClick={() => navigate("/reports/create")}>
                        <Plus className="w-4 h-4 mr-2" />
                        새 리포트
                    </Button>
                }
            />

            <FilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="리포트 제목 검색..."
                statusOptions={STATUS_OPTIONS}
                statusValue={formatFilter}
                onStatusChange={setFormatFilter}
                className="mb-4"
            />

            {filteredReports.length === 0 ? (
                <EmptyState
                    type="search"
                    title="리포트가 없습니다"
                    description={
                        searchValue || formatFilter !== "all"
                            ? "검색 조건에 맞는 리포트가 없습니다."
                            : "아직 생성된 리포트가 없습니다. 분석 결과를 바탕으로 리포트를 생성하세요."
                    }
                    actionLabel="리포트 생성"
                    onAction={() => navigate("/reports/create")}
                />
            ) : (
                <DataTable columns={columns} data={filteredReports} keyField="id" />
            )}
        </AppLayout>
    );
}
