from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Event
from organizations.models import Organization
from dashboards.models import Dashboard


@shared_task
def process_event_async(data):
    org = Organization.objects.get(
        id=data["organization"]
    )

    event = Event.objects.create(
        organization=org,
        event_name=data["event_name"],
        event_value=data["event_value"],
        event_type=data.get("event_type"),
        source_type=data.get(
            "source_type",
            "api"
        ),
        metadata=data.get(
            "metadata",
            {}
        ),
        timestamp=data["timestamp"]
    )

    dashboards = Dashboard.objects.filter(
        organization=org
    )

    channel_layer = get_channel_layer()

    for dashboard in dashboards:
        async_to_sync(
            channel_layer.group_send
        )(
            f"dashboard_{dashboard.id}",
            {
                "type": "dashboard_update",
                "message": "New event received",
                "data": {
                    "event_name": event.event_name,
                    "value": event.event_value
                }
            }
        )

    return "success"