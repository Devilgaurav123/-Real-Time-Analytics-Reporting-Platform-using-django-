from rest_framework import serializers
from .models import (
    Dashboard,
    DashboardWidget,
    DashboardTemplate,
    ScheduledReport
)


class DashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dashboard
        fields = "__all__"
        read_only_fields = ["organization"]


class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = "__all__"


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardTemplate
        fields = "__all__"


class ScheduledReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = "__all__"   