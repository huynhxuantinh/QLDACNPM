from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.projects.models import Project
from apps.tasks.models import Task

from .serializers import DashboardSummarySerializer
from .services import DashboardService


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="project",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Lọc KPI theo ID dự án người dùng được xem.",
            )
        ],
        responses={200: DashboardSummarySerializer},
    )
    def get(self, request):
        tasks = Task.objects.filter(is_deleted=False)
        projects = Project.objects.all()

        if request.user.role != User.Role.ADMIN:
            projects = projects.filter(memberships__user=request.user)
            tasks = tasks.filter(project__memberships__user=request.user)

        project_id = request.query_params.get("project")
        if project_id:
            project = get_object_or_404(projects, pk=project_id)
            tasks = tasks.filter(project=project)

        summary = DashboardService.summarize(tasks)
        return Response(DashboardSummarySerializer(summary).data)
