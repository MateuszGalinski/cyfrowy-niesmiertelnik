# telemetry/models.py
from django.db import models
from .model_firefighter import Firefighter


# ---- Position Submodels -----------------------------------------------------

class RawPosition(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()

    def __str__(self) -> str:
        return f"x: {self.x}, y: {self.y}, z: {self.z}"


class Trilateration(models.Model):
    raw_position = models.OneToOneField(RawPosition, on_delete=models.CASCADE, related_name="raw_of")
    filtered_position = models.OneToOneField(RawPosition, on_delete=models.CASCADE, related_name="filtered_of")
    residual_error_m = models.FloatField()
    gdop = models.FloatField()
    hdop = models.FloatField()
    vdop = models.FloatField()
    beacons_used = models.JSONField()
    algorithm = models.CharField(max_length=64)
    iterations = models.IntegerField()
    convergence = models.BooleanField()


class Drift(models.Model):
    drift_x_m = models.FloatField()
    drift_y_m = models.FloatField()
    drift_z_m = models.FloatField()
    drift_total_m = models.FloatField()
    noise_sigma_m = models.FloatField()
    last_correction = models.BigIntegerField()


class GPS(models.Model):
    lat = models.FloatField()
    lon = models.FloatField()
    altitude_m = models.FloatField()
    accuracy_m = models.FloatField()
    satellites = models.IntegerField()
    fix = models.BooleanField()


class Position(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    floor = models.IntegerField()
    confidence = models.FloatField()
    source = models.CharField(max_length=64)
    beacons_used = models.IntegerField()
    accuracy_m = models.FloatField()

    trilateration = models.OneToOneField(Trilateration, on_delete=models.SET_NULL, null=True)
    drift = models.OneToOneField(Drift, on_delete=models.SET_NULL, null=True)
    gps = models.OneToOneField(GPS, on_delete=models.SET_NULL, null=True)

    def __str__(self) -> str:
        return f"({self.x:.2f}, {self.y:.2f}, {self.z:.2f}) Floor: {self.floor}"


# ---- UWB Measurements -------------------------------------------------------

class UWBMeasurement(models.Model):
    beacon_id = models.CharField(max_length=32)
    beacon_name = models.CharField(max_length=128)
    range_m = models.FloatField()
    rssi_dbm = models.IntegerField()
    fp_power_dbm = models.IntegerField()
    rx_power_dbm = models.IntegerField()
    los = models.BooleanField()
    nlos_probability = models.FloatField()
    timestamp = models.BigIntegerField()
    quality = models.CharField(max_length=32)


# ---- IMU --------------------------------------------------------------------

class Vector3(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()


class Orientation(models.Model):
    roll = models.FloatField()
    pitch = models.FloatField()
    yaw = models.FloatField()


class IMU(models.Model):
    accel = models.OneToOneField(Vector3, on_delete=models.CASCADE, related_name="accel_of")
    gyro = models.OneToOneField(Vector3, on_delete=models.CASCADE, related_name="gyro_of")
    mag = models.OneToOneField(Vector3, on_delete=models.CASCADE, related_name="mag_of")
    orientation = models.OneToOneField(Orientation, on_delete=models.CASCADE)
    temperature_c = models.FloatField()


# ---- PASS Status ------------------------------------------------------------

class PassStatus(models.Model):
    status = models.CharField(max_length=32)
    time_since_motion_s = models.IntegerField()
    alarm_threshold_s = models.IntegerField()
    pre_alarm_threshold_s = models.IntegerField()
    sensitivity = models.CharField(max_length=32)
    alarm_active = models.BooleanField()
    alarm_acknowledged = models.BooleanField()


# ---- Barometer --------------------------------------------------------------

class Barometer(models.Model):
    pressure_pa = models.IntegerField()
    altitude_rel_m = models.FloatField()
    temperature_c = models.FloatField()
    trend = models.CharField(max_length=32)
    reference_pressure_pa = models.IntegerField()
    estimated_floor = models.IntegerField()
    floor_confidence_percent = models.IntegerField()
    vertical_speed_mps = models.FloatField()


# ---- Vitals -----------------------------------------------------------------

class Vitals(models.Model):
    heart_rate_bpm = models.IntegerField()
    heart_rate_variability_ms = models.IntegerField()
    heart_rate_confidence = models.IntegerField()
    hr_zone = models.CharField(max_length=32)
    hr_band_id = models.CharField(max_length=32)
    hr_band_battery = models.IntegerField()
    skin_temperature_c = models.FloatField()
    motion_state = models.CharField(max_length=32)
    step_count = models.IntegerField()
    calories_burned = models.IntegerField()
    stress_level = models.CharField(max_length=32)
    stationary_duration_s = models.IntegerField()


# ---- SCBA -------------------------------------------------------------------

class ScbaAlarms(models.Model):
    low_pressure = models.BooleanField()
    very_low_pressure = models.BooleanField()
    motion = models.BooleanField()


class SCBA(models.Model):
    id = models.CharField(primary_key=True, max_length=32)
    manufacturer = models.CharField(max_length=64)
    model = models.CharField(max_length=64)
    cylinder_pressure_bar = models.IntegerField()
    max_pressure_bar = models.IntegerField()
    consumption_rate_lpm = models.IntegerField()
    remaining_time_min = models.IntegerField()
    alarms = models.OneToOneField(ScbaAlarms, on_delete=models.CASCADE)
    battery_percent = models.IntegerField()
    connection_status = models.CharField(max_length=32)


# ---- RECCO ------------------------------------------------------------------

class Recco(models.Model):
    id = models.CharField(primary_key=True, max_length=32)
    type = models.CharField(max_length=32)
    location = models.CharField(max_length=128)
    detected = models.BooleanField()
    last_detected = models.BigIntegerField(null=True)
    signal_strength = models.FloatField(null=True)
    estimated_distance_m = models.FloatField(null=True)
    bearing_deg = models.FloatField(null=True)
    detector_id = models.CharField(max_length=32)


# ---- Black Box --------------------------------------------------------------

class BlackBox(models.Model):
    recording = models.BooleanField()
    storage_used_percent = models.IntegerField()
    records_count = models.IntegerField()
    write_rate_hz = models.IntegerField()


# ---- Device -----------------------------------------------------------------

class Device(models.Model):
    tag_id = models.CharField(max_length=32)
    firmware_version = models.CharField(max_length=32)
    hardware_version = models.CharField(max_length=32)
    battery_percent = models.IntegerField()
    battery_voltage_mv = models.IntegerField()
    battery_charging = models.BooleanField()
    battery_temperature_c = models.FloatField()
    connection_primary = models.CharField(max_length=32)
    connection_backup = models.CharField(max_length=32)
    lora_rssi_dbm = models.IntegerField()
    lora_snr_db = models.FloatField()
    lte_rssi_dbm = models.IntegerField()
    lte_operator = models.CharField(max_length=32)
    uptime_s = models.IntegerField()
    last_sync_cloud = models.BigIntegerField()
    sos_button_pressed = models.BooleanField()


# ---- Main Telemetry Record --------------------------------------------------

class Telemetry(models.Model):
    type = models.CharField(max_length=64)
    timestamp = models.DateTimeField()
    sequence = models.IntegerField()
    tag_id = models.CharField(max_length=32)

    firefighter = models.ForeignKey(Firefighter, on_delete=models.SET_NULL, null=True)
    position = models.OneToOneField(Position, on_delete=models.SET_NULL, null=True)
    heading_deg = models.FloatField()

    uwb_measurements = models.ManyToManyField(UWBMeasurement)

    imu = models.OneToOneField(IMU, on_delete=models.SET_NULL, null=True)
    pass_status = models.OneToOneField(PassStatus, on_delete=models.SET_NULL, null=True)
    barometer = models.OneToOneField(Barometer, on_delete=models.SET_NULL, null=True)
    vitals = models.OneToOneField(Vitals, on_delete=models.SET_NULL, null=True)
    scba = models.OneToOneField(SCBA, on_delete=models.SET_NULL, null=True)
    recco = models.OneToOneField(Recco, on_delete=models.SET_NULL, null=True)
    black_box = models.OneToOneField(BlackBox, on_delete=models.SET_NULL, null=True)
    device = models.OneToOneField(Device, on_delete=models.SET_NULL, null=True)
