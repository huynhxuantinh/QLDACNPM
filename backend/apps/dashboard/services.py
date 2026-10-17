from django.db.models import Count, Q
from django.utils import timezone

from apps.tasks.models import Task


class DashboardService:
    @staticmethod
    def summarize(queryset):
        metrics = queryset.aggregate(
            total=Count("id"),
            todo=Count("id", filter=Q(status=Task.Status.TODO)),
            in_progress=Count("id", filter=Q(status=Task.Status.IN_PROGRESS)),
            review=Count("id", filter=Q(status=Task.Status.REVIEW)),
            done=Count("id", filter=Q(status=Task.Status.DONE)),
            overdue=Count(
                "id",
                filter=Q(due_date__lt=timezone.now()) & ~Q(status=Task.Status.DONE),
            ),
        )
        metrics["completion_rate"] = (
            round(metrics["done"] * 100 / metrics["total"], 2)
            if metrics["total"]
            else 0.0
        )
        return metrics
