from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    InviteTeamMemberView,
    InviteListView
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),

    path('profile/', ProfileView.as_view()),

    path('invite-member/', InviteTeamMemberView.as_view()),
    path('invite-list/', InviteListView.as_view()),
]