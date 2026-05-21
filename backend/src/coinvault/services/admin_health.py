from __future__ import annotations

from supabase import Client

from coinvault.core.config import Settings


def admin_account_seeded(client: Client, settings: Settings) -> tuple[bool, str]:
    try:
        admin_email = settings.initial_admin_email
        # Check profiles table - admin client bypasses RLS
        response = (
            client.table("profiles")
            .select("id")
            .eq("email", admin_email)
            .eq("role", "admin")
            .execute()
        )

        if response.data and len(response.data) > 0:
            return True, f"Admin account ({admin_email}) is seeded"

        return False, f"Admin account ({admin_email}) is not seeded"
    except Exception as e:
        return False, f"Failed to check admin account: {str(e)}"
