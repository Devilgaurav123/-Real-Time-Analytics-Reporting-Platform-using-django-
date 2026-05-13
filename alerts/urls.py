from django.urls import path
from .views import (
    CreateAlertView,
    AlertListView,
    AlertHistoryView,
    MuteAlertView,
    SnoozeAlertView,
    NotificationListView,
    MarkNotificationReadView
)

urlpatterns = [
    path(
        "create/",
        CreateAlertView.as_view()
    ),

    path(
        "list/",
        AlertListView.as_view()
    ),

    path(
        "history/",
        AlertHistoryView.as_view()
    ),

    path(
        "mute/<int:alert_id>/",
        MuteAlertView.as_view()
    ),

    path(
        "snooze/<int:alert_id>/",
        SnoozeAlertView.as_view()
    ),

    # NEW routes
    path(
        "notifications/",
        NotificationListView.as_view()
    ),

    path(
        "notifications/read/<int:notification_id>/",
        MarkNotificationReadView.as_view()
    ),
]