import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction


pytestmark = pytest.mark.django_db


def test_user_uses_email_as_login_and_defaults_to_member():
    user_model = get_user_model()

    user = user_model.objects.create_user(
        email="  AN@example.com ",
        password="StrongPass123!",
        full_name="Nguyễn Văn An",
    )

    assert user_model.USERNAME_FIELD == "email"
    assert user.email == "an@example.com"
    assert user.full_name == "Nguyễn Văn An"
    assert user.role == user_model.Role.MEMBER
    assert user.check_password("StrongPass123!")
    assert not hasattr(user, "username")


def test_superuser_is_always_admin():
    user_model = get_user_model()

    admin = user_model.objects.create_superuser(
        email="admin@example.com",
        password="StrongPass123!",
    )

    assert admin.role == user_model.Role.ADMIN
    assert admin.is_staff is True
    assert admin.is_superuser is True


def test_email_is_case_insensitively_unique():
    user_model = get_user_model()
    user_model.objects.create_user(
        email="member@example.com",
        password="StrongPass123!",
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        user_model.objects.create_user(
            email="MEMBER@example.com",
            password="StrongPass123!",
        )
