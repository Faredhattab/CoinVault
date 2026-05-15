from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from coinvault.main import app

client = TestClient(app)


@pytest.fixture
def mock_supabase() -> Generator[MagicMock, None, None]:
    with patch("coinvault.middleware.auth_middleware.supabase_anon") as mock:
        yield mock


@pytest.fixture
def mock_auth_service() -> Generator[MagicMock, None, None]:
    with patch("coinvault.api.auth.auth_service") as mock:
        yield mock


def test_get_me_unauthenticated() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_authenticated(
    mock_supabase: MagicMock, mock_auth_service: MagicMock
) -> None:
    user_id = str(uuid4())
    # Mock supabase.auth.get_user
    mock_supabase.auth.get_user.return_value = MagicMock(
        user=MagicMock(id=user_id, email="test@example.com")
    )

    # Mock auth_service.get_user_profile
    mock_auth_service.get_user_profile = AsyncMock(
        return_value={
            "id": user_id,
            "email": "test@example.com",
            "role": "admin",
            "linked_providers": [],
            "created_at": "2026-05-14T00:00:00",
            "updated_at": "2026-05-14T00:00:00",
        }
    )

    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer valid-token"}
    )

    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
