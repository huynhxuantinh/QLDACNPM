from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Project, ProjectMember


User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "status",
            "start_date",
            "due_date",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError(
                {"due_date": "Hạn kết thúc không được trước ngày bắt đầu."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        project = Project.objects.create(**validated_data)
        ProjectMember.objects.create(project=project, user=project.owner)
        return project


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = ProjectMember
        fields = ("id", "user", "user_id", "joined_at")
        read_only_fields = ("id", "joined_at")

    def validate_user_id(self, user):
        project = self.context["project"]
        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError("Người dùng đã là thành viên dự án.")
        return user

    def create(self, validated_data):
        return ProjectMember.objects.create(
            project=self.context["project"],
            **validated_data,
        )
