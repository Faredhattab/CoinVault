from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_release_validation_script_covers_required_checks() -> None:
    content = (ROOT / "scripts" / "validate-release.ps1").read_text(encoding="utf-8")
    for expected in ["Documentation", "Backend syntax", "Frontend package", "Health contract"]:
        assert expected in content
