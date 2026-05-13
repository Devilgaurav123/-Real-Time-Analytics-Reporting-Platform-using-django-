from django.contrib import admin
from .models import Event, APIKey


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'event_name',
        'organization',
        'event_value',
        'timestamp'
    ]


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        'organization',
        'key',
        'is_active'
    ]