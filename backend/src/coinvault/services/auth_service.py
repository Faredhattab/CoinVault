import re
from typing import Any, cast

from supabase import Client

from coinvault.services.supabase_client import supabase_admin


def validate_password(password: str) -> bool:
    """
    Validate password against policy:
    - Minimum 12 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one number (0-9)
    - At least one special character (!@#$%^&*()_+-)
    """
    if len(password) < 12:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*()_+\-]", password):
        return False
    return True

class AuthService:
    def __init__(self, client: Client = supabase_admin) -> None:
        self.client = client

    async def authenticate_user(self, email: str, password: str) -> Any:
        """
        Authenticate user with email and password using Supabase Auth
        """
        return self.client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

    async def get_user_profile(self, user_id: str) -> dict[str, Any] | None:
        """
        Fetch user profile from public.profiles
        """
        response = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
        return cast(dict[str, Any] | None, response.data) if response.data else None

    async def link_provider(self, user_id: str, provider: str) -> dict[str, Any] | None:
        """
        Update linked_providers in profile
        """
        profile = await self.get_user_profile(user_id)
        if not profile:
            return None
        
        providers = set(profile.get("linked_providers", []))
        providers.add(provider)
        
        response = self.client.table("profiles").update({
            "linked_providers": list(providers)
        }).eq("id", user_id).execute()
        
        return cast(dict[str, Any] | None, response.data[0]) if response.data else None
