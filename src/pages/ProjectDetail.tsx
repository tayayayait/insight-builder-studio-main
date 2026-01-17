import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  FolderKanban,
  RefreshCw,
  Upload,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { projectStore, Project } from "@/services/projectStore";

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

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setProject(null);
      return;
    }
    const fetchProject = async () => {
      setLoading(true);
      try {
        const data = await projectStore.getProject(id);
        setProject(data ?? null);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const statusBadge = useMemo(
    () => (project ? getStatusBadge(project.status) : null),
    [project]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">프로젝트를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">
          요청하신 프로젝트 ID({id ?? "-"})에 해당하는 정보를 찾을 수 없습니다.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            홈으로 이동
          </Button>
          <Button onClick={() => navigate("/projects")}>프로젝트 목록</Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/projects")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        프로젝트 목록으로
      </Button>

      <PageHeader
        title={project.name}
        description={project.description || "설명이 없습니다."}
        breadcrumbs={[
          { label: "프로젝트 관리", href: "/projects" },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/upload?project=${project.id}`)}
            >
              <Upload className="w-4 h-4 mr-2" />
              업로드
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="작업 수" value={project.jobCount} icon={FolderKanban} />
        <KpiCard label="총 파일" value={project.totalFiles} icon={FolderKanban} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-h3">프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-body">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">상태</span>
            {statusBadge ? (
              <StatusBadge status={statusBadge.type}>{statusBadge.label}</StatusBadge>
            ) : (
              <span>-</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">프로젝트 ID</span>
            <span className="font-mono text-sm">{project.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">생성일</span>
            <span className="font-mono-nums">{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">최근 업데이트</span>
            <span className="font-mono-nums">{formatDate(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
