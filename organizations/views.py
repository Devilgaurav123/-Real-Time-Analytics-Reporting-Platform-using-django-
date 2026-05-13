from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Organization
from .serializers import (
    OrganizationSerializer,
    TeamMemberSerializer,
    InviteAcceptSerializer
)

from accounts.models import UserRole, TeamInvite


# Create Organization + List Organizations
class OrganizationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organizations = Organization.objects.filter(
            owner=request.user
        )

        serializer = OrganizationSerializer(
            organizations,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = OrganizationSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(owner=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# Get Single Organization / Update / Delete
class OrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        organization = get_object_or_404(
            Organization,
            id=pk,
            owner=request.user
        )

        serializer = OrganizationSerializer(
            organization
        )

        return Response(serializer.data)

    def put(self, request, pk):
        organization = get_object_or_404(
            Organization,
            id=pk,
            owner=request.user
        )

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        organization = get_object_or_404(
            Organization,
            id=pk,
            owner=request.user
        )

        organization.delete()

        return Response({
            "message": "Organization deleted successfully"
        })


# View all team members
class TeamMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = UserRole.objects.get(
            user=request.user
        )

        org = user_role.organization

        roles = UserRole.objects.filter(
            organization=org
        )

        users = [role.user for role in roles]

        serializer = TeamMemberSerializer(
            users,
            many=True
        )

        return Response(serializer.data)


# Remove team member
class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        current_user_role = UserRole.objects.get(
            user=request.user
        )

        if current_user_role.role not in [
            "owner",
            "admin"
        ]:
            return Response({
                "error": "Permission denied"
            }, status=status.HTTP_403_FORBIDDEN)

        member_role = get_object_or_404(
            UserRole,
            user_id=user_id,
            organization=current_user_role.organization
        )

        member_role.delete()

        return Response({
            "message": "Member removed successfully"
        })


# Accept invite and join organization
class AcceptInviteView(APIView):

    def post(self, request):
        serializer = InviteAcceptSerializer(
            data=request.data
        )

        if serializer.is_valid():
            token = serializer.validated_data['token']
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            invite = get_object_or_404(
                TeamInvite,
                invite_token=token,
                is_used=False
            )

            user = User.objects.create_user(
                username=username,
                email=invite.email,
                password=password
            )

            UserRole.objects.create(
                user=user,
                organization=invite.organization,
                role=invite.role
            )

            invite.is_used = True
            invite.save()

            return Response({
                "message": "Invite accepted successfully"
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )