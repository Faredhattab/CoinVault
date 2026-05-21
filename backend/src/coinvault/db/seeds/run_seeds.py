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
        return

    # 3. Seed categories
    print("Seeding categories...")
    categories = {}
    try:
        # Clear existing data to avoid conflicts on runs
        supabase.table("item_categories").delete().neq("item_uuid", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("items").delete().neq("uuid", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("categories").delete().neq("uuid", "00000000-0000-0000-0000-000000000000").execute()

        # Europe (Level 1)
        res_europe = supabase.table("categories").insert({
            "name_en": "Europe",
            "name_ar": "أوروبا"
        }).execute()
        europe_uuid = res_europe.data[0]["uuid"]
        categories["Europe"] = europe_uuid

        # Netherlands (Level 2)
        res_nl = supabase.table("categories").insert({
            "name_en": "Netherlands",
            "name_ar": "هولندا",
            "parent_uuid": europe_uuid
        }).execute()
        nl_uuid = res_nl.data[0]["uuid"]
        categories["Netherlands"] = nl_uuid

        # Provincial Coins (Level 3)
        res_prov = supabase.table("categories").insert({
            "name_en": "Provincial Coins",
            "name_ar": "عملات الأقاليم",
            "parent_uuid": nl_uuid
        }).execute()
        prov_uuid = res_prov.data[0]["uuid"]
        categories["Provincial Coins"] = prov_uuid

        # Middle East (Level 1)
        res_me = supabase.table("categories").insert({
            "name_en": "Middle East",
            "name_ar": "الشرق الأوسط"
        }).execute()
        me_uuid = res_me.data[0]["uuid"]
        categories["Middle East"] = me_uuid

        print(f"Seeded {len(categories)} categories successfully.")
    except Exception as e:
        print(f"Error seeding categories: {e}")
        return

    # 4. Seed items
    print("Seeding items...")
    try:
        # Public coin item
        res_item1 = supabase.table("items").insert({
            "type": "Coin",
            "title_en": "1 Gulden - Wilhelmina",
            "title_ar": "١ غولدن - فيلهلمينا",
            "description_en": "Silver coin from the Kingdom of the Netherlands.",
            "description_ar": "عملة فضية من مملكة هولندا.",
            "country_code": "NL",
            "denomination": "1 Gulden",
            "year": 1940,
            "acquisition_year": 2021,
            "amount": 2,
            "visibility": "Public",
            "tags": ["silver", "wilhelmina"],
            "front_image": "https://example.com/images/nl-1g-front.jpg",
            "back_image": "https://example.com/images/nl-1g-back.jpg"
        }).execute()
        item1_uuid = res_item1.data[0]["uuid"]

        # Private coin item
        res_item2 = supabase.table("items").insert({
            "type": "Coin",
            "title_en": "Rijksdaalder - Willem III",
            "title_ar": "رايكسدالدر - ويليم الثالث",
            "description_en": "Rare silver Rijksdaalder coin.",
            "description_ar": "عملة فضية نادرة.",
            "country_code": "NL",
            "denomination": "2.5 Gulden",
            "year": 1874,
            "acquisition_year": 2023,
            "amount": 1,
            "visibility": "Private",
            "tags": ["silver", "rare", "willem"],
            "front_image": "https://example.com/images/nl-2.5g-front.jpg",
            "back_image": "https://example.com/images/nl-2.5g-back.jpg"
        }).execute()
        item2_uuid = res_item2.data[0]["uuid"]

        # Banknote with missing Arabic translation (fallback test)
        res_item3 = supabase.table("items").insert({
            "type": "Banknote",
            "title_en": "5 Dinars - Iraq",
            "description_en": "Historical Iraqi banknote featuring King Faisal II.",
            "country_code": "IQ",
            "denomination": "5 Dinars",
            "year": 1959,
            "acquisition_year": 2020,
            "amount": 5,
            "visibility": "Public",
            "tags": ["faisal", "iraq", "banknote"]
        }).execute()
        item3_uuid = res_item3.data[0]["uuid"]

        # 5. Link items to categories
        supabase.table("item_categories").insert([
            {"item_uuid": item1_uuid, "category_uuid": categories["Provincial Coins"]},
            {"item_uuid": item2_uuid, "category_uuid": categories["Netherlands"]},
            {"item_uuid": item3_uuid, "category_uuid": categories["Middle East"]}
        ]).execute()

        print("Seeded items and category relationships successfully.")

    except Exception as e:
        print(f"Error seeding items: {e}")


if __name__ == "__main__":
    run_seeds()
