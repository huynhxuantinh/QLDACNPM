from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task


User = get_user_model()


class Command(BaseCommand):
    help = "Tạo dữ liệu demo TaskFlow theo cách có thể chạy lặp lại."

    @transaction.atomic
    def handle(self, *args, **options):
        admin = self._upsert_user(
            "admin@taskflow.local",
            "Quản trị viên",
            User.Role.ADMIN,
        )
        manager = self._upsert_user(
            "manager@taskflow.local",
            "Quản lý dự án",
            User.Role.PROJECT_MANAGER,
        )
        member = self._upsert_user(
            "member@taskflow.local",
            "Thành viên",
            User.Role.MEMBER,
        )

        website, _ = Project.objects.update_or_create(
            owner=manager,
            name="Website nội bộ",
            defaults={
                "description": "Dự án demo quản lý công việc.",
                "status": Project.Status.ACTIVE,
            },
        )
        operations, _ = Project.objects.update_or_create(
            owner=admin,
            name="Chuẩn hóa vận hành",
            defaults={
                "description": "Dự án demo dành cho quản trị viên.",
                "status": Project.Status.PLANNING,
            },
        )

        for project, users in (
            (website, [manager, member]),
            (operations, [admin]),
        ):
            for user in users:
                ProjectMember.objects.get_or_create(project=project, user=user)

        now = timezone.now()
        demo_tasks = [
            (website, "Phân tích yêu cầu", member, Task.Status.DONE, -3),
            (website, "Thiết kế database", member, Task.Status.REVIEW, 1),
            (website, "Xây dựng API", member, Task.Status.IN_PROGRESS, 3),
            (website, "Viết tài liệu", manager, Task.Status.TODO, -1),
            (operations, "Chuẩn hóa quy trình", admin, Task.Status.TODO, 5),
            (operations, "Kiểm tra phân quyền", admin, Task.Status.DONE, -2),
        ]
        for project, title, assignee, task_status, due_offset in demo_tasks:
            Task.objects.update_or_create(
                project=project,
                title=title,
                defaults={
                    "reporter": project.owner,
                    "assignee": assignee,
                    "priority": Task.Priority.MEDIUM,
                    "status": task_status,
                    "due_date": now + timedelta(days=due_offset),
                    "completed_at": now if task_status == Task.Status.DONE else None,
                    "is_deleted": False,
                },
            )

        self.stdout.write(self.style.SUCCESS("Đã tạo dữ liệu demo TaskFlow."))

    @staticmethod
    def _upsert_user(email, full_name, role):
        user, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role,
                "is_active": True,
            },
        )
        user.set_password("Demo123!")
        user.save(update_fields=["password", "updated_at"])
        return user
