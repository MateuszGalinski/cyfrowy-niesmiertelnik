import { useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Header } from "./Header";
import { BuildingMap } from "./BuildingMap";
import { FirefighterList } from "./FirefighterList";
import { FirefighterDetails } from "./FirefighterDetails";
import { AlertsPanel } from "./AlertsPanel";

export function Dashboard() {
  const {
    firefightersArray,
    beacons,
    building,
    alerts,
    connected,
    lastUpdate,
    acknowledgeAlert,
  } = useWebSocket();

  const [selectedFirefighterId, setSelectedFirefighterId] = useState<string | null>(null);

  const selectedFirefighter = selectedFirefighterId
    ? firefightersArray.find((f) => f.firefighter.id === selectedFirefighterId)
    : null;

  const handleLocateFirefighter = (firefighterId: string) => {
    setSelectedFirefighterId(firefighterId);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        connected={connected}
        lastUpdate={lastUpdate}
        firefighterCount={firefightersArray.length}
        beaconCount={beacons?.beacons.length || 0}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Firefighter list */}
        <div className="w-80 border-r border-border flex flex-col">
          <FirefighterList
            firefighters={firefightersArray}
            selectedId={selectedFirefighterId}
            onSelect={setSelectedFirefighterId}
          />
        </div>

        {/* Main content - Map */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          <BuildingMap
            firefighters={firefightersArray}
            beacons={beacons}
            building={building}
            selectedFirefighterId={selectedFirefighterId}
            onSelectFirefighter={setSelectedFirefighterId}
          />

          {/* Alerts at bottom */}
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onLocateFirefighter={handleLocateFirefighter}
          />
        </div>

        {/* Right sidebar - Details */}
        {selectedFirefighter && (
          <div className="w-96 border-l border-border">
            <FirefighterDetails
              telemetry={selectedFirefighter}
              alerts={alerts}
              onClose={() => setSelectedFirefighterId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
