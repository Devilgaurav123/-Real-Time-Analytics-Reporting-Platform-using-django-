from django.urls import re_path
from .consumers import AlertConsumer

websocket_urlpatterns = [
    re_path(
        r"ws/alerts/(?P<org_id>\d+)/$",
        AlertConsumer.as_asgi()
    ),
]