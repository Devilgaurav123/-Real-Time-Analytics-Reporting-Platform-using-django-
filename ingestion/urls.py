from django.urls import path

from .views import (
    SingleEventIngestionView,
    BatchEventIngestionView,
    CSVUploadView,
    WebhookEventReceiverView,
    GenerateAPIKeyView,
    RevokeAPIKeyView,
    RotateAPIKeyView,
    EventListView
)

urlpatterns = [
    # Single event ingestion
    path(
        "single-event/",
        SingleEventIngestionView.as_view()
    ),

    # Batch event ingestion
    path(
        "batch-event/",
        BatchEventIngestionView.as_view()
    ),

    # CSV upload
    path(
        "upload-csv/",
        CSVUploadView.as_view()
    ),

    # NEW → Webhook receiver
    path(
        "webhook-event/",
        WebhookEventReceiverView.as_view()
    ),

    # API key management
    path(
        "generate-api-key/",
        GenerateAPIKeyView.as_view()
    ),

    path(
        "revoke-api-key/<int:key_id>/",
        RevokeAPIKeyView.as_view()
    ),

    path(
        "rotate-api-key/<int:key_id>/",
        RotateAPIKeyView.as_view()
    ),

    # Event listing
    path(
        "events/",
        EventListView.as_view()
    ),
]