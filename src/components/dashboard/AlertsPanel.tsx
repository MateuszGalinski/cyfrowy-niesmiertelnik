import { cn } from "@/lib/utils";
import type { Alert } from "@/types/telemetry";
import { AlertTriangle, AlertCircle, Bell, Check, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onLocateFirefighter: (firefighterId: string) => void;
}

export function AlertsPanel({ alerts, onAcknowledge, onLocateFirefighter }: AlertsPanelProps) {
  const activeAlerts = alerts.filter((a) => !a.resolved);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = activeAlerts.filter((a) => a.severity === "warning");

  const alertTypeLabels: Record<string, string> = {
    man_down: "MAN DOWN",
    sos_pressed: "SOS",
    high_heart_rate: "Wysokie tętno",
    low_battery: "Niska bateria",
    scba_low_pressure: "Niskie ciśnienie SCBA",
    scba_critical: "Krytyczny SCBA",
    beacon_offline: "Beacon offline",
    tag_offline: "Tag offline",
    high_co: "Wysoki CO",
    low_oxygen: "Niski O₂",
    explosive_gas: "Gaz wybuchowy",
    high_temperature: "Wysoka temperatura",
  };

  return (
    <div className="glass-panel flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Alerty</h2>
          </div>
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                {criticalAlerts.length} krytyczne
              </span>
            )}
            {warningAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {warningAlerts.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto max-h-64">
        {activeAlerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Brak aktywnych alertów
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              typeLabel={alertTypeLabels[alert.alert_type] || alert.alert_type}
              onAcknowledge={() => onAcknowledge(alert.id)}
              onLocate={() => onLocateFirefighter(alert.firefighter.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  typeLabel: string;
  onAcknowledge: () => void;
  onLocate: () => void;
}

function AlertItem({ alert, typeLabel, onAcknowledge, onLocate }: AlertItemProps) {
  const severityStyles = {
    critical: "bg-destructive/10 border-l-destructive",
    warning: "bg-warning/10 border-l-warning",
    info: "bg-muted border-l-muted-foreground",
  };

  const severityIcons = {
    critical: <AlertTriangle className="w-4 h-4 text-destructive" />,
    warning: <AlertCircle className="w-4 h-4 text-warning" />,
    info: <Bell className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <div
      className={cn(
        "p-3 border-b border-border/50 border-l-4",
        severityStyles[alert.severity],
        alert.severity === "critical" && !alert.acknowledged && "alert-flash"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {severityIcons[alert.severity]}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{typeLabel}</span>
              {alert.acknowledged && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Potwierdzone
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {alert.firefighter.name} • {alert.firefighter.role}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: pl })}
              </span>
              <MapPin className="w-3 h-3 ml-2" />
              <span>Piętro {alert.position.floor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={onLocate}
        >
          <MapPin className="w-3 h-3 mr-1" />
          Lokalizuj
        </Button>
        {!alert.acknowledged && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={onAcknowledge}
          >
            <Check className="w-3 h-3 mr-1" />
            Potwierdź
          </Button>
        )}
      </div>
    </div>
  );
}
