from __future__ import annotations

from urllib.error import URLError
from urllib.request import Request, urlopen


def storage_reachable(
    storage_url: str, timeout_seconds: float = 1.0
) -> tuple[bool, str]:
    if not storage_url:
        return False, "Local storage service URL is not configured"

    request = Request(storage_url.rstrip("/") + "/bucket", method="GET")
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            # 2xx = success, 4xx = service is up but unauthorized (still reachable)
            if 200 <= response.status < 500:
                return True, "Local storage service reachable"
    except (OSError, URLError) as e:
        # Check if it's a 403 Forbidden (service is up but needs auth)
        if hasattr(e, "code") and e.code == 403:
            return True, "Local storage service reachable (requires auth)"
    return False, "Local storage service is not reachable"
