from django.contrib import admin
from app.models.models_alarm import Alert
from app.models.models_telemetry import Telemetry
from app.models.model_firefighter import Firefighter


@admin.register(Telemetry)
class TelemetryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "type",
        "timestamp",
        "sequence",
        "tag_id",
        "firefighter",
        "heading_deg",
        "position"
    )
    list_filter = ("type", "firefighter", "timestamp")
    search_fields = ("tag_id", "firefighter__name")
    ordering = ("-timestamp",)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "alert_type",
        "severity",
        "timestamp",
        "tag_id",
        "firefighter",
        "resolved",
        "acknowledged",
        "position"
    )
    list_filter = ("severity", "alert_type", "resolved", "acknowledged")
    search_fields = ("id", "tag_id", "alert_type", "firefighter__name")
    ordering = ("-timestamp",)

@admin.register(Firefighter)
class FirefighterAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
