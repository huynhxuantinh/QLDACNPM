from rest_framework.permissions import BasePermission

from .models import User


class IsSystemAdmin(BasePermission):
    message = "Chỉ quản trị viên mới có quyền thực hiện thao tác này."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == User.Role.ADMIN
        )


class IsProjectManagerOrAdmin(BasePermission):
    message = "Bạn không có quyền quản lý dự án."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role
            in {User.Role.ADMIN, User.Role.PROJECT_MANAGER}
        )
