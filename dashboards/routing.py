from django.urls import re_path
from .consumers import DashboardConsumer

websocket_urlpatterns = [
    re_path(
        r"ws/dashboard/(?P<dashboard_id>\d+)/$",
        DashboardConsumer.as_asgi()
    ),
]