import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  onClick,
  className,
}: KpiCardProps) {
  const formatNumber = (num: string | number) => {
    if (typeof num === "number") {
      return num.toLocaleString("ko-KR");
    }
    return num;
  };

  const getTrendIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case "increase":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "decrease":
        return <TrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (!change) return "";
    switch (change.type) {
      case "increase":
        return "text-success";
      case "decrease":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "kpi-card",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-small text-muted-foreground">{label}</span>
        {Icon && (
          <div className="w-10 h-10 rounded-md bg-primary-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-h1 font-mono-nums">{formatNumber(value)}</span>
        {change && (
          <div className={cn("flex items-center gap-1 text-small", getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
