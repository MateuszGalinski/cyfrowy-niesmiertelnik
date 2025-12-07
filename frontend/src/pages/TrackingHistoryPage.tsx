import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  History,
  Search,
  Calendar,
  User,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

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

// Grouped telemetry by firefighter
interface FirefighterTrack {
  firefighter: Firefighter;
  points: Array<{
    x: number;
    y: number;
    z: number;
    floor: number;
    timestamp: string;
    heart_rate?: number;
  }>;
  color: string;
  visible: boolean;
}

// Color palette for tracks
const TRACK_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

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

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", {
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

export function TrackingHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [firefighterFilter, setFirefighterFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Map state
  const [currentFloor, setCurrentFloor] = useState(0);
  const [scale, setScale] = useState(12);
  const dimensions = { width_m: 40, depth_m: 25 };

  // Telemetry data
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [tracks, setTracks] = useState<Map<string, FirefighterTrack>>(new Map());

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Floors
  const floors = [
    { number: -1, name: "Piwnica" },
    { number: 0, name: "Parter" },
    { number: 1, name: "1. piętro" },
    { number: 2, name: "2. piętro" },
  ];

  // Set default time range (last hour)
  useEffect(() => {
    const now = new Date();
    now.setTime( now.getTime() - now.getTimezoneOffset()*60*1000 );
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setEndTime(formatDateTimeForInput(now));
    setStartTime(formatDateTimeForInput(hourAgo));
  }, []);

  // Process telemetry into tracks
  useEffect(() => {
    const newTracks = new Map<string, FirefighterTrack>();
    let colorIndex = 0;

    // Sort by timestamp
    const sorted = [...telemetry].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((record) => {
      const ffId = record.firefighter.id;

      if (!newTracks.has(ffId)) {
        newTracks.set(ffId, {
          firefighter: record.firefighter,
          points: [],
          color: TRACK_COLORS[colorIndex % TRACK_COLORS.length],
          visible: true,
        });
        colorIndex++;
      }

      newTracks.get(ffId)!.points.push({
        x: record.position.x,
        y: record.position.y,
        z: record.position.z,
        floor: record.position.floor,
        timestamp: record.timestamp,
        heart_rate: record.vitals?.heart_rate_bpm,
      });
    });

    setTracks(newTracks);
    setPlaybackIndex(0);
  }, [telemetry]);

  // All timestamps sorted
  const allTimestamps = useMemo(() => {
    const timestamps = new Set<string>();
    tracks.forEach((track) => {
      track.points.forEach((p) => timestamps.add(p.timestamp));
    });
    return Array.from(timestamps).sort();
  }, [tracks]);

  // Current timestamp for playback
  const currentTimestamp = allTimestamps[playbackIndex] || null;

  // Playback animation
  useEffect(() => {
    if (!isPlaying || allTimestamps.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= allTimestamps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, allTimestamps.length, playbackSpeed]);

  // Get visible points up to current timestamp for a track
  const getVisiblePoints = useCallback(
    (track: FirefighterTrack, floor: number) => {
      if (!currentTimestamp) return track.points.filter((p) => p.floor === floor);

      const currentTime = new Date(currentTimestamp).getTime();
      return track.points.filter(
        (p) => p.floor === floor && new Date(p.timestamp).getTime() <= currentTime
      );
    },
    [currentTimestamp]
  );

  // Get current position for a track
  const getCurrentPosition = useCallback(
    (track: FirefighterTrack) => {
      if (!currentTimestamp) {
        return track.points[track.points.length - 1] || null;
      }

      const currentTime = new Date(currentTimestamp).getTime();
      const visiblePoints = track.points.filter(
        (p) => new Date(p.timestamp).getTime() <= currentTime
      );
      return visiblePoints[visiblePoints.length - 1] || null;
    },
    [currentTimestamp]
  );

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
      setTelemetry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd pobierania telemetrii");
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, firefighterFilter]);

  const toggleTrackVisibility = (ffId: string) => {
    setTracks((prev) => {
      const newTracks = new Map(prev);
      const track = newTracks.get(ffId);
      if (track) {
        newTracks.set(ffId, { ...track, visible: !track.visible });
      }
      return newTracks;
    });
  };

  // Generate SVG path for track
  const generatePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return "";
    
    const pathParts = points.map((p, i) => {
      const x = p.x * scale;
      const y = p.y * scale;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });
    
    return pathParts.join(" ");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Historia śledzenia</h1>
              <p className="text-sm text-muted-foreground">
                Ścieżki strażaków na mapie w czasie
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-mono">{tracks.size}</span>
              <span className="text-muted-foreground">strażaków</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono">{telemetry.length}</span>
              <span className="text-muted-foreground">punktów</span>
            </div>
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

                <div className="flex items-end">
                  <Button onClick={fetchTelemetry} disabled={loading} className="w-full h-9 gap-2">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Załaduj
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
                    now.setTime( now.getTime() - now.getTimezoneOffset()*60*1000 );
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
                    now.setTime( now.getTime() - now.getTimezoneOffset()*60*1000 );
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

      {/* Error */}
      {error && (
        <div className="m-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <div className="font-medium text-destructive">Błąd</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchTelemetry}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Ponów
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 flex flex-col">
          {/* Map header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Mapa ścieżek</span>
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

              <div className="w-px h-4 bg-border" />

              {/* Zoom */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setScale((s) => Math.max(6, s - 2))}
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
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Map area */}
          <div className="flex-1 overflow-auto p-4">
            <div
              className="relative mx-auto tactical-grid bg-muted/30 rounded-lg border border-border/50"
              style={{
                width: dimensions.width_m * scale,
                height: dimensions.depth_m * scale,
              }}
            >
              {/* SVG for tracks */}
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ overflow: "visible" }}
              >
                {Array.from(tracks.values()).map((track) => {
                  if (!track.visible) return null;

                  const points = getVisiblePoints(track, currentFloor);
                  if (points.length < 2) return null;

                  const path = generatePath(points);

                  return (
                    <g key={track.firefighter.id}>
                      {/* Track line */}
                      <path
                        d={path}
                        fill="none"
                        stroke={track.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.7}
                      />
                      {/* Direction dots */}
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x * scale}
                          cy={p.y * scale}
                          r={i === points.length - 1 ? 6 : 2}
                          fill={track.color}
                          opacity={i === points.length - 1 ? 1 : 0.5}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>

              {/* Current positions */}
              {Array.from(tracks.values()).map((track) => {
                if (!track.visible) return null;

                const currentPos = getCurrentPosition(track);
                if (!currentPos || currentPos.floor !== currentFloor) return null;

                return (
                  <div
                    key={`marker-${track.firefighter.id}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{
                      left: currentPos.x * scale,
                      top: currentPos.y * scale,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: track.color }}
                    >
                      {track.firefighter.name.charAt(0)}
                    </div>
                    <div
                      className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: track.color }}
                    >
                      {track.firefighter.name.split(" ")[0]}
                    </div>
                  </div>
                );
              })}

              {/* Scale indicator */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground z-20 bg-background/80 px-1.5 py-0.5 rounded">
                <div className="h-0.5 bg-muted-foreground/50" style={{ width: 10 * scale }} />
                <span>10m</span>
              </div>

              {/* Floor label */}
              <div className="absolute top-2 left-2 text-xs font-medium px-2 py-1 bg-background/80 rounded">
                {getFloorName(currentFloor)}
              </div>
            </div>
          </div>

          {/* Playback controls */}
          {allTimestamps.length > 0 && (
            <div className="border-t border-border bg-card p-3">
              <div className="flex items-center gap-4">
                {/* Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPlaybackIndex(0)}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPlaybackIndex(allTimestamps.length - 1)}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timeline slider */}
                <div className="flex-1">
                  <Slider
                    value={[playbackIndex]}
                    min={0}
                    max={Math.max(0, allTimestamps.length - 1)}
                    step={1}
                    onValueChange={([v]) => setPlaybackIndex(v)}
                  />
                </div>

                {/* Speed */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Prędkość:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="h-8 px-2 text-xs bg-muted border-0 rounded"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                  </select>
                </div>

                {/* Current time */}
                <div className="text-xs font-mono text-muted-foreground w-32 text-right">
                  {currentTimestamp ? formatTime(currentTimestamp) : "--:--:--"}
                </div>
              </div>

              {/* Progress info */}
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {allTimestamps[0] ? formatDateTime(allTimestamps[0]) : "---"}
                </span>
                <span>
                  {playbackIndex + 1} / {allTimestamps.length}
                </span>
                <span>
                  {allTimestamps[allTimestamps.length - 1]
                    ? formatDateTime(allTimestamps[allTimestamps.length - 1])
                    : "---"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Track list */}
        <div className="w-72 border-l border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium">Strażacy</h3>
            <p className="text-xs text-muted-foreground">
              Kliknij aby pokazać/ukryć ścieżkę
            </p>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1">
            {tracks.size === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak danych</p>
                <p className="text-xs">Wybierz zakres i kliknij "Załaduj"</p>
              </div>
            )}

            {Array.from(tracks.values()).map((track) => {
              const currentPos = getCurrentPosition(track);
              const pointsOnFloor = track.points.filter(
                (p) => p.floor === currentFloor
              ).length;

              return (
                <button
                  key={track.firefighter.id}
                  onClick={() => toggleTrackVisibility(track.firefighter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                    track.visible
                      ? "bg-muted/50 hover:bg-muted"
                      : "opacity-50 hover:opacity-75"
                  )}
                >
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: track.color }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {track.firefighter.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {track.firefighter.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pointsOnFloor} pkt na tym piętrze
                    </div>
                  </div>

                  {/* Visibility icon */}
                  {track.visible ? (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          {currentTimestamp && (
            <div className="p-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Aktualny czas:</div>
              <div className="text-sm font-mono">{formatDateTime(currentTimestamp)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">Ładowanie danych...</span>
          </div>
        </div>
      )}
    </div>
  );
}
