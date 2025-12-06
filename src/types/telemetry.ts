export interface Position {
  x: number;
  y: number;
  z: number;
  floor: number;
  confidence: number;
  source: string;
  beacons_used: number;
  accuracy_m: number;
}

export interface Vitals {
  heart_rate_bpm: number;
  heart_rate_variability_ms: number;
  heart_rate_confidence: number;
  hr_zone: string;
  hr_band_id: string;
  hr_band_battery: number;
  skin_temperature_c: number;
  motion_state: string;
  step_count: number;
  calories_burned: number;
  stress_level: string;
  stationary_duration_s: number;
}

export interface SCBA {
  id: string;
  manufacturer: string;
  model: string;
  cylinder_pressure_bar: number;
  max_pressure_bar: number;
  consumption_rate_lpm: number;
  remaining_time_min: number;
  alarms: {
    low_pressure: boolean;
    very_low_pressure: boolean;
    motion: boolean;
  };
  battery_percent: number;
  connection_status: string;
}

export interface Environment {
  co_ppm: number;
  co_alarm: boolean;
  co2_ppm: number;
  co2_alarm: boolean;
  o2_percent: number;
  o2_alarm: boolean;
  lel_percent: number;
  lel_alarm: boolean;
  temperature_c: number;
  temperature_alarm: boolean;
  humidity_percent: number;
  sensor_status: string;
}

export interface Device {
  tag_id: string;
  firmware_version: string;
  hardware_version: string;
  battery_percent: number;
  battery_voltage_mv: number;
  battery_charging: boolean;
  battery_temperature_c: number;
  connection_primary: string;
  connection_backup: string;
  lora_rssi_dbm: number;
  lora_snr_db: number;
  lte_rssi_dbm: number;
  lte_operator: string;
  uptime_s: number;
  sos_button_pressed: boolean;
}

export interface Firefighter {
  id: string;
  name: string;
  rank: string;
  role: string;
  team: string;
}

export interface TagTelemetry {
  type: "tag_telemetry";
  timestamp: string;
  sequence: number;
  tag_id: string;
  firefighter: Firefighter;
  position: Position;
  vitals: Vitals;
  scba: SCBA;
  environment: Environment;
  device: Device;
}

export interface Beacon {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  floor: number;
  type: string;
  status: "active" | "inactive" | "offline";
  battery_percent: number;
  battery_voltage_mv: number;
  temperature_c: number;
  signal_quality: string;
  tags_in_range: string[];
}

export interface BeaconsStatus {
  type: "beacons_status";
  timestamp: string;
  beacons: Beacon[];
}

export interface Floor {
  number: number;
  name: string;
  height_m: number;
  hazard_level: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  type: string;
  dimensions: { width_m: number; depth_m: number; height_m: number };
  floors: Floor[];
  entry_points: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    floor: number;
  }>;
  hazard_zones: Array<{
    id: string;
    name: string;
    floor: number;
    type: string;
  }>;
}

export interface BuildingConfig {
  type: "building_config";
  timestamp: string;
  building: Building;
}

export interface Alert {
  id: string;
  type: "alert";
  timestamp: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  tag_id: string;
  firefighter: Firefighter;
  position: Position;
  details: Record<string, unknown>;
  resolved: boolean;
  acknowledged: boolean;
}

export type WebSocketMessage = TagTelemetry | BeaconsStatus | BuildingConfig | Alert;
