from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_env_example_has_no_obvious_real_secrets() -> None:
    content = (ROOT / ".env.example").read_text(encoding="utf-8")
    forbidden = ["eyJ", "sk_", "service_role_secret", "password123"]
    assert all(value not in content for value in forbidden)
    assert "replace-with-local-service-role-key" in content
