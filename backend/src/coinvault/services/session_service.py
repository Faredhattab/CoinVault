from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

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

    def find_existing_session(
        self,
        user_id: UUID | str,
        ip_address: str | None,
        user_agent: str | None,
    ) -> dict[str, Any] | None:
        """
        Find an existing active session for the same user + device fingerprint.
        Device fingerprint = IP address + user agent
        """
        user_id_str = str(user_id)
        now = datetime.now(UTC)

        response = (
            self.client.table("sessions")
            .select("*")
            .eq("user_id", user_id_str)
            .eq("is_active", True)
            .eq("ip_address", ip_address)
            .eq("user_agent", user_agent)
            .gt("expires_at", now.isoformat())  # Not expired
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            return cast(dict[str, Any], response.data[0])
        return None

    def create_session(
        self,
        user_id: UUID | str,
        device_info: dict[str, Any],
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """
        Create or renew a session in PostgreSQL.
        If an active session exists for the same user + device, renew it.
        Otherwise, create a new session (enforces concurrent session limit via trigger).
        """
        # Convert user_id to string once at the boundary
        user_id_str = str(user_id)

        # Check if an active session already exists for this device
        existing_session = self.find_existing_session(user_id_str, ip_address, user_agent)

        if existing_session:
            # Renew the existing session
            logger.info(
                f"Renewing existing session {existing_session['id']} for user {user_id_str}"
            )
            new_expiry = self._calculate_expiration()
            now = datetime.now(UTC)

            response = self.client.table("sessions").update({
                "last_activity": now.isoformat(),
                "expires_at": new_expiry.isoformat(),
                "device_info": device_info,  # Update device info in case it changed
            }).eq("id", existing_session["id"]).execute()

            if response.data and len(response.data) > 0:
                return cast(dict[str, Any], response.data[0])
            else:
                logger.warning(f"Failed to renew session {existing_session['id']}")
                # Fall through to create new session

        # No existing session found - create a new one
        expires_at = self._calculate_expiration()
        session_data = {
            "user_id": user_id_str,
            "device_info": device_info,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": expires_at.isoformat(),
            "is_active": True,
        }

        try:
            response = self.client.table("sessions").insert(session_data).execute()
            if not response.data:
                raise ValueError("Failed to create session")
            logger.info(f"Created new session for user {user_id_str}")
            return cast(dict[str, Any], response.data[0])
        except Exception as e:
            error_msg = str(e)
            # Check if it's a session limit error from the trigger
            if "session_limit_exceeded" in error_msg:
                logger.warning(f"Session limit reached for user {user_id_str}")
                # Fetch user's active sessions to return to frontend
                sessions = self.get_user_sessions(user_id_str)
                active_sessions = [
                    {
                        "id": str(s["id"]),
                        "device": s["device_info"].get("browser", "Unknown"),
                        "ip_address": s["ip_address"],
                        "last_activity": s["last_activity"],
                        "expires_at": s["expires_at"],  # Add expires_at for frontend display
                    }
                    for s in sessions
                    if s.get("is_active")
                ]
                raise SessionLimitExceeded(
                    message=(
                        f"Maximum concurrent sessions ({self.max_sessions}) reached. "
                        "Please revoke an existing session."
                    ),
                    sessions=active_sessions,
                ) from e
            # Re-raise other exceptions
            raise

    def validate_session(self, session_id: str) -> bool:
        """
        Check if session is active and not expired.
        Updates last_activity for sliding window (with 5-minute cooldown to reduce writes).
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
        now = datetime.now(UTC)

        if expires_at < now.astimezone(expires_at.tzinfo):
            # Mark as inactive if expired
            self.client.table("sessions").update({"is_active": False}).eq(
                "id", session_id
            ).execute()
            return False

        # Update last_activity with 5-minute cooldown to reduce write amplification
        last_activity_str = session.get("last_activity")
        should_update = True

        if last_activity_str:
            last_activity = datetime.fromisoformat(last_activity_str.replace("Z", "+00:00"))
            # Only update if more than 5 minutes since last update
            should_update = (now - last_activity).total_seconds() > 300  # 5 minutes

        if should_update:
            new_expiry = self._calculate_expiration()
            self.client.table("sessions").update(
                {
                    "last_activity": now.isoformat(),
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
