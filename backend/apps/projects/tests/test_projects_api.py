from datetime import date, timedelta

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


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


def project_payload(**overrides):
    payload = {
        "name": "Website nội bộ",
        "description": "Xây dựng hệ thống quản lý công việc",
        "start_date": str(date.today()),
        "due_date": str(date.today() + timedelta(days=30)),
    }
    payload.update(overrides)
    return payload


def create_project(owner, **overrides):
    return client_for(owner).post(
        "/api/projects/", project_payload(**overrides), format="json"
    )


def test_project_manager_creates_project_and_becomes_member():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)

    response = create_project(manager)

    assert response.status_code == 201
    assert response.data["owner"]["id"] == manager.id
    assert response.data["status"] == "PLANNING"

    members = client_for(manager).get(
        f"/api/projects/{response.data['id']}/members/"
    )
    assert members.status_code == 200
    assert [item["user"]["id"] for item in members.data] == [manager.id]


def test_member_cannot_create_project():
    member = make_user("member@example.com")

    response = create_project(member)

    assert response.status_code == 403


def test_project_dates_are_validated():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)

    response = create_project(
        manager,
        start_date="2026-10-20",
        due_date="2026-10-19",
    )

    assert response.status_code == 400
    assert "due_date" in response.data["details"]


def test_project_list_and_detail_are_scoped_to_membership():
    first_manager = make_user("pm1@example.com", User.Role.PROJECT_MANAGER)
    second_manager = make_user("pm2@example.com", User.Role.PROJECT_MANAGER)
    first = create_project(first_manager).data
    create_project(second_manager)

    listed = client_for(first_manager).get("/api/projects/")
    assert listed.status_code == 200
    assert listed.data["count"] == 1
    assert listed.data["results"][0]["id"] == first["id"]

    hidden = client_for(second_manager).get(f"/api/projects/{first['id']}/")
    assert hidden.status_code == 404


def test_owner_adds_member_and_duplicate_is_rejected():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    member = make_user("member@example.com")
    project_id = create_project(manager).data["id"]
    client = client_for(manager)

    added = client.post(
        f"/api/projects/{project_id}/members/",
        {"user_id": member.id},
        format="json",
    )
    assert added.status_code == 201
    assert added.data["user"]["email"] == member.email

    duplicate = client.post(
        f"/api/projects/{project_id}/members/",
        {"user_id": member.id},
        format="json",
    )
    assert duplicate.status_code == 400

    visible = client_for(member).get(f"/api/projects/{project_id}/")
    assert visible.status_code == 200


def test_non_owner_member_cannot_modify_project_or_members():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    member = make_user("member@example.com")
    project_id = create_project(manager).data["id"]
    client_for(manager).post(
        f"/api/projects/{project_id}/members/",
        {"user_id": member.id},
        format="json",
    )
    member_client = client_for(member)

    assert (
        member_client.patch(
            f"/api/projects/{project_id}/",
            {"name": "Không được sửa"},
            format="json",
        ).status_code
        == 403
    )
    assert (
        member_client.post(
            f"/api/projects/{project_id}/members/",
            {"user_id": manager.id},
            format="json",
        ).status_code
        == 403
    )


def test_owner_cannot_be_removed_and_other_member_can_be_removed():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    member = make_user("member@example.com")
    project_id = create_project(manager).data["id"]
    client = client_for(manager)
    client.post(
        f"/api/projects/{project_id}/members/",
        {"user_id": member.id},
        format="json",
    )

    owner_removal = client.delete(
        f"/api/projects/{project_id}/members/{manager.id}/"
    )
    assert owner_removal.status_code == 409

    member_removal = client.delete(
        f"/api/projects/{project_id}/members/{member.id}/"
    )
    assert member_removal.status_code == 204
    assert client_for(member).get(f"/api/projects/{project_id}/").status_code == 404


def test_deleting_project_archives_it():
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    project_id = create_project(manager).data["id"]

    response = client_for(manager).delete(f"/api/projects/{project_id}/")

    assert response.status_code == 204
    detail = client_for(manager).get(f"/api/projects/{project_id}/")
    assert detail.status_code == 200
    assert detail.data["status"] == "ARCHIVED"


def test_admin_can_see_and_update_every_project():
    admin = make_user("admin@example.com", User.Role.ADMIN)
    manager = make_user("pm@example.com", User.Role.PROJECT_MANAGER)
    project_id = create_project(manager).data["id"]

    listed = client_for(admin).get("/api/projects/")
    assert listed.status_code == 200
    assert listed.data["count"] == 1

    updated = client_for(admin).patch(
        f"/api/projects/{project_id}/",
        {"status": "ACTIVE"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["status"] == "ACTIVE"
