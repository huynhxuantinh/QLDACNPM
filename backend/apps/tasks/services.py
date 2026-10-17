from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Task


class TaskWorkflow:
    transitions = {
        Task.Status.TODO: {Task.Status.IN_PROGRESS},
        Task.Status.IN_PROGRESS: {Task.Status.TODO, Task.Status.REVIEW},
        Task.Status.REVIEW: {Task.Status.IN_PROGRESS, Task.Status.DONE},
        Task.Status.DONE: {Task.Status.REVIEW},
    }

    @classmethod
    @transaction.atomic
    def transition(cls, task, new_status):
        if new_status not in cls.transitions[task.status]:
            raise serializers.ValidationError(
                {
                    "status": (
                        f"Không thể chuyển trạng thái từ {task.status} "
                        f"sang {new_status}."
                    )
                }
            )

        task.status = new_status
        task.completed_at = timezone.now() if new_status == Task.Status.DONE else None
        task.save(update_fields=["status", "completed_at", "updated_at"])
        return task
