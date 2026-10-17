from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsProjectManagerOrAdmin
from apps.core.exceptions import Conflict

from .models import Project, ProjectMember
from .permissions import ProjectAccessPermission
from .serializers import ProjectMemberSerializer, ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, ProjectAccessPermission]

    def get_queryset(self):
        queryset = Project.objects.select_related("owner")
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return queryset
        return queryset.filter(memberships__user=user).distinct()

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsProjectManagerOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        instance.status = Project.Status.ARCHIVED
        instance.save(update_fields=["status", "updated_at"])

    @action(detail=True, methods=["get", "post"])
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            memberships = project.memberships.select_related("user")
            return Response(ProjectMemberSerializer(memberships, many=True).data)

        serializer = ProjectMemberSerializer(
            data=request.data,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response(
            ProjectMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"members/(?P<user_id>[^/.]+)",
    )
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()
        if str(project.owner_id) == str(user_id):
            raise Conflict("Không thể xóa chủ sở hữu khỏi dự án.")

        membership = get_object_or_404(
            ProjectMember,
            project=project,
            user_id=user_id,
        )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
