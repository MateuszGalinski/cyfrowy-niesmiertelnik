import { cn } from "@/lib/utils";
import { Flame, Wifi, WifiOff, Clock, Radio } from "lucide-react";
import { NavMenu } from "../nav/NavMenu";

interface HeaderProps {
  connected: boolean;
  lastUpdate: Date | null;
  firefighterCount: number;
  beaconCount: number;
}

export function Header({ connected, lastUpdate, firefighterCount, beaconCount }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <NavMenu/>
        <div>
          <h1 className="text-base font-bold tracking-tight">Cyfrowy Nieśmiertelnik</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            System lokalizacji PSP
          </p>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-6">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium">Połączono</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-destructive animate-pulse" />
              <span className="text-xs text-destructive font-medium">Rozłączono</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Strażacy:</span>
            <span className="font-mono font-semibold">{firefighterCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Beacony:</span>
            <span className="font-mono font-semibold">{beaconCount}</span>
          </div>
        </div>

        {/* Last update */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            Ostatnia aktualizacja:{" "}
            <span className="font-mono">
              {lastUpdate ? lastUpdate.toLocaleTimeString("pl-PL") : "--:--:--"}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
