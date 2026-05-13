"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named `application`.
"""

import os
import django

from django.core.asgi import get_asgi_application
from channels.routing import (
    ProtocolTypeRouter,
    URLRouter
)
from channels.auth import (
    AuthMiddlewareStack
)

from dashboards.routing import (
    websocket_urlpatterns as dashboard_ws
)

from alerts.routing import (
    websocket_urlpatterns as alert_ws
)


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings"
)

django.setup()


application = ProtocolTypeRouter({

    # Normal HTTP requests
    "http": get_asgi_application(),

    # WebSocket requests
    "websocket": AuthMiddlewareStack(
        URLRouter(
            dashboard_ws + alert_ws
        )
    ),
})