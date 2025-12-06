import { cn } from "@/lib/utils";
import type { TagTelemetry } from "@/types/telemetry";
import { User, AlertTriangle } from "lucide-react";

interface FirefighterMarkerProps {
  telemetry: TagTelemetry;
  selected?: boolean;
  onClick?: () => void;
  scale?: number;
}

export function FirefighterMarker({ telemetry, selected, onClick, scale = 1 }: FirefighterMarkerProps) {
  const { firefighter, vitals, device } = telemetry;

  const getStatus = () => {
    if (vitals.stationary_duration_s > 30) return "critical";
    if (vitals.heart_rate_bpm > 180 || device.battery_percent < 20) return "warning";
    return "active";
  };

  const status = getStatus();

  const statusColors = {
    active: "border-success bg-success/20 shadow-[0_0_12px_hsl(142_76%_36%/0.4)]",
    warning: "border-warning bg-warning/20 shadow-[0_0_12px_hsl(45_100%_51%/0.4)]",
    critical: "border-destructive bg-destructive/20 shadow-[0_0_12px_hsl(0_72%_51%/0.5)] animate-pulse",
  };

  // Get initials from name
  const initials = firefighter.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all duration-300 -translate-x-1/2 -translate-y-1/2 z-10",
        selected && "z-20"
      )}
      style={{
        left: telemetry.position.x * scale,
        top: telemetry.position.y * scale,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className={cn(
          "firefighter-marker border-2 relative",
          statusColors[status],
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
        )}
      >
        {status === "critical" ? (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        ) : (
          <span className="text-sm font-bold text-foreground">{initials}</span>
        )}

        {/* Floor indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold">{telemetry.position.floor}</span>
        </div>
      </div>

      {/* Name tooltip on hover/select */}
      {selected && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-popover border border-border rounded px-2 py-1 text-xs font-medium shadow-lg">
          {firefighter.name}
          <span className="text-muted-foreground ml-1">({firefighter.role})</span>
        </div>
      )}
    </div>
  );
}
