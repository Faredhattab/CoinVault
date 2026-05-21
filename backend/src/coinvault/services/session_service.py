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
        Device fingerprint = user agent (IP excluded from match due to INET format mismatch).
        """
        user_id_str = str(user_id)
        now = datetime.now(UTC)

        query = (
            self.client.table("sessions")
            .select("*")
            .eq("user_id", user_id_str)
            .eq("is_active", True)
            .eq("user_agent", user_agent)
            .gt("expires_at", now.isoformat())
            .limit(1)
        )

        response = query.execute()

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

            response = (
                self.client.table("sessions")
                .update(
                    {
                        "last_activity": now.isoformat(),
                        "expires_at": new_expiry.isoformat(),
                        "device_info": device_info,  # Update device info in case it changed
                    }
                )
                .eq("id", existing_session["id"])
                .execute()
            )

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

            # Log session creation metrics (T091)
            session_id = response.data[0].get("id")
            logger.info(
                "Session created",
                extra={
                    "event": "session_created",
                    "user_id": user_id_str,
                    "session_id": session_id,
                    "ip_address": ip_address,
                    "device_browser": device_info.get("browser", "Unknown"),
                    "device_os": device_info.get("os", "Unknown"),
                    "device_type": device_info.get("device_type", "Unknown"),
                    "expires_at": expires_at.isoformat(),
                    "timeout_days": self.timeout_days,
                },
            )

            # Log session count metrics for monitoring
            active_sessions = self.get_user_sessions(user_id_str)
            active_count = sum(1 for s in active_sessions if s.get("is_active"))
            logger.info(
                "Session count updated",
                extra={
                    "event": "session_count_metric",
                    "user_id": user_id_str,
                    "active_sessions": active_count,
                    "max_sessions": self.max_sessions,
                    "utilization_pct": (active_count / self.max_sessions) * 100,
                },
            )

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
        response = self.client.table("sessions").select("*").eq("id", session_id).single().execute()
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

            # Log session expiration metrics (T091)
            logger.info(
                "Session expired",
                extra={
                    "event": "session_expired",
                    "session_id": session_id,
                    "user_id": session.get("user_id"),
                    "ip_address": session.get("ip_address"),
                    "created_at": session.get("created_at"),
                    "expires_at": expires_at_str,
                    "last_activity": session.get("last_activity"),
                    "session_duration_seconds": (
                        (
                            expires_at - datetime.fromisoformat(session.get("created_at", ""))
                        ).total_seconds()
                        if session.get("created_at")
                        else None
                    ),
                },
            )

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
        # Get session details before revocation for logging
        response = self.client.table("sessions").select("*").eq("id", session_id).single().execute()
        session = response.data

        # Revoke the session
        result = (
            self.client.table("sessions")
            .update({"is_active": False})
            .eq("id", session_id)
            .execute()
        )

        # Log session revocation metrics (T091)
        if session:
            logger.info(
                "Session revoked",
                extra={
                    "event": "session_revoked",
                    "session_id": session_id,
                    "user_id": session.get("user_id"),
                    "ip_address": session.get("ip_address"),
                    "device_browser": session.get("device_info", {}).get("browser", "Unknown"),
                    "created_at": session.get("created_at"),
                    "last_activity": session.get("last_activity"),
                    "session_duration_seconds": (
                        (
                            datetime.now(UTC)
                            - datetime.fromisoformat(session.get("created_at", ""))
                        ).total_seconds()
                        if session.get("created_at")
                        else None
                    ),
                },
            )

        return result

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

    def get_session_metrics(self) -> dict[str, Any]:
        """
        Get aggregated session metrics for monitoring (T091).

        Returns:
            Dictionary containing session statistics:
            - total_active_sessions: Total number of active sessions
            - total_users_with_sessions: Number of unique users with active sessions
            - avg_sessions_per_user: Average active sessions per user
            - sessions_near_limit: Number of users at or near session limit
        """
        # Get all active sessions
        response = (
            self.client.table("sessions")
            .select("user_id, is_active")
            .eq("is_active", True)
            .execute()
        )

        if not response.data:
            return {
                "total_active_sessions": 0,
                "total_users_with_sessions": 0,
                "avg_sessions_per_user": 0.0,
                "sessions_near_limit": 0,
            }

        # Count sessions per user
        sessions_by_user: dict[str, int] = {}
        for session in response.data:
            user_id = session.get("user_id")
            if user_id:
                sessions_by_user[user_id] = sessions_by_user.get(user_id, 0) + 1

        total_active = len(response.data)
        total_users = len(sessions_by_user)
        avg_sessions = total_active / total_users if total_users > 0 else 0.0

        # Count users near or at session limit
        near_limit = sum(1 for count in sessions_by_user.values() if count >= self.max_sessions - 1)

        metrics = {
            "total_active_sessions": total_active,
            "total_users_with_sessions": total_users,
            "avg_sessions_per_user": round(avg_sessions, 2),
            "sessions_near_limit": near_limit,
            "max_sessions_per_user": self.max_sessions,
        }

        # Log metrics for monitoring
        logger.info(
            "Session metrics calculated",
            extra={"event": "session_metrics", **metrics},
        )

        return metrics
