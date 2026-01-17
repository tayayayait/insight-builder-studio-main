import { useState, useMemo } from "react";
import { Search, Filter, Download, User, FileText, Settings, Shield, Clock } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type ActionType = "login" | "create" | "update" | "delete" | "export" | "settings";

interface LogEntry {
    id: string;
    userId: string;
    userName: string;
    action: ActionType;
    target: string;
    timestamp: string;
    ip: string;
}

// Logs will be loaded from a logging service (Phase 5)
// For now, show empty state until logging is implemented
const MOCK_LOGS: LogEntry[] = [];

const ACTION_CONFIG: Record<ActionType, { label: string; type: StatusType; icon: typeof User }> = {
    login: { label: "로그인", type: "info", icon: User },
    create: { label: "생성", type: "success", icon: FileText },
    update: { label: "수정", type: "primary", icon: FileText },
    delete: { label: "삭제", type: "danger", icon: FileText },
    export: { label: "내보내기", type: "default", icon: Download },
    settings: { label: "설정", type: "warning", icon: Settings },
};

export default function AdminLogs() {
    const [searchValue, setSearchValue] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (searchValue) {
                const query = searchValue.toLowerCase();
                if (!log.userName.toLowerCase().includes(query) && !log.target.toLowerCase().includes(query)) {
                    return false;
                }
            }
            if (actionFilter !== "all" && log.action !== actionFilter) {
                return false;
            }
            return true;
        });
    }, [logs, searchValue, actionFilter]);

    const columns: Column<LogEntry>[] = [
        {
            key: "timestamp",
            header: "시간",
            width: "160px",
            render: (row) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono-nums text-sm">{row.timestamp}</span>
                </div>
            ),
        },
        {
            key: "userName",
            header: "사용자",
            width: "120px",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                    </div>
                    <span>{row.userName}</span>
                </div>
            ),
        },
        {
            key: "action",
            header: "행동",
            width: "100px",
            render: (row) => {
                const config = ACTION_CONFIG[row.action];
                return <StatusBadge status={config.type}>{config.label}</StatusBadge>;
            },
        },
        {
            key: "target",
            header: "대상",
            render: (row) => <span className="text-foreground">{row.target}</span>,
        },
        {
            key: "ip",
            header: "IP",
            width: "130px",
            align: "right",
            render: (row) => (
                <span className="font-mono-nums text-muted-foreground text-sm">{row.ip}</span>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="감사 로그"
                description="시스템 활동 기록을 확인합니다."
                actions={
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        로그 내보내기
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-card border rounded-[var(--radius-md)]">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="사용자 또는 대상 검색..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="행동 유형" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="login">로그인</SelectItem>
                        <SelectItem value="create">생성</SelectItem>
                        <SelectItem value="update">수정</SelectItem>
                        <SelectItem value="delete">삭제</SelectItem>
                        <SelectItem value="export">내보내기</SelectItem>
                        <SelectItem value="settings">설정</SelectItem>
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    `${format(dateRange.from, "yyyy.MM.dd", { locale: ko })} - ${format(dateRange.to, "yyyy.MM.dd", { locale: ko })}`
                                ) : (
                                    format(dateRange.from, "yyyy.MM.dd", { locale: ko })
                                )
                            ) : (
                                "기간 선택"
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={ko}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <DataTable columns={columns} data={filteredLogs} keyField="id" />
        </AppLayout>
    );
}
