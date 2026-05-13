from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from .models import (
    AlertRule,
    AlertHistory,
    InAppNotification
)

from .serializers import (
    AlertRuleSerializer,
    AlertHistorySerializer,
    NotificationSerializer
)


class CreateAlertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = UserRole.objects.get(
            user=request.user
        )

        serializer = AlertRuleSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(
                organization=role.organization
            )
            return Response(serializer.data)

        return Response(serializer.errors)


class AlertListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = UserRole.objects.get(
            user=request.user
        )

        alerts = AlertRule.objects.filter(
            organization=role.organization
        )

        serializer = AlertRuleSerializer(
            alerts,
            many=True
        )

        return Response(serializer.data)


class AlertHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = UserRole.objects.get(
            user=request.user
        )

        history = AlertHistory.objects.filter(
            alert__organization=role.organization
        )

        serializer = AlertHistorySerializer(
            history,
            many=True
        )

        return Response(serializer.data)


class MuteAlertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id):
        alert = AlertRule.objects.get(
            id=alert_id
        )

        alert.status = "muted"
        alert.save()

        return Response({
            "message": "Alert muted"
        })


class SnoozeAlertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id):
        alert = AlertRule.objects.get(
            id=alert_id
        )

        alert.snooze_until = (
            timezone.now() + timedelta(minutes=30)
        )

        alert.save()

        return Response({
            "message": "Alert snoozed for 30 mins"
        })


# NEW → Notification list
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = UserRole.objects.get(
            user=request.user
        )

        notifications = InAppNotification.objects.filter(
            organization=role.organization
        )

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        return Response(serializer.data)


# NEW → Mark notification as read
class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notification = InAppNotification.objects.get(
            id=notification_id
        )

        notification.is_read = True
        notification.save()

        return Response({
            "message": "Notification marked as read"
        })