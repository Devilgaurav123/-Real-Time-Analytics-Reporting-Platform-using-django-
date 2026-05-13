from django.db import models
from organizations.models import Organization
import uuid


class APIKey(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="api_keys"
    )

    key = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return str(self.key)


class Event(models.Model):
    SOURCE_CHOICES = (
        ("api", "API"),
        ("csv", "CSV"),
        ("webhook", "Webhook"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="events"
    )

    event_name = models.CharField(
        max_length=255
    )

    event_value = models.FloatField()

    event_type = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="api"
    )

    metadata = models.JSONField(
        default=dict
    )

    timestamp = models.DateTimeField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-timestamp']

        # Time-series optimization
        indexes = [
            models.Index(
                fields=["organization", "timestamp"]
            ),
            models.Index(
                fields=["event_name"]
            ),
            models.Index(
                fields=["source_type"]
            )
        ]

    def __str__(self):
        return self.event_name