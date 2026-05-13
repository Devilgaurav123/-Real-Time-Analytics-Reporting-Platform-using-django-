from django.contrib import admin
from .models import AlertRule, AlertHistory

admin.site.register(AlertRule)
admin.site.register(AlertHistory)