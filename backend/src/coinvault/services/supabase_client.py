from supabase import Client, create_client

from coinvault.core.config import settings


def get_supabase_admin_client() -> Client:
    """
    Returns a Supabase client initialized with the service role key.
    Use ONLY for administrative operations that must bypass RLS.
    """
    url = settings.supabase_url
    key = settings.supabase_service_role_key

    if not url or not key or "replace-with" in key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    return create_client(url, key)


def get_supabase_anon_client() -> Client:
    """
    Returns a Supabase client initialized with the anonymous key.
    Follows RLS policies. This should be the default for most operations.
    """
    url = settings.supabase_url
    key = settings.supabase_anon_key

    if not url or not key or "replace-with" in key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")

    return create_client(url, key)


# Admin client - bypasses RLS
supabase_admin: Client = get_supabase_admin_client()

# Anonymous client - respects RLS
supabase_anon: Client = get_supabase_anon_client()

# Default to anon client for safety
supabase: Client = supabase_anon


def get_user_client(token: str) -> Client:
    """
    Returns a new Supabase client initialized with the anonymous key
    and the user's JWT token for RLS-respecting operations.
    """
    client = get_supabase_anon_client()
    client.postgrest.auth(token)
    # Also set auth for other services if needed (storage, etc.)
    client.auth.set_session(token, "")  # Refresh token not needed for just setting auth header
    return client
