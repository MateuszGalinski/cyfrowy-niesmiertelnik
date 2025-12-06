import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { VitalsPanel } from "./VitalsPanel";
import type { TagTelemetry } from "@/types/telemetry";
import { Search, User, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FirefighterListProps {
  firefighters: TagTelemetry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FirefighterList({ firefighters, selectedId, onSelect }: FirefighterListProps) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatus = (telemetry: TagTelemetry): "ok" | "warning" | "critical" => {
    const { vitals, device } = telemetry;
    if (vitals.stationary_duration_s > 30) return "critical";
    if (vitals.heart_rate_bpm > 180 || device.battery_percent < 20) return "warning";
    return "ok";
  };

  const teams = [...new Set(firefighters.map((f) => f.firefighter.team))];

  const filteredFirefighters = firefighters.filter((ff) => {
    const matchesSearch =
      ff.firefighter.name.toLowerCase().includes(search.toLowerCase()) ||
      ff.firefighter.id.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = teamFilter === "all" || ff.firefighter.team === teamFilter;
    const matchesStatus = statusFilter === "all" || getStatus(ff) === statusFilter;
    return matchesSearch && matchesTeam && matchesStatus;
  });

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Strażacy</h2>
          <span className="text-xs text-muted-foreground">({firefighters.length})</span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 text-xs bg-muted border-0"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-7 text-xs flex-1 bg-muted border-0">
              <SelectValue placeholder="Zespół" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie zespoły</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs flex-1 bg-muted border-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="warning">Ostrzeżenie</SelectItem>
              <SelectItem value="critical">Krytyczny</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFirefighters.map((ff) => (
          <FirefighterListItem
            key={ff.firefighter.id}
            telemetry={ff}
            selected={selectedId === ff.firefighter.id}
            onClick={() => onSelect(ff.firefighter.id)}
            status={getStatus(ff)}
          />
        ))}

        {filteredFirefighters.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Brak wyników
          </div>
        )}
      </div>
    </div>
  );
}

interface FirefighterListItemProps {
  telemetry: TagTelemetry;
  selected: boolean;
  onClick: () => void;
  status: "ok" | "warning" | "critical";
}

function FirefighterListItem({ telemetry, selected, onClick, status }: FirefighterListItemProps) {
  const { firefighter, position, device } = telemetry;

  const statusLabels = {
    ok: "Aktywny",
    warning: "Uwaga",
    critical: "Krytyczny",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50",
        selected && "bg-primary/10 border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{firefighter.name}</span>
            <StatusBadge status={status} label={statusLabels[status]} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {firefighter.rank} • {firefighter.role}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="font-mono">P{position.floor}</span>
          </div>
        </div>
      </div>

      <VitalsPanel telemetry={telemetry} compact />

      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>ID: {firefighter.id}</span>
        <span>Zespół: {firefighter.team}</span>
      </div>
    </div>
  );
}
