from django.conf import settings
from rest_framework.test import APIClient


def test_health_endpoint_is_public():
    response = APIClient().get("/api/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "taskflow-api"}


def test_api_errors_use_standard_envelope():
    response = APIClient().post("/api/health/", data={})

    assert response.status_code == 405
    payload = response.json()
    assert payload["code"] == "method_not_allowed"
    assert isinstance(payload["message"], str) and payload["message"]
    assert payload["details"] == {}


def test_openapi_schema_is_available_and_contains_health_endpoint():
    response = APIClient().get("/api/schema/", HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    assert "/api/health/" in response.json()["paths"]


def test_rest_framework_has_contract_defaults():
    assert settings.REST_FRAMEWORK["DEFAULT_PAGINATION_CLASS"] == (
        "rest_framework.pagination.PageNumberPagination"
    )
    assert settings.REST_FRAMEWORK["PAGE_SIZE"] == 20
    assert settings.REST_FRAMEWORK["EXCEPTION_HANDLER"] == (
        "apps.core.exceptions.api_exception_handler"
    )
