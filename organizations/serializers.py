from rest_framework import serializers
from .models import Organization
from django.contrib.auth.models import User
from accounts.models import TeamInvite, UserRole


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = "__all__"
        read_only_fields = ['owner']


class TeamMemberSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

    def get_role(self, obj):
        role = UserRole.objects.filter(
            user=obj
        ).first()

        if role:
            return role.role
        return None


class InviteAcceptSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    username = serializers.CharField()
    password = serializers.CharField()