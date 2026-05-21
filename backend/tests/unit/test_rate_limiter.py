from typing import Any
from unittest.mock import MagicMock

import pytest

from coinvault.services.rate_limiter import RateLimiter


@pytest.fixture
def rate_limiter() -> RateLimiter:
    mock_supabase = MagicMock()
    return RateLimiter(client=mock_supabase)


def test_is_rate_limited_false(rate_limiter: RateLimiter) -> None:
    # Mocking audit log check: 0 failed attempts
    mock_response = MagicMock()
    mock_response.count = 0
    client: Any = rate_limiter.client
    # Mocking the chain: table().select().eq().eq().gt().execute()
    client.table.return_value.select.return_value.eq.return_value.eq.return_value.gt.return_value.execute.return_value = mock_response

    assert rate_limiter.is_rate_limited("127.0.0.1") is False


def test_is_rate_limited_true(rate_limiter: RateLimiter) -> None:
    # Mocking audit log check: 5 failed attempts
    mock_response = MagicMock()
    mock_response.count = 5
    client: Any = rate_limiter.client
    client.table.return_value.select.return_value.eq.return_value.eq.return_value.gt.return_value.execute.return_value = mock_response

    assert rate_limiter.is_rate_limited("127.0.0.1") is True
