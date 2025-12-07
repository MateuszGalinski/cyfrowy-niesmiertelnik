import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  History,
  AlertTriangle,
  Activity,
  Search,
  Calendar,
  User,
  Clock,
  MapPin,
  Heart,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// API base URL
const API_BASE_URL = "http://localhost:8000/api";

// Types
interface Firefighter {
  id: string;
  tag_id: string;
  name: string;
  rank: string;
  role: string;
  team: string;
}

interface Position {
  id: number;
  x: number;
  y: number;
  z: number;
  floor: number;
  confidence?: number;
  source?: string;
  beacons_used?: number;
  accuracy_m?: number;
}

interface Vitals {
  id: number;
  heart_rate_bpm: number;
  heart_rate_variability_ms: number;
  heart_rate_confidence: number;
  hr_zone: string;
  motion_state: string;
  stationary_duration_s: number;
}

interface TelemetryRecord {
  id: number;
  firefighter: Firefighter;
  position: Position;
  vitals: Vitals | null;
  type: string;
  timestamp: string;
  sequence: number;
  tag_id: string;
  heading_deg: number;
}

interface AlertDetails {
  id: number;
  stationary_duration_s?: number;
  last_motion_state?: string;
  last_heart_rate?: number;
  sos_button_pressed?: boolean;
}

interface AlertRecord {
  id: string;
  firefighter: Firefighter;
  position: Position;
  details: AlertDetails;
  type: string;
  timestamp: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  tag_id: string;
  resolved: boolean;
  acknowledged: boolean;
}

// Helper functions
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTimeForInput(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function getFloorName(floor: number): string {
  if (floor === -1) return "Piwnica";
  if (floor === 0) return "Parter";
  return `${floor}. piętro`;
}

function getAlertTypeLabel(alertType: string): string {
  const labels: Record<string, string> = {
    man_down: "Man Down",
    sos_pressed: "SOS",
    high_heart_rate: "Wysokie tętno",
    low_battery: "Niska bateria",
    scba_low_pressure: "Niskie ciśnienie SCBA",
    scba_critical: "Krytyczne SCBA",
    beacon_offline: "Beacon offline",
    tag_offline: "Tag offline",
    high_temperature: "Wysoka temperatura",
    high_co: "Wysokie CO",
    low_oxygen: "Niski poziom O2",
    explosive_gas: "Gaz wybuchowy",
  };
  return labels[alertType] || alertType;
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return { color: "text-destructive", bg: "bg-destructive/10", label: "Krytyczny" };
    case "warning":
      return { color: "text-warning", bg: "bg-warning/10", label: "Ostrzeżenie" };
    default:
      return { color: "text-blue-500", bg: "bg-blue-500/10", label: "Info" };
  }
}

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "telemetry">("telemetry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [firefighterFilter, setFirefighterFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Data
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);

  // Expanded rows
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [expandedTelemetry, setExpandedTelemetry] = useState<Set<number>>(new Set());

  // Set default time range (last 24 hours)
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setEndTime(formatDateTimeForInput(now));
    setStartTime(formatDateTimeForInput(yesterday));
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startTime) params.append("start_time", new Date(startTime).toISOString());
      if (endTime) params.append("end_time", new Date(endTime).toISOString());
      if (firefighterFilter) params.append("firefighter", firefighterFilter);

      const response = await fetch(`${API_BASE_URL}/alerts/?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd pobierania alertów");
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, firefighterFilter]);

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startTime) params.append("start_time", new Date(startTime).toISOString());
      if (endTime) params.append("end_time", new Date(endTime).toISOString());
      if (firefighterFilter) params.append("firefighter", firefighterFilter);

      const response = await fetch(`${API_BASE_URL}/telemetry/?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log(data)
      setTelemetry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd pobierania telemetrii");
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, firefighterFilter]);

  const handleSearch = () => {
    if (activeTab === "alerts") {
      fetchAlerts();
    } else {
      fetchTelemetry();
    }
  };

  const toggleAlertExpanded = (id: string) => {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTelemetryExpanded = (id: number) => {
    setExpandedTelemetry((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Historia</h1>
              <p className="text-sm text-muted-foreground">
                Przeglądaj historyczne alarmy i telemetrię
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === "alerts" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setActiveTab("alerts")}
            >
              <AlertTriangle className="w-4 h-4" />
              Alarmy
              {alerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-background/20 rounded">
                  {alerts.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "telemetry" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setActiveTab("telemetry")}
            >
              <Activity className="w-4 h-4" />
              Telemetria
              {telemetry.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-background/20 rounded">
                  {telemetry.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t border-border">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filtry</span>
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFilters && (
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Start time */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Od
                  </label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* End time */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Do
                  </label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Firefighter filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Strażak
                  </label>
                  <Input
                    placeholder="Imię lub TAG ID..."
                    value={firefighterFilter}
                    onChange={(e) => setFirefighterFilter(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Search button */}
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="w-full h-9 gap-2">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Szukaj
                  </Button>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Szybkie filtry:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const now = new Date();
                    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                    setStartTime(formatDateTimeForInput(hourAgo));
                    setEndTime(formatDateTimeForInput(now));
                  }}
                >
                  Ostatnia godzina
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const now = new Date();
                    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    setStartTime(formatDateTimeForInput(yesterday));
                    setEndTime(formatDateTimeForInput(now));
                  }}
                >
                  Ostatnie 24h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    setStartTime(formatDateTimeForInput(weekAgo));
                    setEndTime(formatDateTimeForInput(now));
                  }}
                >
                  Ostatni tydzień
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setStartTime("");
                    setEndTime("");
                    setFirefighterFilter("");
                  }}
                >
                  Wyczyść
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <div className="font-medium text-destructive">Błąd</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={handleSearch}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Ponów
            </Button>
          </div>
        )}

        {activeTab === "alerts" ? (
          /* Alerts list */
          <div className="space-y-2">
            {alerts.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Brak alertów dla wybranych filtrów</p>
                <p className="text-sm">Kliknij "Szukaj" aby załadować dane</p>
              </div>
            )}

            {alerts.map((alert) => {
              const isExpanded = expandedAlerts.has(alert.id);
              const severity = getSeverityConfig(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-colors",
                    alert.severity === "critical" && "border-destructive/50",
                    alert.severity === "warning" && "border-warning/50"
                  )}
                >
                  {/* Alert header */}
                  <button
                    onClick={() => toggleAlertExpanded(alert.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 text-left"
                  >
                    <div className={cn("p-2 rounded-lg", severity.bg)}>
                      <AlertTriangle className={cn("w-5 h-5", severity.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                        <span className={cn("text-xs px-2 py-0.5 rounded", severity.bg, severity.color)}>
                          {severity.label}
                        </span>
                        {alert.resolved && (
                          <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">
                            Rozwiązany
                          </span>
                        )}
                        {alert.acknowledged && !alert.resolved && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                            Potwierdzony
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.firefighter.name} • {alert.firefighter.role}
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(alert.timestamp)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {getFloorName(alert.position.floor)}
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Alert details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">ID Alertu</div>
                          <div className="font-mono text-sm">{alert.id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Tag ID</div>
                          <div className="font-mono text-sm">{alert.tag_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Pozycja</div>
                          <div className="font-mono text-sm">
                            ({alert.position.x.toFixed(1)}, {alert.position.y.toFixed(1)})
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Piętro</div>
                          <div className="text-sm">{getFloorName(alert.position.floor)}</div>
                        </div>
                      </div>

                      {alert.details && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Szczegóły</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {alert.details.stationary_duration_s !== undefined && (
                              <div>
                                <div className="text-xs text-muted-foreground">Czas bezruchu</div>
                                <div className="text-sm">{alert.details.stationary_duration_s}s</div>
                              </div>
                            )}
                            {alert.details.last_motion_state && (
                              <div>
                                <div className="text-xs text-muted-foreground">Ostatni ruch</div>
                                <div className="text-sm capitalize">{alert.details.last_motion_state}</div>
                              </div>
                            )}
                            {alert.details.last_heart_rate && (
                              <div>
                                <div className="text-xs text-muted-foreground">Ostatnie tętno</div>
                                <div className="text-sm">{alert.details.last_heart_rate} bpm</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {alert.resolved ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : alert.acknowledged ? (
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span>
                            {alert.resolved
                              ? "Rozwiązany"
                              : alert.acknowledged
                              ? "Potwierdzony"
                              : "Niepotwierdzony"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Telemetry list */
          <div className="space-y-2">
            {telemetry.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Brak danych telemetrycznych dla wybranych filtrów</p>
                <p className="text-sm">Kliknij "Szukaj" aby załadować dane</p>
              </div>
            )}

            {telemetry.map((record) => {
              const isExpanded = expandedTelemetry.has(record.id);

              return (
                <div
                  key={record.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Telemetry header */}
                  <button
                    onClick={() => toggleTelemetryExpanded(record.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 text-left"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{record.firefighter.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.firefighter.role} • {record.tag_id}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {record.vitals && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-mono">{record.vitals.heart_rate_bpm}</span>
                          <span className="text-xs text-muted-foreground">bpm</span>
                        </div>
                      )}

                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(record.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {getFloorName(record.position.floor)}
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Telemetry details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/30 space-y-4">
                      {/* Position */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Pozycja</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">X</div>
                            <div className="font-mono text-sm">{record.position.x.toFixed(2)}m</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Y</div>
                            <div className="font-mono text-sm">{record.position.y.toFixed(2)}m</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Z</div>
                            <div className="font-mono text-sm">{record.position.z.toFixed(2)}m</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Piętro</div>
                            <div className="text-sm">{getFloorName(record.position.floor)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Kierunek</div>
                            <div className="font-mono text-sm">{record.heading_deg.toFixed(1)}°</div>
                          </div>
                        </div>
                      </div>

                      {/* Vitals */}
                      {record.vitals && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Parametry życiowe</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Tętno</div>
                              <div className="font-mono text-sm">{record.vitals.heart_rate_bpm} bpm</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Pewność HR</div>
                              <div className="font-mono text-sm">{record.vitals.heart_rate_confidence}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Stan ruchu</div>
                              <div className="text-sm capitalize">{record.vitals.motion_state}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Czas bezruchu</div>
                              <div className="font-mono text-sm">{record.vitals.stationary_duration_s}s</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                        <div>
                          <div className="text-xs text-muted-foreground">ID rekordu</div>
                          <div className="font-mono text-sm">{record.id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Sekwencja</div>
                          <div className="font-mono text-sm">{record.sequence}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Źródło</div>
                          <div className="text-sm">{record.position.source || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Dokładność</div>
                          <div className="font-mono text-sm">
                            {record.position.accuracy_m?.toFixed(2) || "N/A"}m
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
