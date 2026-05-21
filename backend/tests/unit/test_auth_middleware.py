from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from coinvault.middleware.auth_middleware import (
    get_current_user,
    get_token,
    require_admin,
    require_role,
)


@pytest.mark.asyncio
async def test_get_token_missing() -> None:
    mock_request = MagicMock()
    mock_request.headers = {}
    with pytest.raises(HTTPException) as exc:
        await get_token(mock_request)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_token_invalid_format() -> None:
    mock_request = MagicMock()
    mock_request.headers = {"Authorization": "invalid"}
    with pytest.raises(HTTPException) as exc:
        await get_token(mock_request)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_invalid_token() -> None:
    with patch("coinvault.middleware.auth_middleware.supabase_anon.auth.get_user") as mock_get_user:
        mock_get_user.return_value = MagicMock(user=None)
        mock_request = MagicMock()
        with pytest.raises(HTTPException) as exc:
            await get_current_user("invalid-token", mock_request)
        assert exc.value.status_code == 401


# --- T117: Role verification at API endpoints ---


@pytest.mark.asyncio
async def test_require_admin_success() -> None:
    """User with admin role passes the require_admin dependency."""
    mock_user = MagicMock()
    mock_user.id = "admin-user-id"
    token = "valid-admin-token"

    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock_get_client:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = {"role": "admin"}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = await require_admin(user=mock_user, token=token)
        assert result == mock_user


@pytest.mark.asyncio
async def test_require_admin_forbidden() -> None:
    """User without admin role gets 403 Forbidden."""
    mock_user = MagicMock()
    mock_user.id = "regular-user-id"
    token = "valid-user-token"

    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock_get_client:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = {"role": "user"}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        with pytest.raises(HTTPException) as exc:
            await require_admin(user=mock_user, token=token)
        assert exc.value.status_code == 403
        assert "Admin privileges required" in exc.value.detail


@pytest.mark.asyncio
async def test_require_admin_no_profile() -> None:
    """User with no profile in the database gets 403 Forbidden."""
    mock_user = MagicMock()
    mock_user.id = "no-profile-user-id"
    token = "valid-token-no-profile"

    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock_get_client:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = None
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        with pytest.raises(HTTPException) as exc:
            await require_admin(user=mock_user, token=token)
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_require_role_custom_role_success() -> None:
    """User with the correct custom role passes the role check."""
    mock_user = MagicMock()
    mock_user.id = "editor-user-id"
    token = "valid-editor-token"

    # Create the dependency function for "editor" role
    role_dependency = require_role("editor")

    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock_get_client:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = {"role": "editor"}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = await role_dependency(user=mock_user, token=token)
        assert result == mock_user


@pytest.mark.asyncio
async def test_require_role_wrong_role() -> None:
    """User with wrong role gets 403 Forbidden."""
    mock_user = MagicMock()
    mock_user.id = "user-wrong-role"
    token = "valid-token-wrong-role"

    # Create the dependency function for "editor" role
    role_dependency = require_role("editor")

    with patch("coinvault.middleware.auth_middleware.get_user_client") as mock_get_client:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = {"role": "viewer"}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        with pytest.raises(HTTPException) as exc:
            await role_dependency(user=mock_user, token=token)
        assert exc.value.status_code == 403
        assert "editor" in exc.value.detail
