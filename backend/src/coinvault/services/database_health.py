from __future__ import annotations

import socket
from urllib.parse import urlparse


def database_reachable(
    database_url: str, timeout_seconds: float = 1.0
) -> tuple[bool, str]:
    parsed = urlparse(database_url)
    host = parsed.hostname
    port = parsed.port or 5432
    if not host:
        return False, "Local database host is not configured"

    try:
        with socket.create_connection((host, port), timeout=timeout_seconds):
            return True, "Local database reachable"
    except OSError:
        return False, "Local database is not reachable"
