from django.contrib import admin
from .models import UserRole, TeamInvite


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'role']


@admin.register(TeamInvite)
class TeamInviteAdmin(admin.ModelAdmin):
    list_display = [
        'email',
        'organization',
        'role',
        'is_used'
    ]