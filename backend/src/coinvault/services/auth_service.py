import re
from typing import Any, cast

from supabase import Client

from coinvault.core.logging import logger
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
        return self.client.auth.sign_in_with_password({"email": email, "password": password})

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
            logger.warning(
                f"Cannot link provider - profile not found for user {user_id}",
                extra={
                    "event": "oauth_link_failed",
                    "user_id": user_id,
                    "provider": provider,
                    "reason": "profile_not_found",
                },
            )
            return None

        providers = set(profile.get("linked_providers", []))

        # Check if already linked
        if provider in providers:
            logger.info(
                f"Provider {provider} already linked for user {user_id}",
                extra={
                    "event": "oauth_link_duplicate",
                    "user_id": user_id,
                    "provider": provider,
                    "email": profile.get("email"),
                },
            )
            return profile

        providers.add(provider)

        response = (
            self.client.table("profiles")
            .update({"linked_providers": list(providers)})
            .eq("id", user_id)
            .execute()
        )

        # Log OAuth account linking (T114)
        if response.data:
            logger.info(
                f"OAuth provider {provider} linked successfully",
                extra={
                    "event": "oauth_provider_linked",
                    "user_id": user_id,
                    "provider": provider,
                    "email": profile.get("email"),
                    "total_providers": len(providers),
                    "linked_providers": list(providers),
                },
            )

        return cast(dict[str, Any] | None, response.data[0]) if response.data else None

    async def unlink_provider(self, user_id: str, provider: str) -> dict[str, Any] | None:
        """
        Remove provider from linked_providers in profile (T114)
        """
        profile = await self.get_user_profile(user_id)
        if not profile:
            logger.warning(
                f"Cannot unlink provider - profile not found for user {user_id}",
                extra={
                    "event": "oauth_unlink_failed",
                    "user_id": user_id,
                    "provider": provider,
                    "reason": "profile_not_found",
                },
            )
            return None

        providers = set(profile.get("linked_providers", []))

        # Check if this is the last provider
        if len(providers) == 1 and provider in providers:
            logger.warning(
                f"Cannot unlink last provider {provider} for user {user_id}",
                extra={
                    "event": "oauth_unlink_blocked",
                    "user_id": user_id,
                    "provider": provider,
                    "reason": "last_provider",
                    "email": profile.get("email"),
                },
            )
            raise ValueError("Cannot unlink the last authentication provider")

        # Check if provider is linked
        if provider not in providers:
            logger.info(
                f"Provider {provider} not linked for user {user_id}",
                extra={
                    "event": "oauth_unlink_not_found",
                    "user_id": user_id,
                    "provider": provider,
                    "linked_providers": list(providers),
                },
            )
            return profile

        providers.remove(provider)

        response = (
            self.client.table("profiles")
            .update({"linked_providers": list(providers)})
            .eq("id", user_id)
            .execute()
        )

        # Log OAuth account unlinking (T114)
        if response.data:
            logger.info(
                f"OAuth provider {provider} unlinked successfully",
                extra={
                    "event": "oauth_provider_unlinked",
                    "user_id": user_id,
                    "provider": provider,
                    "email": profile.get("email"),
                    "remaining_providers": len(providers),
                    "linked_providers": list(providers),
                },
            )

        return cast(dict[str, Any] | None, response.data[0]) if response.data else None

    async def verify_user_role(self, user_id: str, required_role: str) -> bool:
        """Verify that a user has the required role."""
        profile = await self.get_user_profile(user_id)
        if not profile:
            logger.warning(
                f"Role verification failed - profile not found for user {user_id}",
                extra={
                    "event": "role_verification_failed",
                    "user_id": user_id,
                    "required_role": required_role,
                    "reason": "profile_not_found",
                },
            )
            return False

        user_role = profile.get("role")
        if user_role == required_role:
            logger.debug(
                f"Role verification succeeded for user {user_id}: has role '{required_role}'",
                extra={
                    "event": "role_verification_success",
                    "user_id": user_id,
                    "required_role": required_role,
                },
            )
            return True

        logger.warning(
            f"Role verification failed for user {user_id}: required '{required_role}', has '{user_role}'",
            extra={
                "event": "role_verification_failed",
                "user_id": user_id,
                "required_role": required_role,
                "actual_role": user_role,
            },
        )
        return False

    async def get_user_role(self, user_id: str) -> str | None:
        """Get the role of a user. Returns None if profile not found."""
        profile = await self.get_user_profile(user_id)
        if not profile:
            return None
        return profile.get("role")

    async def handle_oauth_callback(
        self, provider: str, access_token: str, user_metadata: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Handle OAuth callback and create/update user profile (T114)
        """
        try:
            # Get user from Supabase Auth
            auth_response = self.client.auth.get_user(access_token)
            if not auth_response or not auth_response.user:
                logger.error(
                    "OAuth callback failed - invalid token",
                    extra={
                        "event": "oauth_callback_failed",
                        "provider": provider,
                        "reason": "invalid_token",
                    },
                )
                raise ValueError("Invalid access token")

            user = auth_response.user
            user_id = user.id
            email = user.email

            # Extract display name from metadata if available
            metadata = getattr(user, "user_metadata", {}) or {}
            full_name = (
                metadata.get("full_name") or metadata.get("name") or metadata.get("display_name")
            )

            # Check if profile exists
            profile = await self.get_user_profile(str(user_id))

            if profile:
                # Existing user - link provider if not already linked
                # Also update display_name if it was missing
                update_data = {}
                if full_name and not profile.get("display_name"):
                    update_data["display_name"] = full_name

                await self.link_provider(str(user_id), provider)

                if update_data:
                    self.client.table("profiles").update(update_data).eq(
                        "id", str(user_id)
                    ).execute()
                    profile.update(update_data)

                logger.info(
                    f"OAuth login successful for existing user via {provider}",
                    extra={
                        "event": "oauth_login_existing",
                        "user_id": str(user_id),
                        "provider": provider,
                        "email": email,
                        "linked_providers": profile.get("linked_providers", []),
                        "has_name": bool(full_name),
                    },
                )
            else:
                # New user - create profile with OAuth provider
                profile_data = {
                    "id": str(user_id),
                    "email": email,
                    "role": "admin",  # Default role
                    "linked_providers": [provider],
                }
                if full_name:
                    profile_data["display_name"] = full_name

                response = self.client.table("profiles").insert(profile_data).execute()
                profile = response.data[0] if response.data else None

                logger.info(
                    f"New user created via OAuth {provider}",
                    extra={
                        "event": "oauth_user_created",
                        "user_id": str(user_id),
                        "provider": provider,
                        "email": email,
                        "role": "admin",
                        "display_name": full_name,
                    },
                )

            return cast(dict[str, Any], profile)

        except Exception as e:
            logger.error(
                f"OAuth callback error: {str(e)}",
                extra={
                    "event": "oauth_callback_error",
                    "provider": provider,
                    "error": str(e),
                },
            )
            raise
