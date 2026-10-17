import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db


def authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_user():
    return get_user_model().objects.create_user(
        email="admin@example.com",
        password="StrongPass123!",
        full_name="Quản trị viên",
        role=get_user_model().Role.ADMIN,
    )


@pytest.fixture
def member_user():
    return get_user_model().objects.create_user(
        email="member@example.com",
        password="StrongPass123!",
        full_name="Thành viên",
    )


def test_member_cannot_manage_users(member_user):
    client = authenticated_client(member_user)

    assert client.get("/api/users/").status_code == 403
    assert (
        client.post(
            "/api/users/",
            {
                "email": "new@example.com",
                "full_name": "Người mới",
                "password": "StrongPass123!",
            },
            format="json",
        ).status_code
        == 403
    )


def test_admin_can_create_and_list_users_without_exposing_password(admin_user):
    client = authenticated_client(admin_user)

    created = client.post(
        "/api/users/",
        {
            "email": "PM@EXAMPLE.COM",
            "full_name": "Quản lý dự án",
            "password": "StrongPass123!",
            "role": "PROJECT_MANAGER",
        },
        format="json",
    )

    assert created.status_code == 201
    assert created.data["email"] == "pm@example.com"
    assert created.data["role"] == "PROJECT_MANAGER"
    assert "password" not in created.data
    assert get_user_model().objects.get(email="pm@example.com").check_password(
        "StrongPass123!"
    )

    listed = client.get("/api/users/")
    assert listed.status_code == 200
    assert listed.data["count"] == 2
    assert all("password" not in user for user in listed.data["results"])


def test_admin_can_lock_user(admin_user, member_user):
    response = authenticated_client(admin_user).patch(
        f"/api/users/{member_user.id}/",
        {"is_active": False},
        format="json",
    )

    assert response.status_code == 200
    member_user.refresh_from_db()
    assert member_user.is_active is False


def test_user_delete_method_is_not_allowed(admin_user, member_user):
    response = authenticated_client(admin_user).delete(
        f"/api/users/{member_user.id}/"
    )

    assert response.status_code == 405
