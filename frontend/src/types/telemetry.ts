export interface Position {
  x: number;
  y: number;
  z: number;
  floor: number;
  confidence: number;
  source: string;
  beacons_used: number;
  accuracy_m: number;
  trilateration?: {
    raw_position: { x: number; y: number; z: number };
    filtered_position: { x: number; y: number; z: number };
    residual_error_m: number;
    gdop: number;
    hdop: number;
    vdop: number;
    beacons_used: string[];
    algorithm: string;
    iterations: number;
    convergence: boolean;
  };
  drift?: {
    drift_x_m: number;
    drift_y_m: number;
    drift_z_m: number;
    drift_total_m: number;
    noise_sigma_m: number;
    last_correction: number;
  };
  gps?: {
    lat: number;
    lon: number;
    altitude_m: number;
    accuracy_m: number;
    satellites: number;
    fix: boolean;
  };
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

export interface UWBMeasurement {
  beacon_id: string;
  beacon_name: string;
  range_m: number;
  rssi_dbm: number;
  fp_power_dbm: number;
  rx_power_dbm: number;
  los: boolean;
  nlos_probability: number;
  timestamp: number;
  quality: "excellent" | "good" | "fair" | "poor";
}

export interface IMU {
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  mag: { x: number; y: number; z: number };
  orientation: { roll: number; pitch: number; yaw: number };
  temperature_c: number;
}

export interface PASSStatus {
  status: string;
  time_since_motion_s: number;
  alarm_threshold_s: number;
  pre_alarm_threshold_s: number;
  sensitivity: string;
  alarm_active: boolean;
  alarm_acknowledged: boolean;
}

export interface Barometer {
  pressure_pa: number;
  altitude_rel_m: number;
  temperature_c: number;
  trend: string;
  reference_pressure_pa: number;
  estimated_floor: number;
  floor_confidence_percent: number;
  vertical_speed_mps: number;
}

export interface RECCO {
  id: string;
  type: string;
  location: string;
  detected: boolean;
  last_detected: number | null;
  signal_strength: number | null;
  estimated_distance_m: number | null;
  bearing_deg: number | null;
  detector_id: string;
}

export interface BlackBox {
  recording: boolean;
  storage_used_percent: number;
  records_count: number;
  write_rate_hz: number;
}

export interface TagTelemetry {
  type: "tag_telemetry";
  timestamp: string;
  sequence: number;
  tag_id: string;
  firefighter: Firefighter;
  position: Position;
  heading_deg?: number;
  uwb_measurements?: UWBMeasurement[];
  imu?: IMU;
  pass_status?: PASSStatus;
  barometer?: Barometer;
  vitals: Vitals;
  scba: SCBA;
  recco?: RECCO;
  black_box?: BlackBox;
  environment: Environment;
  device: Device;
}

export interface BeaconDetectedTag {
  tag_id: string;
  firefighter_id: string;
  firefighter_name: string;
  range_m: number;
  rssi_dbm: number;
  signal_quality: string;
  los: boolean;
  nlos_probability: number;
  last_seen: number;
  velocity_mps: number;
  direction_deg: number;
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
  detected_tags?: BeaconDetectedTag[];
  uwb_tx_count?: number;
  uwb_rx_count?: number;
  last_ping_ms?: number;
  error_count?: number;
  firmware_version?: string;
  hardware_version?: string;
  gps?: {
    lat: number;
    lon: number;
    altitude_m: number;
  };
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