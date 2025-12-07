# alerts/models_alerts.py
from django.db import models
from .model_firefighter import Firefighter


class PositionLite(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField(null=True)   # optional in some alerts
    floor = models.IntegerField()

    def __str__(self) -> str:
        return f"x: {self.x:.2f}, y: {self.y:.2f}, z: {self.z:.2f}, floor: {self.floor}"


class AlertDetails(models.Model):
    stationary_duration_s = models.IntegerField()
    last_motion_state = models.CharField(max_length=64)
    last_heart_rate = models.IntegerField()
    

class Alert(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    type = models.CharField(max_length=32)
    timestamp = models.DateTimeField()
    alert_type = models.CharField(max_length=64)
    severity = models.CharField(max_length=32)

    tag_id = models.CharField(max_length=32)

    firefighter = models.ForeignKey(Firefighter, on_delete=models.SET_NULL, null=True)
    position = models.OneToOneField(PositionLite, on_delete=models.SET_NULL, null=True)
    details = models.OneToOneField(AlertDetails, on_delete=models.SET_NULL, null=True)

    resolved = models.BooleanField(default=False)
    acknowledged = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.alert_type} ({self.id})"
