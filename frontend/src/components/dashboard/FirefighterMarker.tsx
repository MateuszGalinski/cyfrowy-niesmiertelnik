import { cn } from "@/lib/utils";
import type { TagTelemetry } from "@/types/telemetry";
import { User, AlertTriangle, Heart } from "lucide-react";
import type { CSSProperties } from "react";

interface FirefighterMarkerProps {
  telemetry: TagTelemetry;
  selected?: boolean;
  onClick?: () => void;
  scale?: number;
  style?: CSSProperties; // opcjonalne nadpisanie pozycji
}

export function FirefighterMarker({
  telemetry,
  selected = false,
  onClick,
  scale = 12,
  style,
}: FirefighterMarkerProps) {
  const { firefighter, position, vitals, device } = telemetry;

  // Określ status strażaka
  const isStationary = vitals.stationary_duration_s > 20;
  const isManDown = vitals.stationary_duration_s >= 30;
  const isSOS = device.sos_button_pressed;
  const isHighHR = vitals.heart_rate_bpm > 160;
  const isLowBattery = device.battery_percent < 20;

  const hasAlert = isManDown || isSOS;
  const hasWarning = isStationary || isHighHR || isLowBattery;

  // Kolor markera
  const getMarkerColor = () => {
    if (hasAlert) return "bg-destructive border-destructive text-destructive-foreground";
    if (hasWarning) return "bg-warning border-warning text-warning-foreground";
    return "bg-primary border-primary text-primary-foreground";
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  // Domyślna pozycja bazowana na position, może być nadpisana przez style
  const defaultStyle: CSSProperties = {
    left: position.x * scale,
    top: position.y * scale,
  };

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 z-20",
        onClick && "cursor-pointer"
      )}
      style={{ ...defaultStyle, ...style }}
      onClick={handleClick}
    >
      {/* Selection ring */}
      {selected && (
        <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border-2 border-primary animate-pulse" />
      )}

      {/* Alert pulse */}
      {hasAlert && (
        <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-destructive/30 animate-ping" />
      )}

      {/* Main marker */}
      <div
        className={cn(
          "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
          getMarkerColor(),
          selected && "ring-2 ring-offset-2 ring-offset-background ring-white scale-110"
        )}
      >
        {hasAlert ? (
          <AlertTriangle className="w-4 h-4" />
        ) : isHighHR ? (
          <Heart className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Name label */}
      <div
        className={cn(
          "absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-background/90 text-foreground border border-border"
        )}
      >
        {firefighter.name.split(" ")[0]}
      </div>

      {/* HR indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-background border border-border rounded px-1 text-[9px] font-mono">
          {vitals.heart_rate_bpm}
        </div>
      )}
    </div>
  );
}