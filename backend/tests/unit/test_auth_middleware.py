from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from coinvault.middleware.auth_middleware import get_current_user, get_token


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
    with patch(
        "coinvault.middleware.auth_middleware.supabase_anon.auth.get_user"
    ) as mock_get_user:
        mock_get_user.return_value = MagicMock(user=None)
        with pytest.raises(HTTPException) as exc:
            await get_current_user("invalid-token")
        assert exc.value.status_code == 401
