import { Heart, Battery, Activity, Wind, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagTelemetry } from "@/types/telemetry";

interface VitalsPanelProps {
  telemetry: TagTelemetry;
  compact?: boolean;
}

export function VitalsPanel({ telemetry, compact = false }: VitalsPanelProps) {
  const { vitals, scba, device, environment } = telemetry;

  const getHeartRateStatus = (bpm: number) => {
    if (bpm > 180) return "critical";
    if (bpm > 150) return "warning";
    return "ok";
  };

  const getBatteryStatus = (percent: number) => {
    if (percent < 10) return "critical";
    if (percent < 20) return "warning";
    return "ok";
  };

  const getScbaStatus = (remaining: number) => {
    if (remaining < 5) return "critical";
    if (remaining < 15) return "warning";
    return "ok";
  };

  const statusColors = {
    ok: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className={cn("flex items-center gap-1", statusColors[getHeartRateStatus(vitals.heart_rate_bpm)])}>
          <Heart className="w-3 h-3" />
          <span className="font-mono">{vitals.heart_rate_bpm}</span>
        </div>
        <div className={cn("flex items-center gap-1", statusColors[getBatteryStatus(device.battery_percent)])}>
          <Battery className="w-3 h-3" />
          <span className="font-mono">{device.battery_percent}%</span>
        </div>
        <div className={cn("flex items-center gap-1", statusColors[getScbaStatus(scba.remaining_time_min)])}>
          <Wind className="w-3 h-3" />
          <span className="font-mono">{scba.remaining_time_min}m</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parametry życiowe</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <VitalItem
          icon={Heart}
          label="Tętno"
          value={`${vitals.heart_rate_bpm} bpm`}
          status={getHeartRateStatus(vitals.heart_rate_bpm)}
        />
        <VitalItem
          icon={Activity}
          label="Stan ruchu"
          value={vitals.motion_state}
          status={vitals.stationary_duration_s > 20 ? "warning" : "ok"}
        />
        <VitalItem
          icon={Battery}
          label="Bateria"
          value={`${device.battery_percent}%`}
          status={getBatteryStatus(device.battery_percent)}
        />
        <VitalItem
          icon={Wind}
          label="SCBA"
          value={`${scba.remaining_time_min} min`}
          status={getScbaStatus(scba.remaining_time_min)}
        />
        <VitalItem
          icon={Thermometer}
          label="Temperatura"
          value={`${environment.temperature_c}°C`}
          status={environment.temperature_alarm ? "critical" : "ok"}
        />
        <div className="flex flex-col">
          <span className="data-label">Ciśnienie SCBA</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  scba.cylinder_pressure_bar / scba.max_pressure_bar > 0.5
                    ? "bg-success"
                    : scba.cylinder_pressure_bar / scba.max_pressure_bar > 0.2
                    ? "bg-warning"
                    : "bg-destructive"
                )}
                style={{ width: `${(scba.cylinder_pressure_bar / scba.max_pressure_bar) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs">{scba.cylinder_pressure_bar} bar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VitalItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: "ok" | "warning" | "critical";
}

function VitalItem({ icon: Icon, label, value, status }: VitalItemProps) {
  const statusColors = {
    ok: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  };

  return (
    <div className="flex flex-col">
      <span className="data-label">{label}</span>
      <div className={cn("flex items-center gap-1.5", statusColors[status])}>
        <Icon className="w-4 h-4" />
        <span className="font-mono text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
