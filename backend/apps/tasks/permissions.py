from rest_framework.permissions import BasePermission

from apps.accounts.models import User


class CanManageTask(BasePermission):
    message = "Bạn không có quyền chỉnh sửa công việc này."

    def has_object_permission(self, request, view, task):
        return bool(
            request.user.role == User.Role.ADMIN
            or task.project.owner_id == request.user.id
        )


class CanChangeTaskStatus(BasePermission):
    message = "Bạn không có quyền cập nhật trạng thái công việc này."

    def has_object_permission(self, request, view, task):
        return bool(
            request.user.role == User.Role.ADMIN
            or task.project.owner_id == request.user.id
            or task.assignee_id == request.user.id
        )
