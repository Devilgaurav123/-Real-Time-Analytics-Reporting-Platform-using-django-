import pandas as pd

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from accounts.models import UserRole
from .models import Event, APIKey
from .serializers import (
    EventSerializer,
    BatchEventSerializer,
    APIKeySerializer
)
from .tasks import process_event_async


# Single Event Ingestion
class SingleEventIngestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_obj = UserRole.objects.get(
            user=request.user
        )

        org = role_obj.organization

        serializer = EventSerializer(
            data=request.data
        )

        if serializer.is_valid():
            event_data = serializer.validated_data
            event_data["organization"] = org.id
            event_data["source_type"] = "api"

            process_event_async.delay(
                event_data
            )

            return Response({
                "message": "Event queued successfully"
            })

        return Response(
            serializer.errors,
            status=400
        )


# Batch Event Ingestion
class BatchEventIngestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_obj = UserRole.objects.get(
            user=request.user
        )

        org = role_obj.organization

        serializer = BatchEventSerializer(
            data=request.data
        )

        if serializer.is_valid():
            events = serializer.validated_data['events']

            for event in events:
                event["organization"] = org.id
                event["source_type"] = "api"

                process_event_async.delay(
                    event
                )

            return Response({
                "message": "Batch events queued successfully"
            })

        return Response(
            serializer.errors,
            status=400
        )


# CSV Upload
class CSVUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')

        if not file:
            return Response({
                "error": "CSV file required"
            }, status=400)

        role_obj = UserRole.objects.get(
            user=request.user
        )

        org = role_obj.organization

        df = pd.read_csv(file)

        for _, row in df.iterrows():
            Event.objects.create(
                organization=org,
                event_name=row['event_name'],
                event_value=row['event_value'],
                event_type=row.get(
                    'event_type',
                    ''
                ),
                source_type="csv",
                metadata={},
                timestamp=row['timestamp']
            )

        return Response({
            "message": "CSV uploaded successfully"
        })


# NEW FEATURE → Webhook Receiver
class WebhookEventReceiverView(APIView):

    def post(self, request):
        org_id = request.data.get(
            "organization_id"
        )

        event_data = {
            "organization": org_id,
            "event_name": request.data.get(
                "event_name"
            ),
            "event_value": request.data.get(
                "event_value"
            ),
            "event_type": request.data.get(
                "event_type"
            ),
            "metadata": request.data.get(
                "metadata",
                {}
            ),
            "timestamp": request.data.get(
                "timestamp"
            ),
            "source_type": "webhook"
        }

        process_event_async.delay(
            event_data
        )

        return Response({
            "message": "Webhook event received successfully"
        })


# Generate API Key
class GenerateAPIKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_obj = UserRole.objects.get(
            user=request.user
        )

        org = role_obj.organization

        api_key = APIKey.objects.create(
            organization=org
        )

        serializer = APIKeySerializer(
            api_key
        )

        return Response(
            serializer.data
        )


# Revoke API Key
class RevokeAPIKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, key_id):
        api_key = get_object_or_404(
            APIKey,
            id=key_id
        )

        api_key.is_active = False
        api_key.save()

        return Response({
            "message": "API Key revoked successfully"
        })


# Rotate API Key
class RotateAPIKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, key_id):
        old_key = get_object_or_404(
            APIKey,
            id=key_id
        )

        old_key.is_active = False
        old_key.save()

        new_key = APIKey.objects.create(
            organization=old_key.organization
        )

        serializer = APIKeySerializer(
            new_key
        )

        return Response({
            "message": "API Key rotated successfully",
            "new_key": serializer.data
        })


# Event List
class EventListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role_obj = UserRole.objects.get(
            user=request.user
        )

        org = role_obj.organization

        events = Event.objects.filter(
            organization=org
        )

        serializer = EventSerializer(
            events,
            many=True
        )

        return Response(
            serializer.data
        )