import { cn } from "@/lib/utils";
import type { Beacon } from "@/types/telemetry";
import { Radio } from "lucide-react";

interface BeaconMarkerProps {
  beacon: Beacon;
  scale?: number;
  showLabel?: boolean;
}

export function BeaconMarker({ beacon, scale = 1, showLabel = false }: BeaconMarkerProps) {
  const statusColors = {
    active: "bg-primary/20 border-primary text-primary",
    inactive: "bg-warning/20 border-warning text-warning",
    offline: "bg-muted border-border text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 z-0"
      )}
      style={{
        left: beacon.position.x * scale,
        top: beacon.position.y * scale,
      }}
    >
      {/* Range indicator */}
      {beacon.status === "active" && (
        <div className="absolute w-[120px] h-[120px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border border-primary/20 bg-primary/5" />
      )}

      <div
        className={cn(
          "relative w-6 h-6 rounded-md border flex items-center justify-center",
          statusColors[beacon.status],
          beacon.status === "active" && "beacon-pulse"
        )}
      >
        <Radio className="w-3 h-3" />
      </div>

      {showLabel && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground font-medium">
          {beacon.name}
        </div>
      )}
    </div>
  );
}
