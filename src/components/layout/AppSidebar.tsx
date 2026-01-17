import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  ListChecks,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileSearch,
  AlertCircle,
  ClipboardList,
  Users,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  {
    label: "대시보드",
    path: "/",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "프로젝트 관리",
    path: "/projects",
    icon: <FolderKanban className="w-5 h-5" />,
  },
  {
    label: "데이터 수집",
    path: "/upload",
    icon: <Upload className="w-5 h-5" />,
    children: [
      { label: "업로드/가져오기", path: "/upload" },
      { label: "작업 현황", path: "/jobs" },
    ],
  },
  {
    label: "데이터 검수",
    path: "/validation",
    icon: <ListChecks className="w-5 h-5" />,
    children: [
      { label: "OCR 검수", path: "/validation" },
      { label: "미확정 항목", path: "/validation/queue" },
    ],
  },
  {
    label: "통계 분석",
    path: "/analysis",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "리포트",
    path: "/reports",
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: "리포트 목록", path: "/reports" },
      { label: "새 리포트 생성", path: "/reports/create" },
    ],
  },
];

const adminItems: NavItem[] = [
  {
    label: "관리자",
    path: "/admin",
    icon: <Settings className="w-5 h-5" />,
    children: [
      { label: "사용자/권한", path: "/admin/users" },
      { label: "감사 로그", path: "/admin/logs" },
      { label: "시스템 설정", path: "/admin/settings" },
    ],
  },
];

interface SidebarContentProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

function SidebarContent({ collapsed, onItemClick }: SidebarContentProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname === child.path) ||
    location.pathname === item.path;

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path) || isParentActive(item);

    if (collapsed) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={cn(
            "flex items-center justify-center p-3 rounded-sm transition-colors",
            isParentActive(item)
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
          title={item.label}
        >
          {item.icon}
        </NavLink>
      );
    }

    return (
      <div key={item.path}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpanded(item.path)}
              className={cn(
                "sidebar-item w-full justify-between",
                isParentActive(item) && "sidebar-item-active"
              )}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </span>
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
            {isExpanded && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    onClick={onItemClick}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-sm transition-colors",
                      isActive(child.path)
                        ? "text-sidebar-primary font-medium bg-sidebar-accent"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            onClick={onItemClick}
            className={cn(
              "sidebar-item",
              isActive(item.path) && "sidebar-item-active"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <FileSearch className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-h3 text-foreground">SurveyOCR</h1>
            <p className="text-small text-muted-foreground">AI 설문 분석</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Admin Section */}
      <div className="border-t border-sidebar-border py-4 px-3 space-y-1">
        {adminItems.map(renderNavItem)}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
          collapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded"
        )}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <FileSearch className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-h3">SurveyOCR</span>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent
              collapsed={false}
              onItemClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
