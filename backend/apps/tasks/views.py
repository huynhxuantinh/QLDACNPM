from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsProjectManagerOrAdmin

from .models import Task
from .permissions import CanChangeTaskStatus, CanManageTask
from .serializers import TaskSerializer, TaskStatusSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related(
        "project",
        "project__owner",
        "assignee",
        "reporter",
    ).filter(is_deleted=False)
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["project", "assignee", "status", "priority"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "created_at", "title", "priority"]
    ordering = ["due_date", "-created_at"]

    def get_queryset(self):
        queryset = self.queryset
        if getattr(self, "swagger_fake_view", False):
            return queryset.none()
        if self.request.user.role == User.Role.ADMIN:
            return queryset
        return queryset.filter(project__memberships__user=self.request.user).distinct()

    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        if self.action == "create":
            permission_classes.append(IsProjectManagerOrAdmin)
        elif self.action in {"update", "partial_update", "destroy"}:
            permission_classes.append(CanManageTask)
        elif self.action == "change_status":
            permission_classes.append(CanChangeTaskStatus)
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        user = self.request.user
        if user.role != User.Role.ADMIN and project.owner_id != user.id:
            raise PermissionDenied("Chỉ chủ sở hữu dự án mới được tạo công việc.")
        serializer.save(reporter=user)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted", "updated_at"])

    @action(detail=True, methods=["patch"], url_path="status")
    def change_status(self, request, pk=None):
        task = self.get_object()
        serializer = TaskStatusSerializer(
            data=request.data,
            context={"task": task},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
