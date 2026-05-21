import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request

from coinvault.core.config import settings
from coinvault.services.supabase_client import get_user_client, supabase_admin, supabase_anon

logger = logging.getLogger("coinvault")


async def get_token(request: Request) -> str:
    """
    Extract JWT token from Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    return auth_header.split(" ")[1]


async def get_current_user(token: Annotated[str, Depends(get_token)], request: Request) -> Any:
    """
    Dependency to get current authenticated user from Supabase.
    Also updates session activity (sliding window timeout).
    """
    # Use anon client for validation (user's token validates itself)
    response = supabase_anon.auth.get_user(token)
    if not response or not response.user:
        raise HTTPException(status_code=401, detail="Invalid session")

    # Find the user's active session for this device
    user_id = str(response.user.id)
    user_agent = request.headers.get("user-agent")

    try:
        now = datetime.now(UTC)
        session_response = (
            supabase_admin.table("sessions")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .eq("user_agent", user_agent)
            .gt("expires_at", now.isoformat())
            .limit(1)
            .execute()
        )

        if session_response.data and len(session_response.data) > 0:
            session_id = str(session_response.data[0]["id"])

            # Store session_id in request state for later use
            request.state.session_id = session_id

            # Update session activity (with 5-minute cooldown to reduce writes)
            # Check last_activity before updating
            session_detail = (
                supabase_admin.table("sessions")
                .select("last_activity")
                .eq("id", session_id)
                .single()
                .execute()
            )

            should_update = True
            if session_detail.data and session_detail.data.get("last_activity"):
                last_activity = datetime.fromisoformat(session_detail.data["last_activity"])
                should_update = (now - last_activity).total_seconds() > 300

            if should_update:
                new_expires_at = now + timedelta(days=settings.session_timeout_days)
                supabase_admin.table("sessions").update(
                    {
                        "last_activity": now.isoformat(),
                        "expires_at": new_expires_at.isoformat(),
                    }
                ).eq("id", session_id).execute()
        else:
            raise HTTPException(status_code=401, detail="Session revoked or expired")
    except HTTPException:
        raise
    except Exception:
        # Don't fail the request if session tracking fails
        pass

    return response.user


async def require_admin(
    user: Annotated[Any, Depends(get_current_user)],
    token: Annotated[str, Depends(get_token)],
) -> Any:
    """
    Dependency to ensure current user is an admin.
    Uses the user's own token to query the profiles table (respecting RLS).
    """
    user_client = get_user_client(token)

    # Fetch profile from DB to check role using the user's own client
    response = user_client.table("profiles").select("role").eq("id", user.id).single().execute()
    profile = response.data

    if not profile or not isinstance(profile, dict) or profile.get("role") != "admin":
        logger.warning(
            f"Admin access denied for user {user.id}",
            extra={
                "event": "admin_access_denied",
                "user_id": str(user.id),
                "actual_role": profile.get("role") if isinstance(profile, dict) else None,
            },
        )
        raise HTTPException(status_code=403, detail="Admin privileges required")

    logger.debug(
        f"Admin access granted for user {user.id}",
        extra={
            "event": "admin_access_granted",
            "user_id": str(user.id),
        },
    )
    return user


def require_role(role: str) -> Any:
    """
    Factory to create a dependency for a specific role.
    """

    async def role_dependency(
        user: Annotated[Any, Depends(get_current_user)],
        token: Annotated[str, Depends(get_token)],
    ) -> Any:
        user_client = get_user_client(token)
        response = user_client.table("profiles").select("role").eq("id", user.id).single().execute()
        profile = response.data

        if not profile or not isinstance(profile, dict) or profile.get("role") != role:
            logger.warning(
                f"Role check failed: user {user.id} requires '{role}', has '{profile.get('role') if isinstance(profile, dict) else None}'",
                extra={
                    "event": "role_check_failed",
                    "user_id": str(user.id),
                    "required_role": role,
                    "actual_role": profile.get("role") if isinstance(profile, dict) else None,
                },
            )
            raise HTTPException(status_code=403, detail=f"Required role: {role} not found")

        logger.debug(
            f"Role check passed: user {user.id} has role '{role}'",
            extra={
                "event": "role_check_passed",
                "user_id": str(user.id),
                "role": role,
            },
        )
        return user

    return role_dependency
