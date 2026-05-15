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


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify routing works"""
    logger.info("Test endpoint called")
    return {"status": "ok", "message": "Auth router is working"}


@router.post("/login", response_model=AuthResponse)
async def login(request: Request, login_data: UserLogin) -> dict[str, Any]:
    logger.info(f"Login attempt for email: {login_data.email}")

    if request.client is None:
        logger.error("No client information in request")
        raise HTTPException(status_code=400, detail="Invalid client request")

    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")
    logger.info(f"Login from IP: {ip_address}, User-Agent: {user_agent}")

    # 1. Check rate limit
    if rate_limiter.is_rate_limited(ip_address):
        logger.warning(f"Rate limit exceeded for IP: {ip_address}")
        raise HTTPException(
            status_code=429, detail="Too many failed attempts. Please try again later."
        )

    # 2. Authenticate with Supabase
    try:
        logger.info("Calling auth_service.authenticate_user")
        auth_response = await auth_service.authenticate_user(
            login_data.email, login_data.password
        )
        user_id = auth_response.user.id if auth_response and auth_response.user else "None"
        logger.info(f"Auth successful, user ID: {user_id}")
    except Exception as e:
        logger.error(f"Authentication failed: {type(e).__name__}: {str(e)}", exc_info=True)
        rate_limiter.log_failed_attempt(
            ip_address, login_data.email, str(e), user_agent
        )
        raise HTTPException(status_code=401, detail="Invalid login credentials.") from e

    if not auth_response or not auth_response.user:
        logger.error("No auth response or user")
        rate_limiter.log_failed_attempt(
            ip_address, login_data.email, "User not found", user_agent
        )
        raise HTTPException(status_code=401, detail="Invalid login credentials.")

    # 3. Create session in DB
    try:
        logger.info(f"Creating session for user: {auth_response.user.id}")
        session_db = session_service.create_session(
            auth_response.user.id,
            {"browser": user_agent},  # Simple device info for now
            ip_address,
            user_agent,
        )
        logger.info(f"Session created: {session_db['id']}")
    except SessionLimitExceeded as e:
        logger.warning(f"Session limit exceeded: {e.message}")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "session_limit_exceeded",
                "message": e.message,
                "active_sessions": e.sessions,
            },
        ) from e
    except Exception as e:
        logger.error(f"Session creation failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}") from e

    # 4. Fetch full profile
    try:
        logger.info(f"Fetching profile for user: {auth_response.user.id}")
        profile = await auth_service.get_user_profile(auth_response.user.id)
        if not profile:
            logger.error("Profile not found")
            raise HTTPException(status_code=404, detail="Profile not found")
        logger.info(f"Profile fetched: {profile.get('email')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile fetch failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Profile fetch failed: {str(e)}") from e

    # 5. Log success
    rate_limiter.log_success(
        auth_response.user.id, session_db["id"], ip_address, user_agent
    )

    logger.info("Login successful, returning response")
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
