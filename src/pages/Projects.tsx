import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FolderKanban,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { projectStore, Project } from "@/services/projectStore";
import { useToast } from "@/hooks/use-toast";

const getStatusBadge = (status: Project["status"]): { label: string; type: StatusType } => {
  switch (status) {
    case "active":
      return { label: "진행중", type: "success" };
    case "completed":
      return { label: "완료", type: "info" };
    case "archived":
      return { label: "보관됨", type: "default" };
    default:
      return { label: "알 수 없음", type: "default" };
  }
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    type: "pdf",
    autoStats: true,
  });

  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectStore.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast({
          title: "프로젝트 로딩 실패",
          description: "프로젝트 목록을 불러오는데 실패했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Create new project
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "프로젝트명을 입력하세요",
        variant: "destructive"
      });
      return;
    }

    try {
      const created = await projectStore.createProject({
        name: newProject.name,
        description: newProject.description,
        status: "active"
      });
      setProjects([created, ...projects]);
      setIsCreateOpen(false);
      setNewProject({ name: "", description: "", type: "pdf", autoStats: true });
      toast({
        title: "프로젝트 생성 완료",
        description: `${created.name} 프로젝트가 생성되었습니다.`
      });
    } catch (error) {
      toast({
        title: "프로젝트 생성 실패",
        variant: "destructive"
      });
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`정말로 "${name}" 프로젝트를 삭제하시겠습니까?`)) return;

    try {
      await projectStore.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: "프로젝트 삭제 완료",
        description: `${name} 프로젝트가 삭제되었습니다.`
      });
    } catch (error) {
      toast({
        title: "프로젝트 삭제 실패",
        variant: "destructive"
      });
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "프로젝트명",
      render: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.name}</span>
          <p className="text-small text-muted-foreground line-clamp-1 mt-0.5">
            {row.description}
          </p>
        </div>
      ),
    },
    { key: "creator", header: "생성자" },
    {
      key: "updatedAt",
      header: "최근 업데이트",
      sortable: true,
      render: (row) => (
        <span className="font-mono-nums text-muted-foreground">{row.updatedAt}</span>
      ),
    },
    {
      key: "jobCount",
      header: "작업 수",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-mono-nums">{row.jobCount}</span>
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
      key: "actions",
      header: "",
      width: "60px",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/upload?project=${row.id}`)}>
              <Upload className="w-4 h-4 mr-2" />
              업로드
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="w-4 h-4 mr-2" />
              편집
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={() => handleDeleteProject(row.id, row.name)}>
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // handleCreateProject is now defined above with async Firestore logic

  return (
    <AppLayout>
      <PageHeader
        title="프로젝트 관리"
        description="설문 프로젝트를 생성하고 관리합니다."
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                프로젝트 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px]">
              <DialogHeader>
                <DialogTitle>새 프로젝트 생성</DialogTitle>
                <DialogDescription>
                  새로운 설문 프로젝트를 생성합니다. 생성 후 바로 설문지를 업로드할 수 있습니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    프로젝트명 <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="예: 2024 고객 만족도 조사"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="프로젝트에 대한 간단한 설명"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">설문 유형</Label>
                  <Select
                    value={newProject.type}
                    onValueChange={(value) =>
                      setNewProject({ ...newProject, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF 기반</SelectItem>
                      <SelectItem value="excel">엑셀 기반</SelectItem>
                      <SelectItem value="mixed">혼합</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>기본 통계 자동 생성</Label>
                    <p className="text-small text-muted-foreground">
                      OCR 완료 후 기본 통계를 자동으로 생성합니다.
                    </p>
                  </div>
                  <Switch
                    checked={newProject.autoStats}
                    onCheckedChange={(checked) =>
                      setNewProject({ ...newProject, autoStats: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                >
                  생성 및 업로드
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="프로젝트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 && !searchQuery ? (
        <div className="empty-state surface-card">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-h3 mb-2">프로젝트가 없습니다</h3>
          <p className="text-body text-muted-foreground mb-4">
            첫 번째 프로젝트를 생성하고 설문지를 업로드하세요.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            프로젝트 생성
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProjects}
          keyField="id"
          onRowClick={(row) => navigate(`/projects/${row.id}`)}
          emptyMessage="검색 결과가 없습니다."
        />
      )}
    </AppLayout>
  );
}
