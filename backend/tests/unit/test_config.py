from coinvault.core.config import Settings, redact_mapping, redact_setting


def test_missing_required_values_reports_placeholder_secrets() -> None:
    settings = Settings()
    missing = settings.missing_required_values()
    assert "SUPABASE_ANON_KEY" in missing
    assert "SUPABASE_SERVICE_ROLE_KEY" in missing


def test_redact_setting_hides_secret_values() -> None:
    assert redact_setting("SUPABASE_SERVICE_ROLE_KEY", "super-secret") == "[redacted]"
    assert redact_setting("SUPABASE_URL", "http://127.0.0.1:54321") == "http://127.0.0.1:54321"


def test_redact_mapping_hides_secret_values() -> None:
    redacted = redact_mapping([("TOKEN", "abc"), ("APP_ENV", "local")])
    assert redacted == {"TOKEN": "[redacted]", "APP_ENV": "local"}
