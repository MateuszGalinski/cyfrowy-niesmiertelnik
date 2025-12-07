import { useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Header } from "./Header";
import { BuildingMap } from "./BuildingMap";
import { FirefighterList } from "./FirefighterList";
import { FirefighterDetails } from "./FirefighterDetails";
import { BeaconDetails } from "./BeaconDetails";
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
  const [selectedBeaconId, setSelectedBeaconId] = useState<string | null>(null);
  const [targetFloor, setTargetFloor] = useState<number | null>(null);

  const selectedFirefighter = selectedFirefighterId
    ? firefightersArray.find((f) => f.firefighter.id === selectedFirefighterId)
    : null;

  const selectedBeacon = selectedBeaconId
    ? beacons?.beacons.find((b) => b.id === selectedBeaconId)
    : null;

  const handleLocateFirefighter = (firefighterId: string) => {
    setSelectedBeaconId(null);
    setSelectedFirefighterId(firefighterId);
    
    const firefighter = firefightersArray.find((f) => f.firefighter.id === firefighterId);
    if (firefighter) {
      setTargetFloor(firefighter.position.floor);
    }
  };

  const handleSelectFirefighter = (id: string | null) => {
    if (id) {
      setSelectedBeaconId(null);
    }
    setSelectedFirefighterId(id);
  };

  const handleSelectBeacon = (id: string | null) => {
    if (id) {
      setSelectedFirefighterId(null);
    }
    setSelectedBeaconId(id);
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
            onSelect={handleSelectFirefighter}
          />
        </div>

        {/* Main content - Map */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          <BuildingMap
            firefighters={firefightersArray}
            beacons={beacons}
            building={building}
            selectedFirefighterId={selectedFirefighterId}
            onSelectFirefighter={handleSelectFirefighter}
            selectedBeaconId={selectedBeaconId}
            onSelectBeacon={handleSelectBeacon}
            targetFloor={targetFloor}
            onFloorChange={() => setTargetFloor(null)}
          />

          {/* Alerts at bottom */}
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onLocateFirefighter={handleLocateFirefighter}
          />
        </div>

        {/* Right sidebar - Details (Firefighter or Beacon) */}
        {selectedFirefighter && (
          <div className="w-96 border-l border-border">
            <FirefighterDetails
              telemetry={selectedFirefighter}
              alerts={alerts}
              onClose={() => setSelectedFirefighterId(null)}
            />
          </div>
        )}

        {selectedBeacon && (
          <div className="w-96 border-l border-border">
            <BeaconDetails
              beacon={selectedBeacon}
              firefighters={firefightersArray}
              onClose={() => setSelectedBeaconId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}