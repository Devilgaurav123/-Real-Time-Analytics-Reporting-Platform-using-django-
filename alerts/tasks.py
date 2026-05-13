import requests

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    AlertRule,
    AlertHistory,
    InAppNotification
)

from ingestion.models import Event


@shared_task
def evaluate_alerts():
    alerts = AlertRule.objects.filter(
        status="active"
    )

    for alert in alerts:

        # Skip snoozed alerts
        if (
            alert.snooze_until and
            alert.snooze_until > timezone.now()
        ):
            continue

        # Get related events
        events = Event.objects.filter(
            organization=alert.organization,
            event_name=alert.metric_name
        )

        total_value = sum(
            event.event_value
            for event in events
        )

        triggered = False

        # Greater than condition
        if alert.condition == "gt":
            if total_value > alert.threshold_value:
                triggered = True

        # Less than condition
        elif alert.condition == "lt":
            if total_value < alert.threshold_value:
                triggered = True

        if triggered:
            alert.status = "triggered"
            alert.save()

            message = (
                f"{alert.metric_name} crossed threshold"
            )

            # Save alert history
            AlertHistory.objects.create(
                alert=alert,
                triggered_value=total_value,
                message=message
            )

            # Email notification
            if alert.email:
                send_mail(
                    subject="Alert Triggered",
                    message=message,
                    from_email="admin@example.com",
                    recipient_list=[alert.email],
                    fail_silently=True
                )

            # Webhook notification
            if alert.webhook_url:
                try:
                    requests.post(
                        alert.webhook_url,
                        json={
                            "message": message,
                            "value": total_value
                        }
                    )
                except Exception:
                    pass

            # In-app notification
            InAppNotification.objects.create(
                organization=alert.organization,
                title="Alert Triggered",
                message=message
            )

            # NEW → Real-time WebSocket notification
            channel_layer = get_channel_layer()

            async_to_sync(
                channel_layer.group_send
            )(
                f"alerts_{alert.organization.id}",
                {
                    "type": "alert_message",
                    "message": message,
                    "value": total_value
                }
            )

    return "Alerts evaluated successfully"