from django.urls import path
from app.views import telemetry_list, alert_list

urlpatterns = [
    path('telemetry/', telemetry_list, name='telemetry-list'),
    path('alerts/', alert_list, name='alert-list'),
]