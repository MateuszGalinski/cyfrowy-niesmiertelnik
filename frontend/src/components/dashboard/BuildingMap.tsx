import { useState, useMemo, useEffect, useRef, Suspense, lazy } from "react";
import { cn } from "@/lib/utils";
import { FirefighterMarker } from "./FirefighterMarker";
import { BeaconMarker } from "./BeaconMarker";
import type { TagTelemetry, BeaconsStatus, BuildingConfig } from "@/types/telemetry";
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Image as ImageIcon, 
  RotateCw,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Circle,
  Box,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Lazy load BuildingMap3D
const BuildingMap3D = lazy(() => import("./BuildingMap3D").then(m => ({ default: m.BuildingMap3D })));

// Stałe
const SCALE_INDICATOR_METERS = 10;
const BEACON_RANGE_M = 15;

interface FloorOverlay {
  url: string;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

interface BuildingMapProps {
  firefighters: TagTelemetry[];
  beacons: BeaconsStatus | null;
  building: BuildingConfig | null;
  selectedFirefighterId: string | null;
  onSelectFirefighter: (id: string | null) => void;
  selectedBeaconId: string | null;
  onSelectBeacon: (id: string | null) => void;
  targetFloor: number | null;
  onFloorChange: () => void;
}

// Loader dla widoku 3D
function Map3DLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-lg">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm">Ładowanie widoku 3D...</span>
      </div>
    </div>
  );
}

export function BuildingMap({
  firefighters,
  beacons,
  building,
  selectedFirefighterId,
  onSelectFirefighter,
  selectedBeaconId,
  onSelectBeacon,
  targetFloor,
  onFloorChange,
}: BuildingMapProps) {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [scale, setScale] = useState(12);
  const [showBeaconLabels, setShowBeaconLabels] = useState(false);
  const [showBeaconRanges, setShowBeaconRanges] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  
  // Overlay state
  const [floorOverlays, setFloorOverlays] = useState<Record<number, FloorOverlay>>({});
  const [showOverlayPanel, setShowOverlayPanel] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetFloor !== null) {
      setCurrentFloor(targetFloor);
      onFloorChange();
    }
  }, [targetFloor, onFloorChange]);

  // Load/save overlays from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("buildingMapOverlays");
    if (saved) {
      try {
        setFloorOverlays(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load overlays:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(floorOverlays).length > 0) {
      localStorage.setItem("buildingMapOverlays", JSON.stringify(floorOverlays));
    } else {
      localStorage.removeItem("buildingMapOverlays");
    }
  }, [floorOverlays]);

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

  const currentOverlay = floorOverlays[currentFloor];
  const scaleIndicatorWidth = SCALE_INDICATOR_METERS * scale;
  const mapPadding = showBeaconRanges ? BEACON_RANGE_M * scale : 20;

  const handleMapClick = () => {
    onSelectFirefighter(null);
    onSelectBeacon(null);
  };

  const handleBeaconClick = (beaconId: string) => {
    onSelectFirefighter(null);
    onSelectBeacon(beaconId);
  };

  const handleFirefighterClick = (firefighterId: string) => {
    onSelectBeacon(null);
    onSelectFirefighter(firefighterId);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Proszę wybrać plik graficzny (PNG, JPG, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setFloorOverlays((prev) => ({
        ...prev,
        [currentFloor]: {
          url,
          opacity: 0.5,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
      }));
      setShowOverlayPanel(true);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateOverlay = (updates: Partial<FloorOverlay>) => {
    if (!currentOverlay) return;
    setFloorOverlays((prev) => ({
      ...prev,
      [currentFloor]: { ...prev[currentFloor], ...updates },
    }));
  };

  const removeOverlay = () => {
    setFloorOverlays((prev) => {
      const newOverlays = { ...prev };
      delete newOverlays[currentFloor];
      return newOverlays;
    });
    setShowOverlayPanel(false);
  };

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
          {/* 2D/3D Toggle */}
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            <Button
              variant={viewMode === "2d" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
              onClick={() => setViewMode("2d")}
            >
              <Layers className="w-3 h-3" />
              2D
            </Button>
            <Button
              variant={viewMode === "3d" ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
              onClick={() => setViewMode("3d")}
            >
              <Box className="w-3 h-3" />
              3D
            </Button>
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Floor selector - tylko w 2D */}
          {viewMode === "2d" && (
            <>
              <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                {floors.map((floor) => (
                  <button
                    key={floor.number}
                    onClick={() => setCurrentFloor(floor.number)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors relative",
                      currentFloor === floor.number
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {floor.number === 0 ? "P" : floor.number}
                    {floorOverlays[floor.number] && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-border" />
            </>
          )}

          {/* Controls - tylko w 2D */}
          {viewMode === "2d" && (
            <>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setScale((s) => Math.max(6, s - 2))}
                  title="Pomniejsz"
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center font-mono">
                  {scale}px/m
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setScale((s) => Math.min(24, s + 2))}
                  title="Powiększ"
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
                
                <div className="w-px h-4 bg-border mx-1" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowBeaconLabels((s) => !s)}
                  title="Pokaż/ukryj etykiety beaconów"
                >
                  <Crosshair className={cn("w-3 h-3", showBeaconLabels && "text-primary")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowBeaconRanges((s) => !s)}
                  title={showBeaconRanges ? "Ukryj zasięgi beaconów" : "Pokaż zasięgi beaconów"}
                >
                  <Circle className={cn("w-3 h-3", showBeaconRanges && "text-primary fill-primary/20")} />
                </Button>
                
                <div className="w-px h-4 bg-border mx-1" />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => fileInputRef.current?.click()}
                  title="Dodaj nakładkę (PNG/JPG)"
                >
                  <ImageIcon className={cn("w-3 h-3", currentOverlay && "text-primary")} />
                </Button>
                
                {currentOverlay && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOverlayVisible((v) => !v)}
                      title={overlayVisible ? "Ukryj nakładkę" : "Pokaż nakładkę"}
                    >
                      {overlayVisible ? (
                        <Eye className="w-3 h-3 text-primary" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowOverlayPanel((s) => !s)}
                      title="Ustawienia nakładki"
                    >
                      <Settings2 className={cn("w-3 h-3", showOverlayPanel && "text-primary")} />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay Panel - tylko w 2D */}
      {viewMode === "2d" && currentOverlay && (
        <div className={cn(
          "border-b border-border bg-muted/30 transition-all duration-200 overflow-hidden",
          showOverlayPanel ? "max-h-96" : "max-h-0"
        )}>
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Nakładka - Piętro {currentFloor}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => updateOverlay({ rotation: (currentOverlay.rotation + 90) % 360 })}
                  title="Obróć +90°"
                >
                  <RotateCw className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                  onClick={() => updateOverlay({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 })}
                >
                  Reset
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={removeOverlay}
                  title="Usuń nakładkę"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowOverlayPanel(false)}
                  title="Zwiń panel"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Przezroczystość</span>
                  <span className="text-xs font-mono w-10 text-right">{Math.round(currentOverlay.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[currentOverlay.opacity]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => updateOverlay({ opacity: v })}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Skala</span>
                  <span className="text-xs font-mono w-10 text-right">{currentOverlay.scale.toFixed(2)}x</span>
                </div>
                <Slider
                  value={[currentOverlay.scale]}
                  min={0.1}
                  max={3}
                  step={0.05}
                  onValueChange={([v]) => updateOverlay({ scale: v })}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pozycja X</span>
                  <span className="text-xs font-mono w-10 text-right">{currentOverlay.offsetX}px</span>
                </div>
                <Slider
                  value={[currentOverlay.offsetX]}
                  min={-500}
                  max={500}
                  step={1}
                  onValueChange={([v]) => updateOverlay({ offsetX: v })}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pozycja Y</span>
                  <span className="text-xs font-mono w-10 text-right">{currentOverlay.offsetY}px</span>
                </div>
                <Slider
                  value={[currentOverlay.offsetY]}
                  min={-500}
                  max={500}
                  step={1}
                  onValueChange={([v]) => updateOverlay({ offsetY: v })}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rotacja</span>
                <span className="text-xs font-mono">{currentOverlay.rotation}°</span>
              </div>
              <Slider
                value={[currentOverlay.rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={([v]) => updateOverlay({ rotation: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed overlay indicator - tylko w 2D */}
      {viewMode === "2d" && currentOverlay && !showOverlayPanel && (
        <button
          onClick={() => setShowOverlayPanel(true)}
          className="flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-b border-border"
        >
          <Settings2 className="w-3 h-3" />
          <span>Ustawienia nakładki</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {/* Map content */}
      {viewMode === "2d" ? (
        <>
          {/* 2D Map */}
          <div className="flex-1 overflow-auto p-4">
            <div 
              className="relative mx-auto"
              style={{
                width: dimensions.width_m * scale + mapPadding * 2,
                height: dimensions.depth_m * scale + mapPadding * 2,
                padding: mapPadding,
              }}
            >
              <div
                className="relative tactical-grid bg-muted/30 rounded-lg border border-border/50"
                style={{
                  width: dimensions.width_m * scale,
                  height: dimensions.depth_m * scale,
                }}
                onClick={handleMapClick}
              >
                {/* Floor plan overlay */}
                {currentOverlay && overlayVisible && (
                  <div
                    className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg"
                    style={{ opacity: currentOverlay.opacity }}
                  >
                    <img
                      src={currentOverlay.url}
                      alt="Floor plan overlay"
                      className="absolute"
                      style={{
                        width: `${100 * currentOverlay.scale}%`,
                        height: `${100 * currentOverlay.scale}%`,
                        objectFit: "contain",
                        left: `calc(50% + ${currentOverlay.offsetX}px)`,
                        top: `calc(50% + ${currentOverlay.offsetY}px)`,
                        transform: `translate(-50%, -50%) rotate(${currentOverlay.rotation}deg)`,
                      }}
                    />
                  </div>
                )}

                {/* Hazard zones */}
                {hazardZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute bg-destructive/10 border border-destructive/30 rounded z-10"
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
                    className="absolute w-8 h-1 bg-success rounded -translate-x-1/2 z-10"
                    style={{
                      left: entry.position.x * scale,
                      top: entry.position.y * scale,
                    }}
                  />
                ))}

                {/* Scale indicator */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground z-20 bg-background/80 px-1.5 py-0.5 rounded">
                  <div 
                    className="h-0.5 bg-muted-foreground/50" 
                    style={{ width: scaleIndicatorWidth }}
                  />
                  <span>{SCALE_INDICATOR_METERS}m</span>
                </div>
              </div>

              {/* Beacons */}
              {beaconsOnFloor.map((beacon) => (
                <BeaconMarker
                  key={beacon.id}
                  beacon={beacon}
                  scale={scale}
                  showLabel={showBeaconLabels}
                  showRange={showBeaconRanges}
                  selected={selectedBeaconId === beacon.id}
                  onClick={() => handleBeaconClick(beacon.id)}
                  style={{
                    left: beacon.position.x * scale + mapPadding,
                    top: beacon.position.y * scale + mapPadding,
                  }}
                />
              ))}

              {/* Firefighters */}
              {firefightersOnFloor.map((ff) => (
                <FirefighterMarker
                  key={ff.firefighter.id}
                  telemetry={ff}
                  selected={selectedFirefighterId === ff.firefighter.id}
                  onClick={() => handleFirefighterClick(ff.firefighter.id)}
                  scale={scale}
                  style={{
                    left: ff.position.x * scale + mapPadding,
                    top: ff.position.y * scale + mapPadding,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Floor info */}
          <div className="p-2 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Kondygnacja: <span className="text-foreground font-medium">{floors.find((f) => f.number === currentFloor)?.name}</span>
                {currentOverlay && <span className="ml-2 text-blue-500">• Nakładka</span>}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  Budynek: <span className="text-foreground font-mono">{dimensions.width_m}m × {dimensions.depth_m}m</span>
                </span>
                <span className="text-muted-foreground">
                  Strażacy: <span className="text-foreground font-mono">{firefightersOnFloor.length}</span>
                </span>
                <span className="text-muted-foreground">
                  Beacony: <span className="text-foreground font-mono">{beaconsOnFloor.length}</span>
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 3D Map */
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<Map3DLoader />}>
            <BuildingMap3D
              firefighters={firefighters}
              beacons={beacons}
              building={building}
              selectedFirefighterId={selectedFirefighterId}
              onSelectFirefighter={onSelectFirefighter}
              selectedBeaconId={selectedBeaconId}
              onSelectBeacon={onSelectBeacon}
              showBeaconRanges={showBeaconRanges}
              showBeaconLabels={showBeaconLabels}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}