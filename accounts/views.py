from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    TeamInviteSerializer
)
from .models import TeamInvite, UserRole


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "User registered successfully"
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class InviteTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_obj = UserRole.objects.filter(
            user=request.user
        ).first()

        if role_obj.role not in ['owner', 'admin']:
            return Response({
                "error": "Permission denied"
            }, status=403)

        data = request.data.copy()
        data['organization'] = role_obj.organization.id

        serializer = TeamInviteSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Invite sent successfully"
            })

        return Response(serializer.errors, status=400)


class InviteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role_obj = UserRole.objects.filter(
            user=request.user
        ).first()

        invites = TeamInvite.objects.filter(
            organization=role_obj.organization
        )

        serializer = TeamInviteSerializer(
            invites,
            many=True
        )

        return Response(serializer.data)