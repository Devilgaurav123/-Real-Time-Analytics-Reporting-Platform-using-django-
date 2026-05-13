from rest_framework import serializers
from .models import (
    AlertRule,
    AlertHistory,
    InAppNotification
)


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = "__all__"


class AlertHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertHistory
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InAppNotification
        fields = "__all__"