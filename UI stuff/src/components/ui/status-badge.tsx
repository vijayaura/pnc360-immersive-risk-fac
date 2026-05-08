import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; style: string }> = {
  pending: { icon: Clock, style: "bg-status-pending/10 text-status-pending border-status-pending/25" },
  approved: { icon: CheckCircle2, style: "bg-status-approved/10 text-status-approved border-status-approved/25" },
  referred: { icon: AlertTriangle, style: "bg-status-referred/10 text-status-referred border-status-referred/25" },
  rejected: { icon: XCircle, style: "bg-status-rejected/10 text-status-rejected border-status-rejected/25" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const sizeClasses = size === "sm"
    ? "text-[10px] px-2 py-0.5 gap-1"
    : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span className={`inline-flex items-center rounded-full font-semibold capitalize border ${sizeClasses} ${config.style}`}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {status}
    </span>
  );
}
