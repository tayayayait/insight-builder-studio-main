import { useState, useMemo } from "react";
import {
    UserPlus,
    MoreVertical,
    Shield,
    ShieldCheck,
    ShieldAlert,
    User,
    Mail,
    Ban,
    CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

type UserRole = "admin" | "manager" | "reviewer" | "viewer";
type UserStatus = "active" | "inactive" | "pending";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: string;
}

// Users will be loaded from Firebase Auth (Phase 5)
// For now, show empty state until Firebase Auth is implemented
const MOCK_USERS: AdminUser[] = [];

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof Shield }> = {
    admin: { label: "관리자", icon: ShieldAlert },
    manager: { label: "매니저", icon: ShieldCheck },
    reviewer: { label: "검수자", icon: Shield },
    viewer: { label: "열람자", icon: User },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; type: StatusType }> = {
    active: { label: "활성", type: "success" },
    inactive: { label: "비활성", type: "default" },
    pending: { label: "대기중", type: "warning" },
};

export default function AdminUsers() {
    const [searchValue, setSearchValue] = useState("");
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
    const [users, setUsers] = useState<AdminUser[]>([]);

    const filteredUsers = useMemo(() => {
        if (!searchValue) return users;
        const query = searchValue.toLowerCase();
        return users.filter(
            (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
        );
    }, [searchValue, users]);

    const handleInvite = () => {
        if (!inviteEmail) return;
        toast({
            title: "초대 메일 전송",
            description: `${inviteEmail}로 초대 메일이 발송되었습니다.`,
        });
        setInviteModalOpen(false);
        setInviteEmail("");
    };

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        toast({
            title: "역할 변경 완료",
            description: `사용자 역할이 ${ROLE_CONFIG[newRole].label}(으)로 변경되었습니다.`,
        });
    };

    const handleDeactivate = (user: AdminUser) => {
        toast({
            title: user.status === "active" ? "사용자 비활성화" : "사용자 활성화",
            description: `${user.name}님의 계정 상태가 변경되었습니다.`,
        });
    };

    const columns: Column<AdminUser>[] = [
        {
            key: "name",
            header: "사용자",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <span className="font-medium text-foreground">{row.name}</span>
                        <p className="text-small text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {row.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: "role",
            header: "역할",
            width: "120px",
            render: (row) => {
                const config = ROLE_CONFIG[row.role];
                const Icon = config.icon;
                return (
                    <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{config.label}</span>
                    </div>
                );
            },
        },
        {
            key: "status",
            header: "상태",
            width: "100px",
            render: (row) => {
                const config = STATUS_CONFIG[row.status];
                return <StatusBadge status={config.type}>{config.label}</StatusBadge>;
            },
        },
        {
            key: "lastLogin",
            header: "최근 로그인",
            width: "150px",
            render: (row) => (
                <span className="text-muted-foreground font-mono-nums">{row.lastLogin}</span>
            ),
        },
        {
            key: "actions",
            header: "",
            width: "60px",
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(row.id, "manager")}>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            매니저로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(row.id, "reviewer")}>
                            <Shield className="w-4 h-4 mr-2" />
                            검수자로 변경
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className={row.status === "active" ? "text-danger" : "text-success"}
                            onClick={() => handleDeactivate(row)}
                        >
                            {row.status === "active" ? (
                                <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    비활성화
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    활성화
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout>
            <PageHeader
                title="사용자 관리"
                description="시스템 사용자 및 권한을 관리합니다."
                actions={
                    <Button onClick={() => setInviteModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        사용자 초대
                    </Button>
                }
            />

            <div className="mb-4">
                <Input
                    placeholder="이름 또는 이메일로 검색..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <DataTable columns={columns} data={filteredUsers} keyField="id" />

            {/* Invite Modal */}
            <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>사용자 초대</DialogTitle>
                        <DialogDescription>
                            이메일 주소로 새 사용자를 초대합니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>이메일</Label>
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>역할</Label>
                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">열람자</SelectItem>
                                    <SelectItem value="reviewer">검수자</SelectItem>
                                    <SelectItem value="manager">매니저</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                            취소
                        </Button>
                        <Button onClick={handleInvite} disabled={!inviteEmail}>
                            초대 메일 발송
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
