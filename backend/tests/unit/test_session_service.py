from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from coinvault.services.session_service import SessionLimitExceeded, SessionService


@pytest.fixture
def session_service() -> SessionService:
    mock_supabase = MagicMock()
    return SessionService(client=mock_supabase)


def test_calculate_expiration(session_service: SessionService) -> None:
    now = datetime.now(UTC)
    with patch("coinvault.services.session_service.datetime") as mock_datetime:
        mock_datetime.now.return_value = now
        # Accessing private method for testing logic
        expires_at = session_service._calculate_expiration()
        assert expires_at == now + timedelta(days=7)


def test_create_session(session_service: SessionService) -> None:
    user_id = uuid4()
    device_info = {"browser": "Chrome"}
    client: Any = session_service.client

    # Mock find_existing_session to return None (no existing session)
    mock_find = MagicMock()
    mock_find.data = []
    client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.eq.return_value.gt.return_value.limit.return_value.execute.return_value = mock_find

    # Mocking the insert call (no COUNT check anymore - handled by DB trigger)
    mock_response_insert = MagicMock()
    mock_response_insert.data = [{"id": str(uuid4())}]
    client.table.return_value.insert.return_value.execute.return_value = (
        mock_response_insert
    )

    session = session_service.create_session(
        user_id, device_info, "127.0.0.1", "Mozilla/5.0"
    )
    assert session is not None
    assert client.table.called


def test_create_session_limit_exceeded(session_service: SessionService) -> None:
    user_id = uuid4()
    client: Any = session_service.client

    # Mock find_existing_session to return None (no existing session to renew)
    mock_find = MagicMock()
    mock_find.data = []

    # Mock the insert to raise a database error with "session_limit_exceeded"
    # This simulates the database trigger firing
    mock_error = Exception("session_limit_exceeded: Maximum concurrent sessions (3) reached")

    # Mocking get_user_sessions for the exception payload
    mock_response_sessions = MagicMock()
    mock_response_sessions.data = [
        {
            "id": str(uuid4()),
            "device_info": {"browser": "Chrome"},
            "ip_address": "1.1.1.1",
            "last_activity": "2026-05-15T00:00:00",
            "expires_at": "2026-05-22T00:00:00",
            "is_active": True,
        }
    ]

    # Setup mock returns in order: find_existing (empty), insert (error), get_user_sessions (sessions list)
    client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.eq.return_value.gt.return_value.limit.return_value.execute.return_value = mock_find
    client.table.return_value.insert.return_value.execute.side_effect = mock_error
    client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response_sessions

    with pytest.raises(SessionLimitExceeded) as exc:
        session_service.create_session(user_id, {})

    assert "Maximum concurrent sessions" in str(exc.value)
    assert len(exc.value.sessions) > 0
    assert exc.value.sessions[0]["device"] == "Chrome"
    assert "expires_at" in exc.value.sessions[0]
