import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request

from coinvault.middleware.auth_middleware import get_current_user
from coinvault.models.auth import AuthResponse
from coinvault.models.user import UserLogin, UserProfile
from coinvault.services.auth_service import AuthService
from coinvault.services.rate_limiter import RateLimiter
from coinvault.services.session_service import SessionLimitExceeded, SessionService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()
session_service = SessionService()
rate_limiter = RateLimiter()
logger = logging.getLogger("coinvault")


@router.post("/login", response_model=AuthResponse)
async def login(request: Request, login_data: UserLogin) -> dict[str, Any]:
    if request.client is None:
        raise HTTPException(status_code=400, detail="Invalid client request")

    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")

    # 1. Check rate limit
    if rate_limiter.is_rate_limited(ip_address):
        raise HTTPException(
            status_code=429, detail="Too many failed attempts. Please try again later."
        )

    # 2. Authenticate with Supabase
    try:
        auth_response = await auth_service.authenticate_user(
            login_data.email, login_data.password
        )
    except Exception as e:
        rate_limiter.log_failed_attempt(
            ip_address, login_data.email, str(e), user_agent
        )
        raise HTTPException(status_code=401, detail="Invalid login credentials.") from e

    if not auth_response or not auth_response.user:
        rate_limiter.log_failed_attempt(
            ip_address, login_data.email, "User not found", user_agent
        )
        raise HTTPException(status_code=401, detail="Invalid login credentials.")

    # 3. Create session in DB
    try:
        session_db = session_service.create_session(
            auth_response.user.id,
            {"browser": user_agent},  # Simple device info for now
            ip_address,
            user_agent,
        )
    except SessionLimitExceeded as e:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "session_limit_exceeded",
                "message": e.message,
                "active_sessions": e.sessions,
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e

    # 4. Fetch full profile
    profile = await auth_service.get_user_profile(auth_response.user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # 5. Log success
    rate_limiter.log_success(
        auth_response.user.id, session_db["id"], ip_address, user_agent
    )

    return {
        "user": profile,
        "session": session_db,
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
    }


@router.post("/logout")
async def logout(user: Annotated[Any, Depends(get_current_user)]) -> dict[str, str]:
    # This will be more meaningful when we have session tracking
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfile)
async def get_me(user: Annotated[Any, Depends(get_current_user)]) -> Any:
    profile = await auth_service.get_user_profile(user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str, user: Annotated[Any, Depends(get_current_user)]
) -> dict[str, str]:
    # Verify the session belongs to the user
    sessions = session_service.get_user_sessions(user.id)
    if not any(s["id"] == session_id for s in sessions):
        raise HTTPException(status_code=404, detail="Session not found")

    session_service.revoke_session(session_id)
    return {"message": "Session revoked successfully"}
