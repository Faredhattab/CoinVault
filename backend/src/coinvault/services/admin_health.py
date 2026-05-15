from __future__ import annotations

from supabase import Client
from coinvault.core.config import Settings


def admin_account_seeded(client: Client, settings: Settings) -> tuple[bool, str]:
    try:
        # Check if the admin email exists in the users list
        response = client.auth.admin.list_users()
        users = response
        
        admin_email = settings.initial_admin_email
        if any(user.email == admin_email for user in users):
            return True, f"Admin account ({admin_email}) is seeded"
        
        return False, f"Admin account ({admin_email}) is not seeded"
    except Exception as e:
        return False, f"Failed to check admin account: {str(e)}"
