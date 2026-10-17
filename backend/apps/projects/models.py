from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = "PLANNING", "Lập kế hoạch"
        ACTIVE = "ACTIVE", "Đang thực hiện"
        COMPLETED = "COMPLETED", "Hoàn thành"
        ARCHIVED = "ARCHIVED", "Đã lưu trữ"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING,
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["due_date"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(start_date__isnull=True)
                    | Q(due_date__isnull=True)
                    | Q(due_date__gte=F("start_date"))
                ),
                name="projects_due_date_not_before_start",
            )
        ]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="project_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "project_members"
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="projects_member_unique",
            )
        ]
        indexes = [models.Index(fields=["user", "project"])]

    def __str__(self):
        return f"{self.project} - {self.user}"
