import sys
from importlib import import_module


def test_production_security_settings_are_enabled(monkeypatch):
    monkeypatch.setenv(
        "DJANGO_SECRET_KEY",
        "production-test-secret-with-more-than-sixty-four-characters-for-safety",
    )
    monkeypatch.setenv("DJANGO_ALLOWED_HOSTS", "api.example.com")
    sys.modules.pop("config.settings_production", None)
    settings = import_module("config.settings_production")

    assert settings.DEBUG is False
    assert settings.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")
    assert settings.SESSION_COOKIE_SECURE is True
    assert settings.CSRF_COOKIE_SECURE is True
    assert settings.SECURE_HSTS_SECONDS >= 3600
    assert settings.SECURE_HSTS_INCLUDE_SUBDOMAINS is True
    assert settings.STATICFILES_STORAGE == (
        "whitenoise.storage.CompressedManifestStaticFilesStorage"
    )
