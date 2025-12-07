import { cn } from "@/lib/utils";
import { VitalsPanel } from "./VitalsPanel";
import { StatusBadge } from "./StatusBadge";
import type { TagTelemetry, Alert } from "@/types/telemetry";
import { X, MapPin, User, Shield, Radio, Activity, Thermometer, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface FirefighterDetailsProps {
  telemetry: TagTelemetry;
  alerts: Alert[];
  onClose: () => void;
}

export function FirefighterDetails({ telemetry, alerts, onClose }: FirefighterDetailsProps) {
  const { firefighter, position, vitals, scba, device, environment } = telemetry;

  const firefighterAlerts = alerts.filter(
    (a) => a.firefighter.id === firefighter.id && !a.resolved
  );

  const getStatus = (): "ok" | "warning" | "critical" => {
    if (vitals.stationary_duration_s > 30) return "critical";
    if (vitals.heart_rate_bpm > 180 || device.battery_percent < 20) return "warning";
    return "ok";
  };

  const status = getStatus();

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2",
                status === "ok" && "border-success bg-success/20",
                status === "warning" && "border-warning bg-warning/20",
                status === "critical" && "border-destructive bg-destructive/20"
              )}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{firefighter.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{firefighter.rank}</span>
                <span>•</span>
                <span>{firefighter.role}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <StatusBadge
            status={status}
            label={status === "ok" ? "Aktywny" : status === "warning" ? "Uwaga" : "Krytyczny"}
          />
          <span className="text-xs text-muted-foreground">Zespół: {firefighter.team}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Alerts */}
        {firefighterAlerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">
              Aktywne alerty ({firefighterAlerts.length})
            </h3>
            <div className="space-y-2">
              {firefighterAlerts.map((alert) => (
                <div key={alert.id} className="text-sm">
                  <span className="font-medium">{alert.alert_type}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: pl })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Position */}
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pozycja
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="data-label">Piętro</span>
              <p className="data-value text-lg font-semibold">{position.floor}</p>
            </div>
            <div>
              <span className="data-label">Dokładność</span>
              <p className="data-value">{position.accuracy_m.toFixed(2)}m</p>
            </div>
            <div>
              <span className="data-label">Pewność</span>
              <p className="data-value">{(position.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            X: {position.x.toFixed(2)}m, Y: {position.y.toFixed(2)}m, Z: {position.z.toFixed(2)}m
          </div>
        </div>

        {/* Vitals */}
        <VitalsPanel telemetry={telemetry} />

        {/* Environment */}
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Środowisko
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <EnvironmentItem
              label="CO"
              value={`${environment.co_ppm} ppm`}
              alarm={environment.co_alarm}
            />
            <EnvironmentItem
              label="O₂"
              value={`${environment.o2_percent}%`}
              alarm={environment.o2_alarm}
            />
            <EnvironmentItem
              label="LEL"
              value={`${environment.lel_percent}%`}
              alarm={environment.lel_alarm}
            />
          </div>
        </div>

        {/* Device */}
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Urządzenie
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="data-label">Tag ID</span>
              <p className="data-value">{device.tag_id}</p>
            </div>
            <div>
              <span className="data-label">Firmware</span>
              <p className="data-value">{device.firmware_version}</p>
            </div>
            <div>
              <span className="data-label">Połączenie</span>
              <p className="data-value uppercase">{device.connection_primary}</p>
            </div>
            <div>
              <span className="data-label">LoRa RSSI</span>
              <p className="data-value">{device.lora_rssi_dbm} dBm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnvironmentItem({
  label,
  value,
  alarm,
}: {
  label: string;
  value: string;
  alarm: boolean;
}) {
  return (
    <div className={cn("p-2 rounded", alarm && "bg-destructive/20")}>
      <span className="data-label">{label}</span>
      <p className={cn("data-value", alarm && "text-destructive font-semibold")}>{value}</p>
    </div>
  );
}
