from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.projects.models import Project, ProjectMember

from .models import Task
from .services import TaskWorkflow


User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        source="assignee",
        queryset=User.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        write_only=True,
    )
    reporter = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "title",
            "description",
            "assignee",
            "assignee_id",
            "reporter",
            "priority",
            "status",
            "due_date",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reporter",
            "status",
            "completed_at",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        project = attrs.get("project", getattr(self.instance, "project", None))
        assignee = attrs.get("assignee", getattr(self.instance, "assignee", None))

        if self.instance and project != self.instance.project:
            raise serializers.ValidationError(
                {"project": "Không thể chuyển công việc sang dự án khác."}
            )
        if project.status == Project.Status.ARCHIVED:
            raise serializers.ValidationError(
                {"project": "Không thể tạo hoặc sửa công việc trong dự án đã lưu trữ."}
            )
        if assignee and not ProjectMember.objects.filter(
            project=project,
            user=assignee,
        ).exists():
            raise serializers.ValidationError(
                {"assignee_id": "Người phụ trách phải là thành viên dự án."}
            )
        return attrs


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)

    def save(self, **kwargs):
        return TaskWorkflow.transition(
            self.context["task"],
            self.validated_data["status"],
            self.context["request"].user,
        )
