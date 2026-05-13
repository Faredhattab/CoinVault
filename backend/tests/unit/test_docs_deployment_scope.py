from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_docs_state_deployment_is_deferred() -> None:
    content = (ROOT / "docs" / "local-foundation.md").read_text(encoding="utf-8").lower()
    assert "preview" in content
    assert "production" in content
    assert "deferred" in content
