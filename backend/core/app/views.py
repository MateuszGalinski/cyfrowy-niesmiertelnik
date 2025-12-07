# app/views.py
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from app.models.models_telemetry import Telemetry
from app.models.models_alarm import Alert
from app.serializers.serializers_telemetry import TelemetrySerializer
from app.serializers.serializers_alarm import AlertSerializer

@api_view(['GET'])
def telemetry_list(request):
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')
    firefighter = request.GET.get('firefighter')

    queryset = Telemetry.objects.all()

    if start_time:
        start_dt = parse_datetime(start_time)
        if start_dt:
            queryset = queryset.filter(timestamp__gte=start_dt)
    if end_time:
        end_dt = parse_datetime(end_time)
        if end_dt:
            queryset = queryset.filter(timestamp__lte=end_dt)
    if firefighter:
        queryset = queryset.filter(
            Q(firefighter__name__icontains=firefighter) |
            Q(tag_id__icontains=firefighter)
        )

    serializer = TelemetrySerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def alert_list(request):
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')
    firefighter = request.GET.get('firefighter')

    queryset = Alert.objects.all()

    if start_time:
        start_dt = parse_datetime(start_time)
        if start_dt:
            queryset = queryset.filter(timestamp__gte=start_dt)
    if end_time:
        end_dt = parse_datetime(end_time)
        if end_dt:
            queryset = queryset.filter(timestamp__lte=end_dt)
    if firefighter:
        queryset = queryset.filter(
            Q(firefighter__name__icontains=firefighter) |
            Q(tag_id__icontains=firefighter)
        )

    serializer = AlertSerializer(queryset, many=True)
    return Response(serializer.data)
