from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

from postgrest.types import CountMethod
from supabase import Client

from coinvault.core.config import settings
from coinvault.core.logging import logger
from coinvault.services.supabase_client import supabase_admin


class SessionLimitExceeded(Exception):
    def __init__(self, message: str, sessions: list[dict[str, Any]]):
        self.message = message
        self.sessions = sessions
        super().__init__(message)


class SessionService:
    def __init__(self, client: Client = supabase_admin) -> None:
        self.client = client
        self.timeout_days = settings.session_timeout_days
        self.max_sessions = settings.max_concurrent_sessions

    def _calculate_expiration(self) -> datetime:
        return datetime.now(UTC) + timedelta(days=self.timeout_days)

    def create_session(
        self,
        user_id: UUID,
        device_info: dict[str, Any],
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """
        Create a new session in PostgreSQL.
        Enforces concurrent session limit.
        """
        # 1. Count active sessions
        response = (
            self.client.table("sessions")
            .select("id", count=CountMethod.exact)
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .execute()
        )
        active_count = response.count if response.count is not None else 0

        if active_count >= self.max_sessions:
            logger.warning(f"Session limit reached for user {user_id}")
            # Fetch user's active sessions to return to frontend
            sessions = self.get_user_sessions(str(user_id))
            active_sessions = [
                {
                    "id": str(s["id"]),
                    "device": s["device_info"].get("browser", "Unknown"),
                    "ip_address": s["ip_address"],
                    "last_activity": s["last_activity"],
                }
                for s in sessions
                if s.get("is_active")
            ]
            raise SessionLimitExceeded(
                message=f"Maximum concurrent sessions ({self.max_sessions}) reached. Please revoke an existing session.",
                sessions=active_sessions,
            )

        # 2. Create session
        expires_at = self._calculate_expiration()
        session_data = {
            "user_id": str(user_id),
            "device_info": device_info,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": expires_at.isoformat(),
            "is_active": True,
        }

        response = self.client.table("sessions").insert(session_data).execute()
        if not response.data:
            raise ValueError("Failed to create session")
        return cast(dict[str, Any], response.data[0])

    def validate_session(self, session_id: str) -> bool:
        """
        Check if session is active and not expired.
        Updates last_activity for sliding window.
        """
        response = (
            self.client.table("sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = response.data

        if not session or not isinstance(session, dict) or not session.get("is_active"):
            return False

        expires_at_str = session.get("expires_at")
        if not expires_at_str or not isinstance(expires_at_str, str):
            return False

        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
        if expires_at < datetime.now(UTC).astimezone(expires_at.tzinfo):
            # Mark as inactive if expired
            self.client.table("sessions").update({"is_active": False}).eq(
                "id", session_id
            ).execute()
            return False

        # Update last_activity and slide expiration
        new_expiry = self._calculate_expiration()
        self.client.table("sessions").update(
            {
                "last_activity": datetime.now(UTC).isoformat(),
                "expires_at": new_expiry.isoformat(),
            }
        ).eq("id", session_id).execute()

        return True

    def revoke_session(self, session_id: str) -> Any:
        """
        Deactivate a session
        """
        return (
            self.client.table("sessions")
            .update({"is_active": False})
            .eq("id", session_id)
            .execute()
        )

    def get_user_sessions(self, user_id: str) -> list[dict[str, Any]]:
        """
        Get all sessions for a user
        """
        response = (
            self.client.table("sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("last_activity", desc=True)
            .execute()
        )
        return cast(list[dict[str, Any]], response.data) if response.data else []
