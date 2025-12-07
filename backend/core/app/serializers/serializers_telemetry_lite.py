# Create a new file: app/serializers/serializers_telemetry_lite.py

from rest_framework import serializers
from app.models.models_telemetry import Telemetry, Position, Vitals, SCBA, Device, Barometer
from app.models.model_firefighter import Firefighter


class TelemetryLiteSerializer(serializers.Serializer):
    """
    Uproszczony serializer do zapisu danych z WebSocket.
    Tworzy wszystkie potrzebne obiekty automatycznie.
    """
    # Flat fields from websocket
    tag_id = serializers.CharField(max_length=32)
    timestamp = serializers.DateTimeField()
    firefighter_id = serializers.CharField(max_length=32)
    
    # Position
    pos_x = serializers.FloatField()
    pos_y = serializers.FloatField()
    pos_z = serializers.FloatField()
    floor = serializers.IntegerField()
    
    # Vitals
    heart_rate = serializers.IntegerField()
    motion_state = serializers.CharField(max_length=32)
    
    # SCBA
    scba_pressure = serializers.FloatField()
    
    # Device
    battery_level = serializers.IntegerField()
    
    # Environment
    temperature = serializers.FloatField()
    
    # Optional fields
    sequence = serializers.IntegerField(required=False, default=0)
    heading_deg = serializers.FloatField(required=False, default=0.0)

    def create(self, validated_data):
        # 1. Get firefighter
        firefighter = Firefighter.objects.filter(pk=validated_data['firefighter_id']).first()
        
        # 2. Create Position (simplified - without nested trilateration, drift, gps)
        position = Position.objects.create(
            x=validated_data['pos_x'],
            y=validated_data['pos_y'],
            z=validated_data['pos_z'],
            floor=validated_data['floor'],
            confidence=1.0,
            source='websocket',
            beacons_used=0,
            accuracy_m=0.0,
        )
        
        # 3. Create Vitals (simplified)
        vitals = Vitals.objects.create(
            heart_rate_bpm=validated_data['heart_rate'],
            heart_rate_variability_ms=0,
            heart_rate_confidence=100,
            hr_zone='unknown',
            hr_band_id='',
            hr_band_battery=0,
            skin_temperature_c=0.0,
            motion_state=validated_data['motion_state'],
            step_count=0,
            calories_burned=0,
            stress_level='unknown',
            stationary_duration_s=0,
        )
        
        # 4. Create Telemetry record
        telemetry = Telemetry.objects.create(
            type='tag_telemetry',
            timestamp=validated_data['timestamp'],
            sequence=validated_data.get('sequence', 0),
            tag_id=validated_data['tag_id'],
            firefighter=firefighter,
            position=position,
            heading_deg=validated_data.get('heading_deg', 0.0),
            vitals=vitals,
        )
        
        return telemetry


class AlertLiteSerializer(serializers.Serializer):
    """
    Uproszczony serializer do zapisu alertów z WebSocket.
    """
    external_id = serializers.CharField(max_length=64)
    alert_type = serializers.CharField(max_length=64)
    severity = serializers.CharField(max_length=32)
    timestamp = serializers.DateTimeField()
    firefighter_id = serializers.CharField(max_length=32, required=False, allow_null=True)
    tag_id = serializers.CharField(max_length=32, required=False, default='')
    
    # Position (optional)
    pos_x = serializers.FloatField(required=False, allow_null=True)
    pos_y = serializers.FloatField(required=False, allow_null=True)
    pos_z = serializers.FloatField(required=False, allow_null=True)
    floor = serializers.IntegerField(required=False, default=0)
    
    # Details (optional)
    details = serializers.JSONField(required=False, default=dict)
    
    resolved = serializers.BooleanField(default=False)
    acknowledged = serializers.BooleanField(default=False)

    def create(self, validated_data):
        from app.models.models_alarm import Alert, PositionLite, AlertDetails
        
        # 1. Get firefighter
        firefighter = None
        if validated_data.get('firefighter_id'):
            firefighter = Firefighter.objects.filter(pk=validated_data['firefighter_id']).first()
        
        # 2. Create Position if coordinates provided
        position = None
        if validated_data.get('pos_x') is not None:
            position = PositionLite.objects.create(
                x=validated_data['pos_x'],
                y=validated_data['pos_y'],
                z=validated_data.get('pos_z'),
                floor=validated_data.get('floor', 0),
            )
        
        # 3. Create AlertDetails if provided
        details_obj = None
        details_data = validated_data.get('details', {})
        if details_data:
            details_obj = AlertDetails.objects.create(
                stationary_duration_s=details_data.get('stationary_duration_s', 0),
                last_motion_state=details_data.get('last_motion_state', ''),
                last_heart_rate=details_data.get('last_heart_rate', 0),
            )
        
        # 4. Create Alert
        alert = Alert.objects.create(
            id=validated_data['external_id'],
            type='alert',
            timestamp=validated_data['timestamp'],
            alert_type=validated_data['alert_type'],
            severity=validated_data['severity'],
            tag_id=validated_data.get('tag_id', ''),
            firefighter=firefighter,
            position=position,
            details=details_obj,
            resolved=validated_data.get('resolved', False),
            acknowledged=validated_data.get('acknowledged', False),
        )
        
        return alert