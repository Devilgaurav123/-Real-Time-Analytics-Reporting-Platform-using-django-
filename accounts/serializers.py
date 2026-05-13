from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserRole, TeamInvite
from organizations.models import Organization


class RegisterSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'organization_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        org_name = validated_data.pop('organization_name')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        org = Organization.objects.create(
            name=org_name,
            owner=user
        )

        UserRole.objects.create(
            user=user,
            organization=org,
            role='owner'
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class TeamInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamInvite
        fields = '__all__'