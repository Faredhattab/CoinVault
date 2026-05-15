from __future__ import annotations

from supabase import Client


def migrations_applied(client: Client) -> tuple[bool, str]:
    try:
        # Check if the profiles table exists by trying to select from it
        # (limit 0 to just check existence)
        client.table("profiles").select("*").limit(0).execute()
        return True, "Database migrations are applied"
    except Exception:
        return False, "Database migrations are missing (profiles table not found)"
