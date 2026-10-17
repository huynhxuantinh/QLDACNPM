import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.projects.models import Project
from apps.tasks.models import Task


pytestmark = pytest.mark.django_db


def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    first_counts = (
        get_user_model().objects.count(),
        Project.objects.count(),
        Task.objects.count(),
    )

    call_command("seed_demo")
    second_counts = (
        get_user_model().objects.count(),
        Project.objects.count(),
        Task.objects.count(),
    )

    assert first_counts == (3, 2, 6)
    assert second_counts == first_counts
