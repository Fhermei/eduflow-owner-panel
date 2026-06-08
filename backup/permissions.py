"""
owner_panel/backup/permissions.py
"""

from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow only superusers to access backup operations"""
    
    message = "Only super administrators can perform backup operations."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser