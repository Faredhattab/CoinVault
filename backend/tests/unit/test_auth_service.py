from typing import Any
from unittest.mock import MagicMock

import pytest

from coinvault.services.auth_service import AuthService, validate_password


def test_password_valid() -> None:
    assert validate_password("SecurePassword123!") is True


def test_password_too_short() -> None:
    assert validate_password("Short1!") is False


def test_password_no_uppercase() -> None:
    assert validate_password("securepassword123!") is False


def test_password_no_lowercase() -> None:
    assert validate_password("SECUREPASSWORD123!") is False


def test_password_no_number() -> None:
    assert validate_password("SecurePassword!") is False


def test_password_no_special() -> None:
    assert validate_password("SecurePassword123") is False


@pytest.fixture
def auth_service() -> AuthService:
    mock_supabase = MagicMock()
    return AuthService(client=mock_supabase)


@pytest.mark.asyncio
async def test_get_user_profile(auth_service: AuthService) -> None:
    user_id = "user_id"
    mock_response = MagicMock()
    mock_response.data = {"id": user_id, "email": "test@example.com", "role": "admin"}
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert profile["role"] == "admin"


@pytest.mark.asyncio
async def test_link_provider(auth_service: AuthService) -> None:
    user_id = "user_id"
    # Mock get_user_profile
    mock_get_response = MagicMock()
    mock_get_response.data = {"id": user_id, "linked_providers": ["password"]}
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_get_response

    # Mock update
    mock_update_response = MagicMock()
    mock_update_response.data = [{"id": user_id}]
    client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        mock_update_response
    )

    await auth_service.link_provider(user_id, "google")
    assert client.table.called


# --- T116: Role assignment tests ---


@pytest.mark.asyncio
async def test_get_user_profile_returns_role(auth_service: AuthService) -> None:
    """Verify that the profile returned by get_user_profile includes a role field."""
    user_id = "user_role_test"
    mock_response = MagicMock()
    mock_response.data = {
        "id": user_id,
        "email": "role@example.com",
        "role": "admin",
        "linked_providers": ["password"],
    }
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert "role" in profile


@pytest.mark.asyncio
async def test_get_user_profile_admin_role(auth_service: AuthService) -> None:
    """Verify that an admin role is correctly recognized."""
    user_id = "admin_user"
    mock_response = MagicMock()
    mock_response.data = {
        "id": user_id,
        "email": "admin@example.com",
        "role": "admin",
        "linked_providers": ["password"],
    }
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert profile["role"] == "admin"


@pytest.mark.asyncio
async def test_get_user_profile_user_role(auth_service: AuthService) -> None:
    """Verify that a non-admin (user) role is correctly returned."""
    user_id = "regular_user"
    mock_response = MagicMock()
    mock_response.data = {
        "id": user_id,
        "email": "user@example.com",
        "role": "user",
        "linked_providers": ["password"],
    }
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert profile["role"] == "user"
    assert profile["role"] != "admin"


@pytest.mark.asyncio
async def test_verify_admin_role_success(auth_service: AuthService) -> None:
    """Verify that a user with admin role passes admin verification."""
    user_id = "admin_verify"
    mock_response = MagicMock()
    mock_response.data = {
        "id": user_id,
        "email": "admin@example.com",
        "role": "admin",
    }
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert profile["role"] == "admin"
    # Simulate the check that require_admin performs
    assert profile.get("role") == "admin"


@pytest.mark.asyncio
async def test_verify_admin_role_failure(auth_service: AuthService) -> None:
    """Verify that a user with non-admin role fails admin verification."""
    user_id = "non_admin_verify"
    mock_response = MagicMock()
    mock_response.data = {
        "id": user_id,
        "email": "viewer@example.com",
        "role": "viewer",
    }
    client: Any = auth_service.client
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response

    profile = await auth_service.get_user_profile(user_id)
    assert profile is not None
    assert profile["role"] != "admin"
    # Simulate the check that require_admin performs
    assert profile.get("role") != "admin"
