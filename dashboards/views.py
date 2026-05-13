from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from ingestion.models import Event

from .models import (
    Dashboard,
    DashboardWidget,
    DashboardTemplate,
    ScheduledReport
)

from .serializers import (
    DashboardSerializer,
    WidgetSerializer,
    TemplateSerializer,
    ScheduledReportSerializer
)


class DashboardCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = UserRole.objects.get(user=request.user)

        serializer = DashboardSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(
                organization=role.organization
            )
            return Response(serializer.data)

        return Response(serializer.errors)


class DashboardListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = UserRole.objects.get(user=request.user)

        dashboards = Dashboard.objects.filter(
            organization=role.organization
        )

        serializer = DashboardSerializer(
            dashboards,
            many=True
        )

        return Response(serializer.data)


class DashboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, dashboard_id):
        dashboard = Dashboard.objects.get(
            id=dashboard_id
        )

        serializer = DashboardSerializer(
            dashboard,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors)

    def delete(self, request, dashboard_id):
        dashboard = Dashboard.objects.get(
            id=dashboard_id
        )

        dashboard.delete()

        return Response({
            "message": "Dashboard deleted"
        })


class WidgetCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WidgetSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors)


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dashboard_id):
        role = UserRole.objects.get(user=request.user)

        dashboard = Dashboard.objects.get(
            id=dashboard_id,
            organization=role.organization
        )

        widgets = dashboard.widgets.all()

        analytics_data = []

        for widget in widgets:
            events = Event.objects.filter(
                organization=role.organization,
                event_name=widget.event_name
            )

            total_events = events.count()

            total_value = events.aggregate(
                Sum("event_value")
            )["event_value__sum"] or 0

            analytics_data.append({
                "widget": widget.title,
                "type": widget.widget_type,
                "total_events": total_events,
                "total_value": total_value
            })

        return Response(analytics_data)


class DashboardTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        templates = DashboardTemplate.objects.all()

        serializer = TemplateSerializer(
            templates,
            many=True
        )

        return Response(serializer.data)


class ScheduleReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ScheduledReportSerializer(
            data=request.data
        )

        if serializer.is_valid():
            report = serializer.save()

            from .tasks import generate_dashboard_report
            generate_dashboard_report.delay(
                report.id
            )

            return Response({
                "message": "Report scheduled successfully"
            })

        return Response(serializer.errors)


# NEW FEATURE
class DownloadReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        report = ScheduledReport.objects.get(
            id=report_id
        )

        return Response({
            "pdf_url": report.pdf_file.url if report.pdf_file else None,
            "png_url": report.png_file.url if report.png_file else None
        })


# NEW FEATURE
class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = ScheduledReport.objects.all()

        serializer = ScheduledReportSerializer(
            reports,
            many=True
        )

        return Response(serializer.data)