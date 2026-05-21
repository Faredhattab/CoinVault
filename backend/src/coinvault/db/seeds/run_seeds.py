import os
import sys

from dotenv import load_dotenv
from supabase import Client, create_client

# Add src to path if needed
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

load_dotenv()


def run_seeds() -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        return

    supabase: Client = create_client(url, key)

    email = os.environ.get("INITIAL_ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("INITIAL_ADMIN_PASSWORD", "")

    if not password:
        print("Error: INITIAL_ADMIN_PASSWORD must be set in environment variables.")
        return

    print(f"Seeding initial admin: {email}")

    # 1. Check if user exists, create if not
    user_id: str | None = None
    try:
        print("Checking for existing auth user...")
        users = supabase.auth.admin.list_users()
        user = next((u for u in users if u.email == email), None)

        if user:
            user_id = user.id
            print(f"Found existing auth user: {user_id}")
        else:
            print("Creating new auth user...")
            user_response = supabase.auth.admin.create_user(
                {"email": email, "password": password, "email_confirm": True}
            )
            user_id = user_response.user.id
            print(f"Created new auth user: {user_id}")
    except Exception as e:
        print(f"Error managing auth user: {e}")
        return

    if not user_id:
        print("Error: user_id is None")
        return

    # 2. Ensure profile exists and has admin role
    try:
        # Upsert profile
        profile_data = {
            "id": user_id,
            "email": email,
            "role": "admin",
            "linked_providers": ["password"],
            "display_name": "CoinVault Admin",
        }

        supabase.table("profiles").upsert(profile_data).execute()
        print("Admin profile upserted successfully.")

    except Exception as e:
        print(f"Error upserting admin profile: {e}")


if __name__ == "__main__":
    run_seeds()
