from __future__ import annotations

from urllib.error import URLError
from urllib.request import Request, urlopen


def auth_reachable(supabase_url: str, timeout_seconds: float = 1.0) -> tuple[bool, str]:
    if not supabase_url:
        return False, "Local auth service URL is not configured"

    request = Request(f"{supabase_url.rstrip('/')}/auth/v1/health", method="GET")
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            if 200 <= response.status < 500:
                return True, "Local auth service reachable"
    except (OSError, URLError):
        pass
    return False, "Local auth service is not reachable"
