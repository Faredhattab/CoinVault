from datetime import UTC, datetime, timedelta
from typing import Any, cast

from postgrest.types import CountMethod
from supabase import Client

from coinvault.core.config import settings
from coinvault.services.supabase_client import supabase_admin


class RateLimiter:
    def __init__(self, client: Client = supabase_admin) -> None:
        self.client = client
        self.max_attempts = settings.rate_limit_login_attempts
        self.window_minutes = settings.rate_limit_window_minutes

    def is_rate_limited(self, ip_address: str | None) -> bool:
        """
        Check if IP address is rate limited based on failed login attempts in audit log.
        """
        if not ip_address:
            return False

        since = datetime.now(UTC) - timedelta(minutes=self.window_minutes)

        response = (
            self.client.table("auth_audit_log")
            .select("id", count=CountMethod.exact)
            .eq("ip_address", ip_address)
            .eq("event_type", "login_failure")
            .gt("created_at", since.isoformat())
            .execute()
        )

        return (
            response.count if response.count is not None else 0
        ) >= self.max_attempts

    def log_failed_attempt(
        self, ip_address: str, email: str, reason: str, user_agent: str | None = None
    ) -> None:
        """
        Log a failed login attempt to the audit log.
        """
        # Fetch user_id if email exists in profiles
        user_response = (
            self.client.table("profiles").select("id").eq("email", email).execute()
        )
        data = cast(list[dict[str, Any]], user_response.data)
        user_id = data[0]["id"] if data else None

        event_data = {"reason": reason, "email": email}

        self.client.table("auth_audit_log").insert(
            {
                "user_id": user_id,
                "event_type": "login_failure",
                "event_data": event_data,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "success": False,
            }
        ).execute()

    def log_success(
        self,
        user_id: str,
        session_id: str,
        ip_address: str,
        user_agent: str | None = None,
    ) -> None:
        """
        Log a successful login to the audit log.
        """
        self.client.table("auth_audit_log").insert(
            {
                "user_id": user_id,
                "session_id": session_id,
                "event_type": "login_success",
                "ip_address": ip_address,
                "user_agent": user_agent,
                "success": True,
            }
        ).execute()
