import { cn } from "@/lib/utils";
import type { Beacon } from "@/types/telemetry";
import { Radio } from "lucide-react";
import type { CSSProperties } from "react";

// Zasięg beacona UWB w metrach (z dokumentacji API)
const BEACON_RANGE_M = 15;

interface BeaconMarkerProps {
  beacon: Beacon;
  scale?: number; // pikseli na metr
  showLabel?: boolean;
  showRange?: boolean; // czy pokazywać okrąg zasięgu
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties; // opcjonalne nadpisanie pozycji
}

export function BeaconMarker({ 
  beacon, 
  scale = 12,
  showLabel = false,
  showRange = true,
  selected = false,
  onClick,
  style,
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

  // Oblicz rozmiar okręgu zasięgu w pikselach
  // Średnica = zasięg * 2 * scale (bo zasięg to promień)
  const rangeDiameterPx = BEACON_RANGE_M * 2 * scale;

  // Domyślna pozycja bazowana na beacon.position, może być nadpisana przez style
  const defaultStyle: CSSProperties = {
    left: beacon.position.x * scale,
    top: beacon.position.y * scale,
  };

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        onClick && "cursor-pointer"
      )}
      style={{ ...defaultStyle, ...style }}
      onClick={handleClick}
    >
      {/* Range indicator - rozmiar bazowany na rzeczywistym zasięgu 15m */}
      {showRange && beacon.status === "active" && (
        <div 
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border transition-all duration-300",
            selected 
              ? "border-primary/40 bg-primary/10" 
              : "border-primary/20 bg-primary/5"
          )}
          style={{
            width: rangeDiameterPx,
            height: rangeDiameterPx,
          }}
        />
      )}

      {/* Selection ring */}
      {selected && (
        <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-lg border-2 border-primary animate-pulse" />
      )}

      <div
        className={cn(
          "relative w-6 h-6 rounded-md border flex items-center justify-center transition-all z-10",
          statusColors[beacon.status],
          beacon.status === "active" && "beacon-pulse",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
        )}
      >
        <Radio className="w-3 h-3" />
      </div>

      {/* Tags count badge */}
      {beacon.tags_in_range && beacon.tags_in_range.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold z-20">
          {beacon.tags_in_range.length}
        </div>
      )}

      {(showLabel || selected) && (
        <div className={cn(
          "absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded z-20",
          selected 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground bg-background/80"
        )}>
          {beacon.name}
        </div>
      )}
    </div>
  );
}