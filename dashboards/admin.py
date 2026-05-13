from django.contrib import admin
from .models import (
    Dashboard,
    DashboardWidget,
    DashboardTemplate,
    ScheduledReport
)


admin.site.register(Dashboard)
admin.site.register(DashboardWidget)
admin.site.register(DashboardTemplate)
admin.site.register(ScheduledReport)