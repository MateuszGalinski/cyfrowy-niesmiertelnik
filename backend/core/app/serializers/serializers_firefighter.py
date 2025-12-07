from rest_framework import serializers
from app.models.model_firefighter import Firefighter


class FirefighterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firefighter
        fields = "__all__"
