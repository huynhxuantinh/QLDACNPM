from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import User


class ProjectAccessPermission(BasePermission):
    message = "Bạn không có quyền thao tác với dự án này."

    def has_object_permission(self, request, view, project):
        if request.user.role == User.Role.ADMIN:
            return True
        if request.method in SAFE_METHODS:
            return project.memberships.filter(user=request.user).exists()
        return project.owner_id == request.user.id
