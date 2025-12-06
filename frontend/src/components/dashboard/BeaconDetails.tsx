import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Beacon, TagTelemetry } from "@/types/telemetry";
import {
  Radio,
  X,
  Battery,
  Signal,
  Users,
  Activity,
  MapPin,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeaconDetailsProps {
  beacon: Beacon;
  firefighters: TagTelemetry[];
  onClose: () => void;
}

// Bazowy URL API
const API_BASE_URL = "https://niesmiertelnik.replit.app/api/v1";

export function BeaconDetails({ beacon, firefighters, onClose }: BeaconDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Dodatkowe dane z REST API (jeśli potrzebne)
  const [apiData, setApiData] = useState<Partial<Beacon> | null>(null);

  const statusConfig = {
    active: {
      color: "text-success",
      bg: "bg-success/10",
      label: "Aktywny",
      icon: CheckCircle,
    },
    inactive: {
      color: "text-warning",
      bg: "bg-warning/10",
      label: "Nieaktywny",
      icon: AlertTriangle,
    },
    offline: {
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Offline",
      icon: AlertTriangle,
    },
  };

  const status = statusConfig[beacon.status] || statusConfig.offline;
  const StatusIcon = status.icon;

  const signalQualityConfig: Record<string, { color: string; label: string }> = {
    excellent: { color: "text-success", label: "Doskonała" },
    good: { color: "text-primary", label: "Dobra" },
    fair: { color: "text-warning", label: "Średnia" },
    poor: { color: "text-destructive", label: "Słaba" },
  };

  const signalQuality = beacon.signal_quality 
    ? signalQualityConfig[beacon.signal_quality] 
    : null;

  // Znajdź strażaków w zasięgu na podstawie uwb_measurements z telemetrii
  const firefightersInRange = firefighters.filter((ff) =>
    ff.uwb_measurements?.some((m) => m.beacon_id === beacon.id)
  );

  // Merge danych z WebSocket (beacon) i REST API (apiData)
  const displayData = { ...beacon, ...apiData };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", status.bg)}>
            <Radio className={cn("w-5 h-5", status.color)} />
          </div>
          <div>
            <h2 className="font-semibold">{beacon.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{beacon.id}</span>
              <span>•</span>
              <span className="capitalize">{beacon.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={loading}
            title="Odśwież dane"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <div className="text-xs">Nie udało się pobrać dodatkowych danych z API</div>
          </div>
        )}

        {/* Status */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <StatusIcon className={cn("w-4 h-4", status.color)} />
            <span>Status</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("p-2 rounded-lg text-center", status.bg)}>
              <span className={cn("text-sm font-medium", status.color)}>
                {status.label}
              </span>
            </div>
            {signalQuality && (
              <div className="p-2 rounded-lg text-center bg-muted">
                <span className={cn("text-sm font-medium", signalQuality.color)}>
                  {signalQuality.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Position */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Pozycja</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">X:</span>
              <span className="font-mono">{beacon.position.x.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Y:</span>
              <span className="font-mono">{beacon.position.y.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Z:</span>
              <span className="font-mono">{beacon.position.z.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Piętro:</span>
              <span className="font-mono">{beacon.floor}</span>
            </div>
          </div>
          {displayData.gps && (
            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
              GPS: {displayData.gps.lat.toFixed(6)}°N, {displayData.gps.lon.toFixed(6)}°E
            </div>
          )}
        </div>

        {/* Battery & Device */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Battery className="w-4 h-4 text-primary" />
            <span>Urządzenie</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bateria:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      beacon.battery_percent > 50
                        ? "bg-success"
                        : beacon.battery_percent > 20
                        ? "bg-warning"
                        : "bg-destructive"
                    )}
                    style={{ width: `${beacon.battery_percent}%` }}
                  />
                </div>
                <span className="font-mono text-xs">{beacon.battery_percent}%</span>
              </div>
            </div>
            {beacon.battery_voltage_mv && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Napięcie:</span>
                <span className="font-mono">{(beacon.battery_voltage_mv / 1000).toFixed(2)} V</span>
              </div>
            )}
            {beacon.temperature_c !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Temperatura:</span>
                <span className="font-mono">{beacon.temperature_c}°C</span>
              </div>
            )}
            {displayData.firmware_version && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Firmware:</span>
                <span className="font-mono text-xs">{displayData.firmware_version}</span>
              </div>
            )}
            {displayData.hardware_version && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hardware:</span>
                <span className="font-mono text-xs">{displayData.hardware_version}</span>
              </div>
            )}
          </div>
        </div>

        {/* UWB Statistics */}
        {(displayData.uwb_tx_count !== undefined || displayData.uwb_rx_count !== undefined) && (
          <div className="glass-panel p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="w-4 h-4 text-primary" />
              <span>Statystyki UWB</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {displayData.uwb_tx_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TX:</span>
                  <span className="font-mono">{displayData.uwb_tx_count.toLocaleString()}</span>
                </div>
              )}
              {displayData.uwb_rx_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RX:</span>
                  <span className="font-mono">{displayData.uwb_rx_count.toLocaleString()}</span>
                </div>
              )}
              {displayData.last_ping_ms !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ping:</span>
                  <span className="font-mono">{displayData.last_ping_ms} ms</span>
                </div>
              )}
              {displayData.error_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Błędy:</span>
                  <span className={cn(
                    "font-mono",
                    displayData.error_count > 0 ? "text-warning" : "text-success"
                  )}>
                    {displayData.error_count}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detected Tags / Firefighters in Range */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-primary" />
              <span>Tagi w zasięgu</span>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {beacon.detected_tags?.length || firefightersInRange.length || beacon.tags_in_range?.length || 0}
            </span>
          </div>

          {/* Dane z WebSocket beacons_status (detected_tags) */}
          {beacon.detected_tags && beacon.detected_tags.length > 0 ? (
            <div className="space-y-2">
              {beacon.detected_tags.map((tag) => (
                <div
                  key={tag.tag_id}
                  className="p-2 bg-muted/50 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{tag.firefighter_name}</span>
                    <span className="text-xs text-muted-foreground">{tag.tag_id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">{tag.range_m.toFixed(1)}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">{tag.rssi_dbm} dBm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">{tag.velocity_mps.toFixed(1)} m/s</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      tag.los ? "text-success" : "text-warning"
                    )}>
                      {tag.los ? "LOS" : `NLOS (${(tag.nlos_probability * 100).toFixed(0)}%)`}
                    </span>
                    <span className="text-muted-foreground capitalize">
                      {tag.signal_quality}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : firefightersInRange.length > 0 ? (
            /* Fallback - dane z telemetrii strażaków (uwb_measurements) */
            <div className="space-y-2">
              {firefightersInRange.map((ff) => {
                const measurement = ff.uwb_measurements?.find(
                  (m) => m.beacon_id === beacon.id
                );
                return (
                  <div
                    key={ff.firefighter.id}
                    className="p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ff.firefighter.name}</span>
                      <span className="text-xs text-muted-foreground">{ff.tag_id}</span>
                    </div>
                    {measurement && (
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{measurement.range_m.toFixed(1)}m</span>
                        <span className="font-mono">{measurement.rssi_dbm} dBm</span>
                        <span className={cn(
                          measurement.los ? "text-success" : "text-warning"
                        )}>
                          {measurement.los ? "LOS" : "NLOS"}
                        </span>
                        <span className="capitalize">{measurement.quality}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : beacon.tags_in_range && beacon.tags_in_range.length > 0 ? (
            /* Ostatni fallback - tylko ID tagów */
            <div className="space-y-1">
              {beacon.tags_in_range.map((tagId) => {
                // Spróbuj znaleźć nazwę strażaka
                const ff = firefighters.find((f) => f.tag_id === tagId);
                return (
                  <div key={tagId} className="p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm">{ff?.firefighter.name || "Nieznany"}</span>
                    <span className="text-xs text-muted-foreground">{tagId}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              Brak tagów w zasięgu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}