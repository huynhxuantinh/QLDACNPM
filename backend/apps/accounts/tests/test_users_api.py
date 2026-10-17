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


@pytest.fixture
def project_manager_user():
    return get_user_model().objects.create_user(
        email="pm@example.com",
        password="StrongPass123!",
        full_name="Quản lý dự án",
        role=get_user_model().Role.PROJECT_MANAGER,
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


def test_project_manager_can_search_active_users_with_minimal_fields(
    project_manager_user, member_user
):
    user_model = get_user_model()
    user_model.objects.create_user(
        email="member-inactive@example.com",
        password="StrongPass123!",
        full_name="Thành viên ngưng hoạt động",
        is_active=False,
    )
    user_model.objects.create_user(
        email="other@example.com",
        password="StrongPass123!",
        full_name="Người khác",
    )
    client = authenticated_client(project_manager_user)

    response = client.get("/api/users/", {"search": "member"})

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0] == {
        "id": member_user.id,
        "email": member_user.email,
        "full_name": member_user.full_name,
        "role": member_user.role,
        "avatar_url": member_user.avatar_url,
    }


def test_project_manager_cannot_create_or_update_users(
    project_manager_user, member_user
):
    client = authenticated_client(project_manager_user)

    created = client.post(
        "/api/users/",
        {
            "email": "new@example.com",
            "full_name": "Người mới",
            "password": "StrongPass123!",
        },
        format="json",
    )
    updated = client.patch(
        f"/api/users/{member_user.id}/",
        {"is_active": False},
        format="json",
    )

    assert created.status_code == 403
    assert updated.status_code == 403


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


@pytest.mark.parametrize(
    ("payload", "error_field"),
    [
        ({"is_active": False}, "is_active"),
        ({"role": "MEMBER"}, "role"),
    ],
)
def test_admin_cannot_lock_or_demote_themselves(admin_user, payload, error_field):
    response = authenticated_client(admin_user).patch(
        f"/api/users/{admin_user.id}/",
        payload,
        format="json",
    )

    assert response.status_code == 400
    assert error_field in response.data["details"]
    admin_user.refresh_from_db()
    assert admin_user.is_active is True
    assert admin_user.role == get_user_model().Role.ADMIN


def test_admin_can_still_update_their_own_profile(admin_user):
    response = authenticated_client(admin_user).patch(
        f"/api/users/{admin_user.id}/",
        {"full_name": "Tên quản trị mới"},
        format="json",
    )

    assert response.status_code == 200
    admin_user.refresh_from_db()
    assert admin_user.full_name == "Tên quản trị mới"


def test_user_delete_method_is_not_allowed(admin_user, member_user):
    response = authenticated_client(admin_user).delete(
        f"/api/users/{member_user.id}/"
    )

    assert response.status_code == 405
