from django.db import models
from organizations.models import Organization


class Dashboard(models.Model):
    ACCESS_CHOICES = (
        ("private", "Private"),
        ("public", "Public"),
        ("team", "Team"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="dashboards"
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    access_type = models.CharField(
        max_length=20,
        choices=ACCESS_CHOICES,
        default="private"
    )

    auto_refresh_interval = models.CharField(
        max_length=20,
        default="30s"
    )

    is_fullscreen_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class DashboardWidget(models.Model):
    WIDGET_CHOICES = (
        ("line", "Line Chart"),
        ("bar", "Bar Chart"),
        ("pie", "Pie Chart"),
        ("kpi", "KPI Card"),
        ("table", "Table"),
    )

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name="widgets"
    )

    widget_type = models.CharField(
        max_length=20,
        choices=WIDGET_CHOICES
    )

    title = models.CharField(max_length=255)
    event_name = models.CharField(max_length=255)

    time_range = models.CharField(
        max_length=100,
        default="7days"
    )

    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class DashboardTemplate(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.name


class ScheduledReport(models.Model):
    FREQUENCY_CHOICES = (
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    )

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE
    )

    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES
    )

    email = models.EmailField()

    # NEW FIELDS
    pdf_file = models.FileField(
        upload_to="reports/pdfs/",
        null=True,
        blank=True
    )

    png_file = models.ImageField(
        upload_to="reports/pngs/",
        null=True,
        blank=True
    )

    report_status = models.CharField(
        max_length=20,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.dashboard.name} - {self.frequency}"