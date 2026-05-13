from __future__ import annotations

from urllib.error import URLError
from urllib.request import Request, urlopen


def storage_reachable(storage_url: str, timeout_seconds: float = 1.0) -> tuple[bool, str]:
    if not storage_url:
        return False, "Local storage service URL is not configured"

    request = Request(storage_url.rstrip("/"), method="GET")
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            if 200 <= response.status < 500:
                return True, "Local storage service reachable"
    except (OSError, URLError):
        pass
    return False, "Local storage service is not reachable"
