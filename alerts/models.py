from django.db import models
from organizations.models import Organization
from dashboards.models import Dashboard


class AlertRule(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("triggered", "Triggered"),
        ("resolved", "Resolved"),
        ("muted", "Muted"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE
    )

    metric_name = models.CharField(
        max_length=255
    )

    threshold_value = models.FloatField()

    condition = models.CharField(
        max_length=20,
        choices=(
            ("gt", "Greater Than"),
            ("lt", "Less Than"),
        )
    )

    duration_minutes = models.IntegerField(
        default=10
    )

    email = models.EmailField(
        null=True,
        blank=True
    )

    webhook_url = models.URLField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    snooze_until = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.metric_name


class AlertHistory(models.Model):
    alert = models.ForeignKey(
        AlertRule,
        on_delete=models.CASCADE
    )

    triggered_value = models.FloatField()

    message = models.TextField()

    triggered_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.alert.metric_name}"


# NEW MODEL → In-app notifications
class InAppNotification(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )

    title = models.CharField(
        max_length=255
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title