from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User

from .models import Task


class TaskWorkflow:
    transitions = {
        Task.Status.TODO: {Task.Status.IN_PROGRESS},
        Task.Status.IN_PROGRESS: {Task.Status.TODO, Task.Status.REVIEW},
        Task.Status.REVIEW: {Task.Status.IN_PROGRESS, Task.Status.DONE},
        Task.Status.DONE: {Task.Status.REVIEW},
    }
    member_transitions = {
        Task.Status.TODO: {Task.Status.IN_PROGRESS},
        Task.Status.IN_PROGRESS: {Task.Status.REVIEW},
        Task.Status.REVIEW: set(),
        Task.Status.DONE: set(),
    }

    @classmethod
    @transaction.atomic
    def transition(cls, task, new_status, actor):
        if new_status not in cls.transitions[task.status]:
            raise serializers.ValidationError(
                {
                    "status": (
                        f"Không thể chuyển trạng thái từ {task.status} "
                        f"sang {new_status}."
                    )
                }
            )

        is_reviewer = actor.role in {
            User.Role.ADMIN,
            User.Role.PROJECT_MANAGER,
        }
        if not is_reviewer and (
            task.assignee_id != actor.id
            or new_status not in cls.member_transitions[task.status]
        ):
            raise PermissionDenied(
                "Chỉ quản lý dự án hoặc quản trị viên được duyệt và mở lại công việc."
            )

        task.status = new_status
        task.completed_at = timezone.now() if new_status == Task.Status.DONE else None
        task.save(update_fields=["status", "completed_at", "updated_at"])
        return task
