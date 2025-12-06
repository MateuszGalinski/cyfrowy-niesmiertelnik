import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "ok" | "warning" | "critical" | "offline";
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const statusColors = {
    ok: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    offline: "bg-muted text-muted-foreground border-border",
  };

  const dotColors = {
    ok: "bg-success",
    warning: "bg-warning",
    critical: "bg-destructive animate-pulse",
    offline: "bg-muted-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
        statusColors[status],
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[status])} />}
      {label && <span>{label}</span>}
    </div>
  );
}
