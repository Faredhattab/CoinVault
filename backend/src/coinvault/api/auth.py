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
    """Authenticate a user with email and password credentials.

    Performs rate-limit checking, authenticates against Supabase Auth,
    creates a server-side session, and returns the user profile with tokens.

    Args:
        request: The incoming HTTP request (used to extract client IP and user-agent).
        login_data: Request body containing email and password.

    Returns:
        AuthResponse with user profile, session metadata, access_token, and refresh_token.

    Raises:
        HTTPException 400: Missing client information.
        HTTPException 401: Invalid credentials.
        HTTPException 403: Session limit exceeded (includes active sessions list).
        HTTPException 404: User profile not found after authentication.
        HTTPException 429: Too many failed login attempts from this IP.
        HTTPException 500: Session creation or profile fetch failure.
    """
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
        auth_response = await auth_service.authenticate_user(login_data.email, login_data.password)
        user_id = auth_response.user.id if auth_response and auth_response.user else "None"
        logger.info(f"Auth successful, user ID: {user_id}")
    except Exception as e:
        logger.error(f"Authentication failed: {type(e).__name__}: {str(e)}", exc_info=True)
        rate_limiter.log_failed_attempt(ip_address, login_data.email, str(e), user_agent)
        raise HTTPException(status_code=401, detail="Invalid login credentials.") from e

    if not auth_response or not auth_response.user:
        logger.error("No auth response or user")
        rate_limiter.log_failed_attempt(ip_address, login_data.email, "User not found", user_agent)
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
    rate_limiter.log_success(auth_response.user.id, session_db["id"], ip_address, user_agent)

    logger.info("Login successful, returning response")
    return {
        "user": profile,
        "session": session_db,
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
    }


@router.post("/logout")
async def logout(
    request: Request, user: Annotated[Any, Depends(get_current_user)]
) -> dict[str, str]:
    """Log out the current authenticated user.

    Revokes the active session associated with this device, then returns
    a success message.

    Args:
        request: The incoming HTTP request (used to identify the current session).
        user: The authenticated user (injected via dependency).

    Returns:
        JSON object with a confirmation message.

    Raises:
        HTTPException 401: Missing or invalid authentication token.
    """
    session_id = getattr(request.state, "session_id", None)
    user_id = str(user.id)
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    if session_id:
        session_service.revoke_session(session_id)
    else:
        # Fallback: revoke all sessions matching this device
        sessions = session_service.get_user_sessions(user_id)
        for s in sessions:
            if s.get("is_active") and s.get("user_agent") == user_agent:
                session_service.revoke_session(str(s["id"]))
                session_id = str(s["id"])
                break

    # Write audit log entry
    from coinvault.services.supabase_client import supabase_admin

    supabase_admin.table("auth_audit_log").insert(
        {
            "user_id": user_id,
            "session_id": session_id,
            "event_type": "logout",
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": True,
        }
    ).execute()

    logger.info(
        "User logged out",
        extra={
            "event": "logout",
            "user_id": user_id,
            "session_id": session_id,
            "ip_address": ip_address,
        },
    )

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfile)
async def get_me(user: Annotated[Any, Depends(get_current_user)]) -> Any:
    """Retrieve the profile of the currently authenticated user.

    Args:
        user: The authenticated user (injected via dependency).

    Returns:
        UserProfile object containing id, email, role, display_name, avatar_url,
        linked_providers, created_at, and updated_at.

    Raises:
        HTTPException 401: Missing or invalid authentication token.
        HTTPException 404: Profile not found for the authenticated user.
    """
    profile = await auth_service.get_user_profile(user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/sessions")
async def get_sessions(
    request: Request, user: Annotated[Any, Depends(get_current_user)]
) -> dict[str, Any]:
    """List all active sessions for the currently authenticated user.

    Each session includes device info, IP address, last activity timestamp,
    expiration time, and a flag indicating which session is the current one.

    Args:
        request: The incoming HTTP request (used to identify the current session).
        user: The authenticated user (injected via dependency).

    Returns:
        JSON object with a "sessions" list of active session objects.

    Raises:
        HTTPException 401: Missing or invalid authentication token.
    """
    sessions = session_service.get_user_sessions(str(user.id))

    # Mark current session based on request
    current_session_id = getattr(request.state, "session_id", None)

    # Filter to only active sessions and add is_current flag
    active_sessions = []
    for session in sessions:
        if session.get("is_active"):
            session_data = {
                "id": str(session["id"]),
                "device_info": session.get("device_info", {}),
                "ip_address": session.get("ip_address"),
                "last_activity": session.get("last_activity"),
                "expires_at": session.get("expires_at"),
                "is_current": str(session["id"]) == current_session_id,
            }
            active_sessions.append(session_data)

    return {"sessions": active_sessions}


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str, user: Annotated[Any, Depends(get_current_user)]
) -> dict[str, str]:
    """Revoke (deactivate) a specific session for the current user.

    The session must belong to the authenticated user. This is used to
    remotely log out a device or free up a session slot when the limit is reached.

    Args:
        session_id: UUID of the session to revoke (path parameter).
        user: The authenticated user (injected via dependency).

    Returns:
        JSON object with a confirmation message.

    Raises:
        HTTPException 401: Missing or invalid authentication token.
        HTTPException 404: Session not found or does not belong to the user.
    """
    # Verify the session belongs to the user
    sessions = session_service.get_user_sessions(str(user.id))
    if not any(str(s["id"]) == session_id for s in sessions):
        raise HTTPException(status_code=404, detail="Session not found")

    session_service.revoke_session(session_id)
    return {"message": "Session revoked successfully"}


# OAuth Endpoints (T103-T106)


@router.get("/oauth/google")
async def oauth_google_initiate(redirect_to: str | None = None) -> dict[str, str]:
    """
    T103: Initiate Google OAuth flow
    Returns OAuth URL for client to redirect to
    """
    try:
        # Default redirect URL - frontend OAuth callback page
        default_redirect = redirect_to or "http://localhost:3000/en/auth/callback/google"

        # Generate OAuth URL using Supabase
        response = auth_service.client.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": default_redirect,
                },
            }
        )

        if not response or not response.url:
            logger.error("Failed to generate Google OAuth URL")
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "oauth_unavailable",
                    "message": "Google authentication is temporarily unavailable",
                },
            )

        logger.info(
            "Google OAuth flow initiated",
            extra={
                "event": "oauth_flow_initiated",
                "provider": "google",
                "redirect_to": default_redirect,
            },
        )

        return {"oauth_url": response.url, "provider": "google"}

    except Exception as e:
        logger.error(f"OAuth initiation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "oauth_unavailable",
                "message": "Google authentication is temporarily unavailable",
            },
        ) from e


@router.get("/oauth/google/callback")
async def oauth_google_callback(
    request: Request, code: str | None = None, state: str | None = None, error: str | None = None
) -> dict[str, Any]:
    """
    T104: Handle Google OAuth callback
    Processes authorization code and creates/links user account
    """
    # Check for OAuth errors
    if error or not code:
        logger.warning(
            f"OAuth callback failed: {error or 'missing code'}",
            extra={
                "event": "oauth_callback_failed",
                "provider": "google",
                "error": error,
            },
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "oauth_error",
                "message": "Google authentication was cancelled or failed",
            },
        )

    try:
        # Exchange code for session
        # Note: exchange_code_for_session expects a dict with 'auth_code' key
        auth_response = auth_service.client.auth.exchange_code_for_session({"auth_code": code})

        if not auth_response or not auth_response.session:
            raise HTTPException(
                status_code=400,
                detail={"error": "oauth_error", "message": "Failed to exchange authorization code"},
            )

        access_token = auth_response.session.access_token

        # Handle OAuth callback (create/link profile)
        profile = await auth_service.handle_oauth_callback("google", access_token)

        if not profile:
            raise HTTPException(status_code=500, detail="Failed to create/update user profile")

        # Get client info
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent")

        # Create session
        try:
            session_db = session_service.create_session(
                profile["id"],
                {"browser": user_agent},
                ip_address,
                user_agent,
            )
        except SessionLimitExceeded as e:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "session_limit_exceeded",
                    "message": e.message,
                    "active_sessions": e.sessions,
                },
            ) from e

        logger.info(
            f"OAuth callback successful for user {profile['id']}",
            extra={
                "event": "oauth_callback_success",
                "provider": "google",
                "user_id": profile["id"],
                "email": profile.get("email"),
            },
        )

        return {
            "user": profile,
            "session": session_db,
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
        }

    except SessionLimitExceeded:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}") from e


@router.post("/link/google")
async def link_google_account(user: Annotated[Any, Depends(get_current_user)]) -> dict[str, Any]:
    """
    T105: Link Google OAuth to existing account
    User must be authenticated with password to link OAuth
    """
    try:
        # Check if already linked
        profile = await auth_service.get_user_profile(str(user.id))
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        if "google" in profile.get("linked_providers", []):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "already_linked",
                    "message": "Google account is already linked to this account",
                },
            )

        # Generate OAuth URL for linking
        link_redirect_url = "http://localhost:3000/en/auth/callback/google?link=true"
        response = auth_service.client.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": link_redirect_url,
                },
            }
        )

        if not response or not response.url:
            raise HTTPException(status_code=503, detail="Failed to generate OAuth URL")

        logger.info(
            f"OAuth linking initiated for user {user.id}",
            extra={
                "event": "oauth_link_initiated",
                "provider": "google",
                "user_id": str(user.id),
            },
        )

        return {
            "message": "Google account linking initiated",
            "oauth_redirect_url": response.url,
            "linked_providers": profile.get("linked_providers", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth linking failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to initiate OAuth linking: {str(e)}"
        ) from e


@router.delete("/link/google")
async def unlink_google_account(user: Annotated[Any, Depends(get_current_user)]) -> dict[str, Any]:
    """
    T106: Unlink Google OAuth from account
    Requires at least one other auth method to remain
    """
    try:
        # Attempt to unlink provider
        result = await auth_service.unlink_provider(str(user.id), "google")

        if not result:
            raise HTTPException(status_code=404, detail="User profile not found")

        logger.info(
            f"Google account unlinked for user {user.id}",
            extra={
                "event": "oauth_unlink_success",
                "provider": "google",
                "user_id": str(user.id),
                "remaining_providers": result.get("linked_providers", []),
            },
        )

        return {
            "message": "Google account unlinked successfully",
            "linked_providers": result.get("linked_providers", []),
        }

    except ValueError as e:
        # This is raised when trying to unlink last provider
        if "last" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_operation",
                    "message": "Cannot unlink last authentication method. Please add a password first.",
                },
            ) from e
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth unlinking failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to unlink OAuth provider: {str(e)}"
        ) from e
