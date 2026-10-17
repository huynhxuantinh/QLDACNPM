from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.projects.models import Project, ProjectMember


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


@pytest.fixture
def project_team():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    member = make_user("member@example.com")
    outsider = make_user("outsider@example.com")
    project = Project.objects.create(owner=manager, name="TaskFlow")
    ProjectMember.objects.create(project=project, user=manager)
    ProjectMember.objects.create(project=project, user=member)
    return project, manager, member, outsider


def task_payload(project, member, **overrides):
    payload = {
        "project": project.id,
        "title": "Thiết kế API công việc",
        "description": "CRUD và workflow",
        "assignee_id": member.id,
        "priority": "HIGH",
        "due_date": (timezone.now() + timedelta(days=3)).isoformat(),
    }
    payload.update(overrides)
    return payload


def create_task(project, manager, member, **overrides):
    return client_for(manager).post(
        "/api/tasks/",
        task_payload(project, member, **overrides),
        format="json",
    )


def test_project_owner_creates_task_for_project_member(project_team):
    project, manager, member, _ = project_team

    response = create_task(project, manager, member)

    assert response.status_code == 201
    assert response.data["project"] == project.id
    assert response.data["assignee"]["id"] == member.id
    assert response.data["reporter"]["id"] == manager.id
    assert response.data["status"] == "TODO"


def test_task_rejects_assignee_outside_project(project_team):
    project, manager, member, outsider = project_team

    response = create_task(project, manager, member, assignee_id=outsider.id)

    assert response.status_code == 400
    assert "assignee_id" in response.data["details"]


def test_member_and_non_owner_manager_cannot_create_task(project_team):
    project, manager, member, _ = project_team
    other_manager = make_user("pm2@example.com", User.Role.PROJECT_MANAGER)
    ProjectMember.objects.create(project=project, user=other_manager)
    payload = task_payload(project, member)

    assert client_for(member).post("/api/tasks/", payload, format="json").status_code == 403
    assert (
        client_for(other_manager).post("/api/tasks/", payload, format="json").status_code
        == 403
    )


def test_task_visibility_is_scoped_to_project_members(project_team):
    project, manager, member, outsider = project_team
    task = create_task(project, manager, member).data

    visible = client_for(member).get(f"/api/tasks/{task['id']}/")
    hidden = client_for(outsider).get(f"/api/tasks/{task['id']}/")

    assert visible.status_code == 200
    assert hidden.status_code == 404


def test_task_list_supports_filter_search_and_ordering(project_team):
    project, manager, member, _ = project_team
    create_task(project, manager, member, title="Alpha API", priority="HIGH")
    create_task(project, manager, member, title="Beta UI", priority="LOW")

    response = client_for(member).get(
        f"/api/tasks/?project={project.id}&priority=HIGH&search=Alpha&ordering=due_date"
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["title"] == "Alpha API"


def test_only_owner_or_admin_can_edit_and_delete_task(project_team):
    project, manager, member, _ = project_team
    task_id = create_task(project, manager, member).data["id"]
    member_client = client_for(member)

    assert (
        member_client.patch(
            f"/api/tasks/{task_id}/", {"title": "Không được sửa"}, format="json"
        ).status_code
        == 403
    )
    assert member_client.delete(f"/api/tasks/{task_id}/").status_code == 403

    deleted = client_for(manager).delete(f"/api/tasks/{task_id}/")
    assert deleted.status_code == 204
    assert client_for(manager).get(f"/api/tasks/{task_id}/").status_code == 404


def test_assignee_updates_status_through_valid_workflow(project_team):
    project, manager, member, _ = project_team
    task_id = create_task(project, manager, member).data["id"]
    client = client_for(member)

    for expected_status in ("IN_PROGRESS", "REVIEW", "DONE"):
        response = client.patch(
            f"/api/tasks/{task_id}/status/",
            {"status": expected_status},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["status"] == expected_status

    assert response.data["completed_at"] is not None

    reopened = client_for(manager).patch(
        f"/api/tasks/{task_id}/status/",
        {"status": "REVIEW"},
        format="json",
    )
    assert reopened.status_code == 200
    assert reopened.data["completed_at"] is None


def test_invalid_transition_and_unrelated_member_are_rejected(project_team):
    project, manager, member, _ = project_team
    other_member = make_user("other@example.com")
    ProjectMember.objects.create(project=project, user=other_member)
    task_id = create_task(project, manager, member).data["id"]

    invalid = client_for(member).patch(
        f"/api/tasks/{task_id}/status/",
        {"status": "DONE"},
        format="json",
    )
    assert invalid.status_code == 400

    forbidden = client_for(other_member).patch(
        f"/api/tasks/{task_id}/status/",
        {"status": "IN_PROGRESS"},
        format="json",
    )
    assert forbidden.status_code == 403


def test_cannot_create_task_in_archived_project(project_team):
    project, manager, member, _ = project_team
    project.status = Project.Status.ARCHIVED
    project.save(update_fields=["status", "updated_at"])

    response = create_task(project, manager, member)

    assert response.status_code == 400
    assert "project" in response.data["details"]


def test_member_with_open_tasks_must_be_reassigned_before_removal(project_team):
    project, manager, member, _ = project_team
    create_task(project, manager, member)

    response = client_for(manager).delete(
        f"/api/projects/{project.id}/members/{member.id}/"
    )

    assert response.status_code == 409
