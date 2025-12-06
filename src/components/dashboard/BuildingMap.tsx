import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FirefighterMarker } from "./FirefighterMarker";
import { BeaconMarker } from "./BeaconMarker";
import type { TagTelemetry, BeaconsStatus, BuildingConfig } from "@/types/telemetry";
import { Layers, ZoomIn, ZoomOut, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuildingMapProps {
  firefighters: TagTelemetry[];
  beacons: BeaconsStatus | null;
  building: BuildingConfig | null;
  selectedFirefighterId: string | null;
  onSelectFirefighter: (id: string | null) => void;
}

export function BuildingMap({
  firefighters,
  beacons,
  building,
  selectedFirefighterId,
  onSelectFirefighter,
}: BuildingMapProps) {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [scale, setScale] = useState(12);
  const [showBeaconLabels, setShowBeaconLabels] = useState(false);

  const floors = building?.building.floors || [
    { number: -1, name: "Piwnica", height_m: -3.0, hazard_level: "high" },
    { number: 0, name: "Parter", height_m: 0, hazard_level: "medium" },
    { number: 1, name: "1. piętro", height_m: 3.2, hazard_level: "low" },
    { number: 2, name: "2. piętro", height_m: 6.4, hazard_level: "low" },
  ];

  const dimensions = building?.building.dimensions || { width_m: 40, depth_m: 25 };

  const firefightersOnFloor = useMemo(
    () => firefighters.filter((f) => f.position.floor === currentFloor),
    [firefighters, currentFloor]
  );

  const beaconsOnFloor = useMemo(
    () => beacons?.beacons.filter((b) => b.floor === currentFloor) || [],
    [beacons, currentFloor]
  );

  const hazardZones = building?.building.hazard_zones.filter((hz) => hz.floor === currentFloor) || [];
  const entryPoints = building?.building.entry_points.filter((ep) => ep.floor === currentFloor) || [];

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Mapa budynku</h2>
          {building && (
            <span className="text-xs text-muted-foreground">
              {building.building.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Floor selector */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            {floors.map((floor) => (
              <button
                key={floor.number}
                onClick={() => setCurrentFloor(floor.number)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-colors",
                  currentFloor === floor.number
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {floor.number === 0 ? "P" : floor.number}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.max(8, s - 2))}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.min(20, s + 2))}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowBeaconLabels((s) => !s)}
            >
              <Crosshair className={cn("w-3 h-3", showBeaconLabels && "text-primary")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="relative tactical-grid bg-muted/30 rounded-lg border border-border/50 mx-auto"
          style={{
            width: dimensions.width_m * scale,
            height: dimensions.depth_m * scale,
          }}
          onClick={() => onSelectFirefighter(null)}
        >
          {/* Hazard zones */}
          {hazardZones.map((zone) => (
            <div
              key={zone.id}
              className="absolute bg-destructive/10 border border-destructive/30 rounded"
              style={{
                left: 10 * scale,
                top: 10 * scale,
                width: 8 * scale,
                height: 6 * scale,
              }}
            >
              <span className="absolute top-1 left-1 text-[10px] text-destructive font-medium">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Entry points */}
          {entryPoints.map((entry) => (
            <div
              key={entry.id}
              className="absolute w-8 h-1 bg-success rounded -translate-x-1/2"
              style={{
                left: entry.position.x * scale,
                top: entry.position.y * scale,
              }}
            />
          ))}

          {/* Beacons */}
          {beaconsOnFloor.map((beacon) => (
            <BeaconMarker
              key={beacon.id}
              beacon={beacon}
              scale={scale}
              showLabel={showBeaconLabels}
            />
          ))}

          {/* Firefighters */}
          {firefightersOnFloor.map((ff) => (
            <FirefighterMarker
              key={ff.firefighter.id}
              telemetry={ff}
              selected={selectedFirefighterId === ff.firefighter.id}
              onClick={() => onSelectFirefighter(ff.firefighter.id)}
              scale={scale}
            />
          ))}

          {/* Scale indicator */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-10 h-0.5 bg-muted-foreground/50" />
            <span>10m</span>
          </div>
        </div>
      </div>

      {/* Floor info */}
      <div className="p-2 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Kondygnacja: <span className="text-foreground font-medium">{floors.find((f) => f.number === currentFloor)?.name}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Strażacy: <span className="text-foreground font-mono">{firefightersOnFloor.length}</span>
            </span>
            <span className="text-muted-foreground">
              Beacony: <span className="text-foreground font-mono">{beaconsOnFloor.length}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
