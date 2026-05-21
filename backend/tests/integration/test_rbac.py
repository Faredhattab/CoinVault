"""T118: Integration tests for role-based access control (RBAC).

Tests verify that the FastAPI application correctly enforces admin and role-based
access controls on protected endpoints using mocked Supabase calls.
"""

from collections.abc import Generator
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from coinvault.main import app

client = TestClient(app)


@pytest.fixture
def admin_user_id() -> str:
    return str(uuid4())


@pytest.fixture
def regular_user_id() -> str:
    return str(uuid4())


@pytest.fixture
def mock_supabase_anon() -> Generator[MagicMock, None, None]:
    with patch("coinvault.middleware.auth_middleware.supabase_anon") as mock:
        yield mock


@pytest.fixture
def mock_supabase_admin() -> Generator[MagicMock, None, None]:
    with patch("coinvault.middleware.auth_middleware.supabase_admin") as mock:
        yield mock


@pytest.fixture
def mock_user_client() -> Generator[MagicMock, None, None]:
    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock:
        yield mock


def _mock_authenticated_user(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    user_id: str,
) -> None:
    """Set up mocks so that get_current_user succeeds for the given user_id."""
    # Mock supabase_anon.auth.get_user to return a valid user
    mock_supabase_anon.auth.get_user.return_value = MagicMock(
        user=MagicMock(id=user_id, email="test@example.com")
    )

    # Mock session query to return an active session
    mock_session_response = MagicMock()
    mock_session_response.data = [{"id": "00000000-0000-0000-0000-000000000000"}]
    mock_supabase_admin.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.gt.return_value.limit.return_value.execute.return_value = mock_session_response


def _mock_user_profile(
    mock_user_client: MagicMock,
    role: str,
) -> None:
    """Set up the user client mock to return a profile with the given role."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = {"role": role}
    mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
    mock_user_client.return_value = mock_client


def _mock_user_profile_none(mock_user_client: MagicMock) -> None:
    """Set up the user client mock to return no profile."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = None
    mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
    mock_user_client.return_value = mock_client


# --- Tests using /api/v1/auth/me which requires get_current_user ---


def test_admin_endpoint_unauthenticated() -> None:
    """Unauthenticated request (no token) gets 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_admin_endpoint_with_admin_role(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    admin_user_id: str,
) -> None:
    """Admin user can access an authenticated endpoint successfully.

    Uses /api/v1/auth/me which requires get_current_user. We also mock
    the auth_service.get_user_profile used by the /me endpoint itself.
    """
    _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, admin_user_id)

    # Mock the auth_service.get_user_profile for the /me endpoint handler
    with patch("coinvault.api.auth.auth_service") as mock_auth_svc:
        from unittest.mock import AsyncMock

        mock_auth_svc.get_user_profile = AsyncMock(
            return_value={
                "id": admin_user_id,
                "email": "admin@example.com",
                "role": "admin",
                "linked_providers": ["password"],
                "created_at": "2026-05-18T00:00:00",
                "updated_at": "2026-05-18T00:00:00",
            }
        )

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer valid-admin-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert data["email"] == "admin@example.com"


def test_admin_endpoint_with_user_role(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    regular_user_id: str,
) -> None:
    """Non-admin user accessing an authenticated endpoint gets the profile with user role.

    The /me endpoint does not require admin, so a 'user' role is still accessible.
    This test validates the role is correctly propagated.
    """
    _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, regular_user_id)

    with patch("coinvault.api.auth.auth_service") as mock_auth_svc:
        from unittest.mock import AsyncMock

        mock_auth_svc.get_user_profile = AsyncMock(
            return_value={
                "id": regular_user_id,
                "email": "user@example.com",
                "role": "user",
                "linked_providers": ["password"],
                "created_at": "2026-05-18T00:00:00",
                "updated_at": "2026-05-18T00:00:00",
            }
        )

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer valid-user-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "user"


# --- Tests for require_admin dependency directly via a test route ---


def test_require_admin_integration_success(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    admin_user_id: str,
) -> None:
    """Admin role passes require_admin dependency at integration level."""
    from fastapi import Depends
    from fastapi.routing import APIRoute

    from coinvault.middleware.auth_middleware import require_admin

    # Add a temporary test route that uses require_admin
    @app.get("/api/v1/_test_admin_only")
    async def _test_admin_route(user=Depends(require_admin)):  # type: ignore[no-untyped-def]
        return {"user_id": str(user.id), "access": "granted"}

    try:
        _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, admin_user_id)
        _mock_user_profile(mock_user_client, "admin")

        response = client.get(
            "/api/v1/_test_admin_only",
            headers={"Authorization": "Bearer valid-admin-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access"] == "granted"
    finally:
        # Remove the temporary route
        app.routes[:] = [
            r
            for r in app.routes
            if not (isinstance(r, APIRoute) and r.path == "/api/v1/_test_admin_only")
        ]


def test_require_admin_integration_forbidden(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    regular_user_id: str,
) -> None:
    """Non-admin role gets 403 from require_admin dependency."""
    from fastapi import Depends
    from fastapi.routing import APIRoute

    from coinvault.middleware.auth_middleware import require_admin

    @app.get("/api/v1/_test_admin_only_2")
    async def _test_admin_route_2(user=Depends(require_admin)):  # type: ignore[no-untyped-def]
        return {"access": "granted"}

    try:
        _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, regular_user_id)
        _mock_user_profile(mock_user_client, "user")

        response = client.get(
            "/api/v1/_test_admin_only_2",
            headers={"Authorization": "Bearer valid-user-token"},
        )

        assert response.status_code == 403
        assert "Admin privileges required" in response.json()["detail"]
    finally:
        app.routes[:] = [
            r
            for r in app.routes
            if not (isinstance(r, APIRoute) and r.path == "/api/v1/_test_admin_only_2")
        ]


def test_role_based_endpoint_correct_role(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    admin_user_id: str,
) -> None:
    """User with the correct role passes require_role dependency."""
    from fastapi import Depends
    from fastapi.routing import APIRoute

    from coinvault.middleware.auth_middleware import require_role

    @app.get("/api/v1/_test_editor_only")
    async def _test_editor_route(user=Depends(require_role("editor"))):  # type: ignore[no-untyped-def]
        return {"user_id": str(user.id), "access": "granted"}

    try:
        _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, admin_user_id)
        _mock_user_profile(mock_user_client, "editor")

        response = client.get(
            "/api/v1/_test_editor_only",
            headers={"Authorization": "Bearer valid-editor-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access"] == "granted"
    finally:
        app.routes[:] = [
            r
            for r in app.routes
            if not (isinstance(r, APIRoute) and r.path == "/api/v1/_test_editor_only")
        ]


def test_role_based_endpoint_wrong_role(
    mock_supabase_anon: MagicMock,
    mock_supabase_admin: MagicMock,
    mock_user_client: MagicMock,
    regular_user_id: str,
) -> None:
    """User with the wrong role gets 403 from require_role dependency."""
    from fastapi import Depends
    from fastapi.routing import APIRoute

    from coinvault.middleware.auth_middleware import require_role

    @app.get("/api/v1/_test_editor_only_2")
    async def _test_editor_route_2(user=Depends(require_role("editor"))):  # type: ignore[no-untyped-def]
        return {"access": "granted"}

    try:
        _mock_authenticated_user(mock_supabase_anon, mock_supabase_admin, regular_user_id)
        _mock_user_profile(mock_user_client, "viewer")

        response = client.get(
            "/api/v1/_test_editor_only_2",
            headers={"Authorization": "Bearer valid-viewer-token"},
        )

        assert response.status_code == 403
        assert "editor" in response.json()["detail"]
    finally:
        app.routes[:] = [
            r
            for r in app.routes
            if not (isinstance(r, APIRoute) and r.path == "/api/v1/_test_editor_only_2")
        ]
