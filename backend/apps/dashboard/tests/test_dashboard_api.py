from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task


pytestmark = pytest.mark.django_db
User = get_user_model()


def make_user(email, role=User.Role.MEMBER):
    return User.objects.create_user(
        email=email,
        password="StrongPass123!",
        full_name=email.split("@")[0],
        role=role,
    )


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_project(owner, name):
    project = Project.objects.create(owner=owner, name=name)
    ProjectMember.objects.create(project=project, user=owner)
    return project


def make_task(project, reporter, status, **kwargs):
    return Task.objects.create(
        project=project,
        reporter=reporter,
        title=f"Task {project.name} {status}",
        status=status,
        **kwargs,
    )


def test_dashboard_requires_authentication():
    response = APIClient().get("/api/dashboard/summary/")

    assert response.status_code == 401


def test_member_dashboard_only_counts_joined_projects():
    first_manager = make_user("pm1@example.com", User.Role.PROJECT_MANAGER)
    second_manager = make_user("pm2@example.com", User.Role.PROJECT_MANAGER)
    member = make_user("member@example.com")
    first = make_project(first_manager, "First")
    second = make_project(second_manager, "Second")
    ProjectMember.objects.create(project=first, user=member)

    make_task(first, first_manager, Task.Status.TODO)
    make_task(first, first_manager, Task.Status.IN_PROGRESS)
    make_task(first, first_manager, Task.Status.REVIEW)
    make_task(first, first_manager, Task.Status.DONE, completed_at=timezone.now())
    make_task(
        first,
        first_manager,
        Task.Status.TODO,
        due_date=timezone.now() - timedelta(hours=1),
    )
    make_task(first, first_manager, Task.Status.DONE, is_deleted=True)
    make_task(second, second_manager, Task.Status.TODO)

    response = client_for(member).get("/api/dashboard/summary/")

    assert response.status_code == 200
    assert response.data == {
        "total": 5,
        "todo": 2,
        "in_progress": 1,
        "review": 1,
        "done": 1,
        "overdue": 1,
        "completion_rate": 20.0,
    }


def test_admin_dashboard_counts_all_projects():
    admin = make_user("admin@example.com", User.Role.ADMIN)
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    project = make_project(manager, "Project")
    other = make_project(admin, "Admin Project")
    make_task(project, manager, Task.Status.DONE, completed_at=timezone.now())
    make_task(other, admin, Task.Status.TODO)

    response = client_for(admin).get("/api/dashboard/summary/")

    assert response.status_code == 200
    assert response.data["total"] == 2
    assert response.data["completion_rate"] == 50.0


def test_dashboard_can_filter_accessible_project_and_hides_other_project():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    outsider = make_user("outsider@example.com")
    project = make_project(manager, "Project")
    make_task(project, manager, Task.Status.TODO)

    filtered = client_for(manager).get(
        "/api/dashboard/summary/", {"project": project.id}
    )
    hidden = client_for(outsider).get(
        "/api/dashboard/summary/", {"project": project.id}
    )

    assert filtered.status_code == 200
    assert filtered.data["total"] == 1
    assert hidden.status_code == 404


def test_dashboard_summary_uses_a_bounded_number_of_queries(django_assert_num_queries):
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    project = make_project(manager, "Project")
    make_task(project, manager, Task.Status.TODO)

    with django_assert_num_queries(1):
        response = client_for(manager).get("/api/dashboard/summary/")

    assert response.status_code == 200
