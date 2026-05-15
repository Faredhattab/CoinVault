from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from coinvault.main import app

client = TestClient(app)


@pytest.fixture
def mock_auth_service() -> Generator[MagicMock, None, None]:
    with patch("coinvault.api.auth.auth_service", spec=True) as mock:
        mock.authenticate_user = AsyncMock()
        mock.get_user_profile = AsyncMock()
        yield mock


@pytest.fixture
def mock_session_service() -> Generator[MagicMock, None, None]:
    with patch("coinvault.api.auth.session_service", spec=True) as mock:
        mock.create_session = MagicMock()
        yield mock


@pytest.fixture
def mock_rate_limiter() -> Generator[MagicMock, None, None]:
    with patch("coinvault.api.auth.rate_limiter", spec=True) as mock:
        mock.is_rate_limited = MagicMock()
        yield mock


def test_login_success(
    mock_auth_service: MagicMock,
    mock_session_service: MagicMock,
    mock_rate_limiter: MagicMock,
) -> None:
    # Setup mocks
    mock_rate_limiter.is_rate_limited.return_value = False
    user_id = str(uuid4())
    session_id = str(uuid4())

    mock_auth_service.authenticate_user.return_value = MagicMock(
        user=MagicMock(id=user_id, email="test@example.com"),
        session=MagicMock(access_token="access", refresh_token="refresh"),
    )
    mock_auth_service.get_user_profile.return_value = {
        "id": user_id,
        "email": "test@example.com",
        "role": "admin",
        "linked_providers": [],
        "created_at": "2026-05-14T00:00:00",
        "updated_at": "2026-05-14T00:00:00",
    }
    mock_session_service.create_session.return_value = {
        "id": session_id,
        "user_id": user_id,
        "device_info": {},
        "is_active": True,
        "created_at": "2026-05-14T00:00:00",
        "last_activity": "2026-05-14T00:00:00",
        "expires_at": "2026-05-21T00:00:00",
    }

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "SecurePassword123!"},
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["user"]["role"] == "admin"


def test_login_rate_limited(mock_rate_limiter: MagicMock) -> None:
    mock_rate_limiter.is_rate_limited.return_value = True

    response = client.post(
        "/api/v1/auth/login", json={"email": "test@example.com", "password": "any"}
    )

    assert response.status_code == 429
    assert "Too many failed attempts" in response.json()["detail"]
