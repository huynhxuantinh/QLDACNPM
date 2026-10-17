import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db


@pytest.fixture
def member():
    return get_user_model().objects.create_user(
        email="member@example.com",
        password="StrongPass123!",
        full_name="Thành viên",
    )


def login(client, email="member@example.com", password="StrongPass123!"):
    return client.post(
        "/api/auth/login/",
        {"email": email, "password": password},
        format="json",
    )


def test_login_returns_tokens_and_current_user(member):
    response = login(APIClient())

    assert response.status_code == 200
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["user"]["email"] == member.email
    assert "password" not in response.data["user"]


def test_invalid_login_uses_error_envelope(member):
    response = login(APIClient(), password="wrong-password")

    assert response.status_code == 401
    assert response.data["code"] == "no_active_account"
    assert response.data["details"] == {}


def test_refresh_and_logout_revoke_refresh_token(member):
    client = APIClient()
    tokens = login(client).data

    refreshed = client.post(
        "/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json"
    )
    assert refreshed.status_code == 200
    assert refreshed.data["access"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    logged_out = client.post(
        "/api/auth/logout/", {"refresh": tokens["refresh"]}, format="json"
    )
    assert logged_out.status_code == 204

    rejected = APIClient().post(
        "/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json"
    )
    assert rejected.status_code == 401


def test_me_requires_authentication_and_returns_profile(member):
    anonymous = APIClient().get("/api/auth/me/")
    assert anonymous.status_code == 401

    client = APIClient()
    access = login(client).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    response = client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["email"] == member.email
    assert response.data["role"] == "MEMBER"


def test_change_password_checks_old_password(member):
    client = APIClient()
    access = login(client).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    wrong = client.post(
        "/api/auth/change-password/",
        {"old_password": "wrong", "new_password": "NewStrongPass456!"},
        format="json",
    )
    assert wrong.status_code == 400

    changed = client.post(
        "/api/auth/change-password/",
        {
            "old_password": "StrongPass123!",
            "new_password": "NewStrongPass456!",
        },
        format="json",
    )
    assert changed.status_code == 200
    assert login(APIClient(), password="NewStrongPass456!").status_code == 200


def test_inactive_user_cannot_use_existing_access_token(member):
    client = APIClient()
    access = login(client).data["access"]
    member.is_active = False
    member.save(update_fields=["is_active", "updated_at"])

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    response = client.get("/api/auth/me/")

    assert response.status_code == 401
