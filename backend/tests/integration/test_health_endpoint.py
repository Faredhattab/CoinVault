from fastapi.testclient import TestClient

from coinvault.main import create_app


def test_health_endpoint_matches_contract_shape() -> None:
    client = TestClient(create_app())
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "degraded", "unavailable"}
    assert "checked_at" in payload
    assert set(payload["services"]) == {"web", "backend", "database", "auth", "storage", "migrations", "admin"}
    for service in payload["services"].values():
        assert service["status"] in {"ok", "degraded", "unavailable"}
        assert service["message"]
