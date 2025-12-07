import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { TagTelemetry, BeaconsStatus, BuildingConfig, Beacon } from "@/types/telemetry";

// Stałe
const BEACON_RANGE_M = 15;
const FLOOR_HEIGHT = 3.2; // wysokość piętra w metrach
const FLOOR_THICKNESS = 0.1;

interface BuildingMap3DProps {
  firefighters: TagTelemetry[];
  beacons: BeaconsStatus | null;
  building: BuildingConfig | null;
  selectedFirefighterId: string | null;
  onSelectFirefighter: (id: string | null) => void;
  selectedBeaconId: string | null;
  onSelectBeacon: (id: string | null) => void;
  showBeaconRanges?: boolean;
  showBeaconLabels?: boolean;
}

// Komponent piętra budynku
function FloorPlane({ 
  floor, 
  dimensions, 
  isCurrentFloor 
}: { 
  floor: { number: number; name: string; height_m: number }; 
  dimensions: { width_m: number; depth_m: number };
  isCurrentFloor: boolean;
}) {
  const y = floor.height_m;
  
  return (
    <group position={[dimensions.width_m / 2, y, dimensions.depth_m / 2]}>
      {/* Podłoga */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions.width_m, dimensions.depth_m]} />
        <meshStandardMaterial 
          color={isCurrentFloor ? "#3b82f6" : "#64748b"} 
          transparent 
          opacity={isCurrentFloor ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Krawędzie podłogi */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(dimensions.width_m, dimensions.depth_m)]} />
        <lineBasicMaterial color={isCurrentFloor ? "#3b82f6" : "#475569"} />
      </lineSegments>
      
      {/* Etykieta piętra */}
      <Text
        position={[-dimensions.width_m / 2 - 1, 0.5, 0]}
        fontSize={1}
        color={isCurrentFloor ? "#3b82f6" : "#64748b"}
        anchorX="right"
      >
        {floor.name}
      </Text>
    </group>
  );
}

// Komponent markera strażaka
function FirefighterMarker3D({
  telemetry,
  selected,
  onClick,
}: {
  telemetry: TagTelemetry;
  selected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { position, vitals, device, firefighter } = telemetry;
  
  // Animacja pulsowania dla wybranego
  useFrame((state) => {
    if (meshRef.current && selected) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  // Określ kolor na podstawie statusu
  const isManDown = vitals.stationary_duration_s >= 30;
  const isSOS = device.sos_button_pressed;
  const isHighHR = vitals.heart_rate_bpm > 160;
  
  let color = "#3b82f6"; // primary
  if (isManDown || isSOS) color = "#ef4444"; // destructive
  else if (isHighHR) color = "#f59e0b"; // warning

  const y = position.floor * FLOOR_HEIGHT + 0.5;

  return (
    <group position={[position.x, y, position.y]}>
      {/* Główny marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={selected ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Linia do podłogi */}
      <Line
        points={[[0, 0, 0], [0, -0.5, 0]]}
        color={color}
        lineWidth={2}
      />
      
      {/* Etykieta */}
      {selected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-background/90 border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
            <div className="font-medium">{firefighter.name}</div>
            <div className="text-muted-foreground">
              HR: {vitals.heart_rate_bpm} bpm
            </div>
          </div>
        </Html>
      )}
      
      {/* Alert pulse */}
      {(isManDown || isSOS) && (
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial 
            color="#ef4444" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// Komponent markera beacona
function BeaconMarker3D({
  beacon,
  selected,
  onClick,
  showRange,
  showLabel,
}: {
  beacon: Beacon;
  selected: boolean;
  onClick: () => void;
  showRange: boolean;
  showLabel: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rangeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (rangeRef.current && showRange) {
      rangeRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  const y = beacon.floor * FLOOR_HEIGHT + 0.3;
  const isActive = beacon.status === "active";
  
  const color = isActive ? "#22c55e" : beacon.status === "inactive" ? "#f59e0b" : "#64748b";

  return (
    <group position={[beacon.position.x, y, beacon.position.y]}>
      {/* Zasięg beacona */}
      {showRange && isActive && (
        <mesh ref={rangeRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BEACON_RANGE_M - 0.2, BEACON_RANGE_M, 64]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            transparent 
            opacity={selected ? 0.3 : 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Główny marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Etykieta */}
      {(showLabel || selected) && (
        <Html position={[0, 1, 0]} center>
          <div className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
            selected 
              ? "bg-primary text-primary-foreground" 
              : "bg-background/80 text-muted-foreground"
          }`}>
            {beacon.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// Komponent ścian budynku
function BuildingWalls({ 
  dimensions,
  floors,
}: { 
  dimensions: { width_m: number; depth_m: number };
  floors: Array<{ number: number; height_m: number }>;
}) {
  const minY = Math.min(...floors.map(f => f.height_m));
  const maxY = Math.max(...floors.map(f => f.height_m)) + FLOOR_HEIGHT;
  const height = maxY - minY;
  const centerY = minY + height / 2;

  const wallOpacity = 0.05;
  const edgeColor = "#475569";

  return (
    <group position={[dimensions.width_m / 2, centerY, dimensions.depth_m / 2]}>
      {/* Ściany */}
      {/* Przednia */}
      <mesh position={[0, 0, dimensions.depth_m / 2]}>
        <planeGeometry args={[dimensions.width_m, height]} />
        <meshStandardMaterial color="#64748b" transparent opacity={wallOpacity} side={THREE.DoubleSide} />
      </mesh>
      {/* Tylna */}
      <mesh position={[0, 0, -dimensions.depth_m / 2]}>
        <planeGeometry args={[dimensions.width_m, height]} />
        <meshStandardMaterial color="#64748b" transparent opacity={wallOpacity} side={THREE.DoubleSide} />
      </mesh>
      {/* Lewa */}
      <mesh position={[-dimensions.width_m / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[dimensions.depth_m, height]} />
        <meshStandardMaterial color="#64748b" transparent opacity={wallOpacity} side={THREE.DoubleSide} />
      </mesh>
      {/* Prawa */}
      <mesh position={[dimensions.width_m / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[dimensions.depth_m, height]} />
        <meshStandardMaterial color="#64748b" transparent opacity={wallOpacity} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Krawędzie budynku */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(dimensions.width_m, height, dimensions.depth_m)]} />
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}

// Komponent siatki podłogi
function GroundGrid({ dimensions }: { dimensions: { width_m: number; depth_m: number } }) {
  return (
    <gridHelper 
      args={[Math.max(dimensions.width_m, dimensions.depth_m) * 1.5, 20, "#334155", "#1e293b"]} 
      position={[dimensions.width_m / 2, -3.5, dimensions.depth_m / 2]}
    />
  );
}

// Kontroler kamery
function CameraController({ dimensions }: { dimensions: { width_m: number; depth_m: number } }) {
  const { camera } = useThree();
  
  // Ustaw początkową pozycję kamery
  useMemo(() => {
    camera.position.set(
      dimensions.width_m * 1.5,
      dimensions.depth_m,
      dimensions.depth_m * 1.5
    );
    camera.lookAt(dimensions.width_m / 2, 0, dimensions.depth_m / 2);
  }, [camera, dimensions]);

  return (
    <OrbitControls 
      target={[dimensions.width_m / 2, 0, dimensions.depth_m / 2]}
      minDistance={10}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2 - 0.1}
    />
  );
}

// Główna scena
function Scene({
  firefighters,
  beacons,
  building,
  selectedFirefighterId,
  onSelectFirefighter,
  selectedBeaconId,
  onSelectBeacon,
  showBeaconRanges,
  showBeaconLabels,
  currentFloor,
}: BuildingMap3DProps & { currentFloor: number }) {
  const dimensions = building?.building.dimensions || { width_m: 40, depth_m: 25 };
  const floors = building?.building.floors || [
    { number: -1, name: "Piwnica", height_m: -3.0, hazard_level: "high" },
    { number: 0, name: "Parter", height_m: 0, hazard_level: "medium" },
    { number: 1, name: "1. piętro", height_m: 3.2, hazard_level: "low" },
    { number: 2, name: "2. piętro", height_m: 6.4, hazard_level: "low" },
  ];

  return (
    <>
      {/* Oświetlenie */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 50, 50]} intensity={0.8} />
      <directionalLight position={[-50, 50, -50]} intensity={0.4} />
      
      {/* Kontroler kamery */}
      <CameraController dimensions={dimensions} />
      
      {/* Siatka */}
      <GroundGrid dimensions={dimensions} />
      
      {/* Ściany budynku */}
      <BuildingWalls dimensions={dimensions} floors={floors} />
      
      {/* Piętra */}
      {floors.map((floor) => (
        <FloorPlane
          key={floor.number}
          floor={floor}
          dimensions={dimensions}
          isCurrentFloor={floor.number === currentFloor}
        />
      ))}
      
      {/* Beacony */}
      {beacons?.beacons.map((beacon) => (
        <BeaconMarker3D
          key={beacon.id}
          beacon={beacon}
          selected={selectedBeaconId === beacon.id}
          onClick={() => onSelectBeacon(beacon.id)}
          showRange={showBeaconRanges ?? true}
          showLabel={showBeaconLabels ?? false}
        />
      ))}
      
      {/* Strażacy */}
      {firefighters.map((ff) => (
        <FirefighterMarker3D
          key={ff.firefighter.id}
          telemetry={ff}
          selected={selectedFirefighterId === ff.firefighter.id}
          onClick={() => onSelectFirefighter(ff.firefighter.id)}
        />
      ))}
    </>
  );
}

// Główny eksportowany komponent
export function BuildingMap3D(props: BuildingMap3DProps) {
  const [currentFloor, setCurrentFloor] = useState(0);
  
  const floors = props.building?.building.floors || [
    { number: -1, name: "Piwnica", height_m: -3.0 },
    { number: 0, name: "Parter", height_m: 0 },
    { number: 1, name: "1. piętro", height_m: 3.2 },
    { number: 2, name: "2. piętro", height_m: 6.4 },
  ];

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden">
      {/* Floor selector overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur rounded-md p-1">
        {floors.map((floor) => (
          <button
            key={floor.number}
            onClick={() => setCurrentFloor(floor.number)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              currentFloor === floor.number
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {floor.number === 0 ? "P" : floor.number}
          </button>
        ))}
      </div>
      
      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/80 backdrop-blur rounded-md px-2 py-1 text-xs text-muted-foreground">
        Przeciągnij aby obracać • Scroll aby przybliżać
      </div>
      
      {/* Stats overlay */}
      <div className="absolute bottom-3 right-3 z-10 bg-background/80 backdrop-blur rounded-md px-2 py-1 text-xs">
        <span className="text-muted-foreground">Strażacy: </span>
        <span className="font-mono">{props.firefighters.length}</span>
        <span className="text-muted-foreground ml-2">Beacony: </span>
        <span className="font-mono">{props.beacons?.beacons.length || 0}</span>
      </div>
      
      {/* Canvas Three.js */}
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 1000 }}
        onPointerMissed={() => {
          props.onSelectFirefighter(null);
          props.onSelectBeacon(null);
        }}
      >
        <Scene {...props} currentFloor={currentFloor} />
      </Canvas>
    </div>
  );
}
