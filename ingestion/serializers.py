from rest_framework import serializers
from .models import Event, APIKey


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ['organization']


class BatchEventSerializer(serializers.Serializer):
    events = EventSerializer(many=True)


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = "__all__"
        read_only_fields = ['organization']