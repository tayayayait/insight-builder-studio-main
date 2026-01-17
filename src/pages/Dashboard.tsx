import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Loader2,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobStore, JobData } from "@/services/jobStore";

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  time: string;
  action?: string;
}


// Helper to generate dynamic alerts from jobs
const generateAlerts = (jobs: JobData[]): Alert[] => {
  const alerts: Alert[] = [];

  // 1. Check for failed jobs
  const failedJobs = jobs.filter(j => j.status === 'error');
  failedJobs.slice(0, 3).forEach(job => {
    alerts.push({
      id: `err-${job.id}`,
      type: "error",
      message: `배치 '${job.name}' 처리 중 오류 발생`,
      time: new Date(job.createdAt).toLocaleDateString(),
      action: "확인"
    });
  });

  // 2. Check for recent uploads (Info)
  const recentUploads = jobs.filter(j => j.status === 'processing');
  recentUploads.slice(0, 3).forEach(job => {
    alerts.push({
      id: `proc-${job.id}`,
      type: "info", // Changed from warning to info for normal processing
      message: `신규 배치 '${job.name}' 처리 중`,
      time: "방금 전",
      action: "상세보기"
    });
  });

  // If no alerts, show a placeholder
  if (alerts.length === 0) {
    alerts.push({
      id: "default-ok",
      type: "info",
      message: "현재 주의가 필요한 항목이 없습니다.",
      time: "지금",
    });
  }

  return alerts;
};

const getStatusBadge = (status: JobData["status"]): { label: string; type: StatusType } => {
  switch (status) {
    case "completed":
      return { label: "완료", type: "success" };
    case "processing":
      return { label: "진행중", type: "primary" };
    case "error":
      return { label: "오류", type: "danger" };
    default:
      return { label: "대기", type: "info" };
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayUploads: 0,
    processing: 0,
    errors: 0,
    totalReports: 0,
    recentJobs: [] as JobData[]
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await jobStore.getDashboardStats();
        setStats(data);
        setAlerts(generateAlerts(data.recentJobs));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const columns: Column<JobData>[] = [
    {
      key: "name",
      header: "배치명",
      render: (row) => (
        <div>
          <span className="font-medium text-body block">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.id}</span>
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
      key: "totalFiles",
      header: "파일 수",
      width: "100px",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.totalFiles}건</span>
        </div>
      )
    },
    {
      key: "createdAt",
      header: "생성일",
      render: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "60px",
      align: "center",
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/jobs/${row.id}`)}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-foreground">대시보드</h1>
          <p className="text-body text-muted-foreground">
            AI OCR 설문지 인식 및 통계 분석 현황
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="오늘 업로드"
            value={stats.todayUploads}
            icon={Upload}
            // Removed fake 'change' data to reflect reality
            onClick={() => navigate("/upload")}
          />
          <KpiCard
            label="처리중 배치"
            value={stats.processing}
            icon={Loader2}
            onClick={() => navigate("/jobs")}
          />
          <KpiCard
            label="오류 항목"
            value={stats.errors}
            icon={AlertTriangle}
            onClick={() => navigate("/validation/queue")} // Assuming queue is where errors are handled? Or just jobs
          />
          <KpiCard
            label="완료된 리포트"
            value={stats.totalReports}
            icon={FileText}
            onClick={() => navigate("/reports")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Jobs */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-h3">최근 작업</CardTitle>
                <Button variant="ghost" className="text-sm" onClick={() => navigate('/jobs')}>
                  전체보기 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    데이터를 불러오는 중...
                  </div>
                ) : stats.recentJobs.length > 0 ? (
                  <DataTable
                    data={stats.recentJobs}
                    columns={columns}
                    keyField="id"
                    loading={loading}
                    onRowClick={(row) => navigate(`/jobs/${row.id}`)}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    최근 작업이 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">알림</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center">로딩 중...</p>
                  ) : alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex gap-3 p-3 rounded-lg bg-surface-ground border border-border"
                    >
                      <div className="shrink-0 mt-0.5">
                        {alert.type === "error" ? (
                          <AlertTriangle className="w-5 h-5 text-danger" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-accent-blue" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {alert.time}
                          </span>
                          {alert.action && (
                            <button
                              className="text-xs font-medium text-primary hover:underline"
                              onClick={() => {
                                const jobId = alert.id.split('-')[1];
                                if (jobId) navigate(`/jobs/${jobId}`);
                              }}
                            >
                              {alert.action}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
