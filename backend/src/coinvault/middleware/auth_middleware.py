from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request

from coinvault.services.supabase_client import get_user_client, supabase_anon


async def get_token(request: Request) -> str:
    """
    Extract JWT token from Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid authentication token"
        )
    return auth_header.split(" ")[1]


async def get_current_user(token: Annotated[str, Depends(get_token)]) -> Any:
    """
    Dependency to get current authenticated user from Supabase.
    """
    # Use anon client for validation (user's token validates itself)
    response = supabase_anon.auth.get_user(token)
    if not response or not response.user:
        raise HTTPException(status_code=401, detail="Invalid session")

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
    response = (
        user_client.table("profiles").select("role").eq("id", user.id).single().execute()
    )
    profile = response.data

    if not profile or not isinstance(profile, dict) or profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

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
        response = (
            user_client.table("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
            .execute()
        )
        profile = response.data

        if not profile or not isinstance(profile, dict) or profile.get("role") != role:
            raise HTTPException(
                status_code=403, detail=f"Required role: {role} not found"
            )

        return user

    return role_dependency
