import { cn } from "@/lib/utils";
import type { Beacon } from "@/types/telemetry";
import { Radio } from "lucide-react";

interface BeaconMarkerProps {
  beacon: Beacon;
  scale?: number;
  showLabel?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function BeaconMarker({ 
  beacon, 
  scale = 1, 
  showLabel = false,
  selected = false,
  onClick,
}: BeaconMarkerProps) {
  const statusColors = {
    active: "bg-primary/20 border-primary text-primary",
    inactive: "bg-warning/20 border-warning text-warning",
    offline: "bg-muted border-border text-muted-foreground",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 z-0",
        onClick && "cursor-pointer"
      )}
      style={{
        left: beacon.position.x * scale,
        top: beacon.position.y * scale,
      }}
      onClick={handleClick}
    >
      {/* Range indicator - większy gdy wybrany */}
      {beacon.status === "active" && (
        <div 
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border transition-all duration-300",
            selected 
              ? "w-[180px] h-[180px] border-primary/40 bg-primary/10" 
              : "w-[120px] h-[120px] border-primary/20 bg-primary/5"
          )} 
        />
      )}

      {/* Selection ring */}
      {selected && (
        <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-lg border-2 border-primary animate-pulse" />
      )}

      <div
        className={cn(
          "relative w-6 h-6 rounded-md border flex items-center justify-center transition-all",
          statusColors[beacon.status],
          beacon.status === "active" && "beacon-pulse",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
          onClick && "hover:scale-110"
        )}
      >
        <Radio className="w-3 h-3" />
      </div>

      {/* Tags count badge */}
      {beacon.tags_in_range && beacon.tags_in_range.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
          {beacon.tags_in_range.length}
        </div>
      )}

      {(showLabel || selected) && (
        <div className={cn(
          "absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded",
          selected 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground"
        )}>
          {beacon.name}
        </div>
      )}
    </div>
  );
}
