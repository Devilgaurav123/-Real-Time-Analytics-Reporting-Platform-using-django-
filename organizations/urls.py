from django.urls import path
from .views import (
    OrganizationListCreateView,
    OrganizationDetailView,
    TeamMembersView,
    RemoveMemberView,
    AcceptInviteView
)

urlpatterns = [
    path(
        '',
        OrganizationListCreateView.as_view()
    ),

    path(
        '<int:pk>/',
        OrganizationDetailView.as_view()
    ),

    path(
        'team-members/',
        TeamMembersView.as_view()
    ),

    path(
        'remove-member/<int:user_id>/',
        RemoveMemberView.as_view()
    ),

    path(
        'accept-invite/',
        AcceptInviteView.as_view()
    ),
]