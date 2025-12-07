# telemetry/serializers.py
from rest_framework import serializers
from app.models.models_telemetry import *



class FirefighterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firefighter
        fields = "__all__"


class RawPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawPosition
        fields = "__all__"


class TrilaterationSerializer(serializers.ModelSerializer):
    raw_position = RawPositionSerializer()
    filtered_position = RawPositionSerializer()

    class Meta:
        model = Trilateration
        fields = "__all__"


class DriftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drift
        fields = "__all__"


class GPSSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPS
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    trilateration = TrilaterationSerializer()
    drift = DriftSerializer()
    gps = GPSSerializer()

    class Meta:
        model = Position
        fields = "__all__"


class UWBMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UWBMeasurement
        fields = "__all__"


class Vector3Serializer(serializers.ModelSerializer):
    class Meta:
        model = Vector3
        fields = "__all__"


class OrientationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orientation
        fields = "__all__"


class IMUSerializer(serializers.ModelSerializer):
    accel = Vector3Serializer()
    gyro = Vector3Serializer()
    mag = Vector3Serializer()
    orientation = OrientationSerializer()

    class Meta:
        model = IMU
        fields = "__all__"


class PassStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassStatus
        fields = "__all__"


class BarometerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barometer
        fields = "__all__"


class VitalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vitals
        fields = "__all__"


class ScbaAlarmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScbaAlarms
        fields = "__all__"


class SCBASerializer(serializers.ModelSerializer):
    alarms = ScbaAlarmsSerializer()

    class Meta:
        model = SCBA
        fields = "__all__"


class ReccoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recco
        fields = "__all__"


class BlackBoxSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlackBox
        fields = "__all__"


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = "__all__"


class TelemetrySerializer(serializers.ModelSerializer):
    firefighter = FirefighterSerializer()
    position = PositionSerializer()
    uwb_measurements = UWBMeasurementSerializer(many=True)
    imu = IMUSerializer()
    pass_status = PassStatusSerializer()
    barometer = BarometerSerializer()
    vitals = VitalsSerializer()
    scba = SCBASerializer()
    recco = ReccoSerializer()
    black_box = BlackBoxSerializer()
    device = DeviceSerializer()

    class Meta:
        model = Telemetry
        fields = "__all__"
