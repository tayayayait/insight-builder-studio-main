import { cn } from "@/lib/utils";

export type StatusType = "success" | "warning" | "danger" | "info" | "primary" | "default";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-success-50 text-success border-transparent",
  warning: "bg-warning-50 text-warning border-transparent",
  danger: "bg-danger-50 text-danger border-transparent",
  info: "bg-info-50 text-info border-transparent",
  primary: "bg-primary-50 text-primary border-transparent",
  default: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-small font-medium border",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}
