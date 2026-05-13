from django.urls import path
from .views import (
    DashboardCreateView,
    DashboardListView,
    DashboardDetailView,
    WidgetCreateView,
    DashboardAnalyticsView,
    DashboardTemplateView,
    ScheduleReportView
)

urlpatterns = [
    path(
        "create/",
        DashboardCreateView.as_view()
    ),

    path(
        "list/",
        DashboardListView.as_view()
    ),

    path(
        "<int:dashboard_id>/",
        DashboardDetailView.as_view()
    ),

    path(
        "widget/create/",
        WidgetCreateView.as_view()
    ),

    path(
        "analytics/<int:dashboard_id>/",
        DashboardAnalyticsView.as_view()
    ),

    path(
        "templates/",
        DashboardTemplateView.as_view()
    ),

    path(
        "schedule-report/",
        ScheduleReportView.as_view()
    ),
]