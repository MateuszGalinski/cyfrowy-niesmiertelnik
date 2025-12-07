# alerts/serializers_alerts.py
from rest_framework import serializers
from app.models.models_alarm import *


class FirefighterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firefighter
        fields = "__all__"


class PositionLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionLite
        fields = "__all__"


class AlertDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertDetails
        fields = "__all__"


class AlertSerializer(serializers.ModelSerializer):
    firefighter = FirefighterSerializer()
    position = PositionLiteSerializer()
    details = AlertDetailsSerializer()

    class Meta:
        model = Alert
        fields = "__all__"
