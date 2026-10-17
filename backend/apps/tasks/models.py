from django.conf import settings
from django.db import models

from apps.projects.models import Project


class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Thấp"
        MEDIUM = "MEDIUM", "Trung bình"
        HIGH = "HIGH", "Cao"
        URGENT = "URGENT", "Khẩn cấp"

    class Status(models.TextChoices):
        TODO = "TODO", "Cần làm"
        IN_PROGRESS = "IN_PROGRESS", "Đang làm"
        REVIEW = "REVIEW", "Chờ duyệt"
        DONE = "DONE", "Hoàn thành"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_tasks",
    )
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        ordering = ["due_date", "-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["is_deleted"]),
        ]

    def __str__(self):
        return self.title
