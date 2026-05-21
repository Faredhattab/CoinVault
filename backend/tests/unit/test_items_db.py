import pytest
from postgrest.exceptions import APIError
from supabase import create_client, Client
from coinvault.core.config import settings
import concurrent.futures

@pytest.fixture(scope="module")
def db_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

@pytest.fixture(autouse=True)
def clean_test_items(db_client: Client):
    # Setup
    db_client.table("item_categories").delete().neq("item_uuid", "00000000-0000-0000-0000-000000000000").execute()
    db_client.table("items").delete().like("title_en", "Test Item %").execute()
    db_client.table("categories").delete().like("name_en", "Test Item Category%").execute()
    yield
    # Teardown
    db_client.table("item_categories").delete().neq("item_uuid", "00000000-0000-0000-0000-000000000000").execute()
    db_client.table("items").delete().like("title_en", "Test Item %").execute()
    db_client.table("categories").delete().like("name_en", "Test Item Category%").execute()

def test_sequential_collection_id_generation(db_client: Client) -> None:
    # Insert first item for country XX
    res1 = db_client.table("items").insert({
        "type": "Coin",
        "title_en": "Test Item A",
        "country_code": "XX",
        "denomination": "10 Units",
        "year": 2026,
        "amount": 5,
        "visibility": "Public"
    }).execute()
    assert res1.data[0]["collection_id"] == "XX-0001"

    # Insert second item for country XX
    res2 = db_client.table("items").insert({
        "type": "Banknote",
        "title_en": "Test Item B",
        "country_code": "XX",
        "denomination": "20 Units",
        "year": 2026,
        "amount": 2,
        "visibility": "Public"
    }).execute()
    assert res2.data[0]["collection_id"] == "XX-0002"

    # Insert an item for country YY to ensure it has its own sequence
    res3 = db_client.table("items").insert({
        "type": "Coin",
        "title_en": "Test Item C",
        "country_code": "YY",
        "denomination": "50 Units",
        "year": 2026,
        "amount": 1,
        "visibility": "Public"
    }).execute()
    assert res3.data[0]["collection_id"] == "YY-0001"

def test_concurrent_sequential_ids(db_client: Client) -> None:
    # Test concurrent creation of items under the same country code
    # We will use ThreadPoolExecutor to perform concurrent insertions
    country = "ZZ"
    num_items = 5

    def insert_item(idx: int):
        # We need a new client per thread to run in parallel
        thread_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        return thread_client.table("items").insert({
            "type": "Coin",
            "title_en": f"Test Item Z-{idx}",
            "country_code": country,
            "denomination": "1 Unit",
            "year": 2026,
            "amount": 1,
            "visibility": "Public"
        }).execute()

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_items) as executor:
        futures = [executor.submit(insert_item, i) for i in range(num_items)]
        results = [f.result() for f in futures]

    collection_ids = [res.data[0]["collection_id"] for res in results]
    collection_ids.sort()

    expected_ids = [f"ZZ-000{i}" for i in range(1, num_items + 1)]
    assert collection_ids == expected_ids

def test_item_categories_many_to_many(db_client: Client) -> None:
    # 1. Create categories
    cat1_res = db_client.table("categories").insert({"name_en": "Test Item Category A"}).execute()
    cat2_res = db_client.table("categories").insert({"name_en": "Test Item Category B"}).execute()
    cat1_uuid = cat1_res.data[0]["uuid"]
    cat2_uuid = cat2_res.data[0]["uuid"]

    # 2. Create item
    item_res = db_client.table("items").insert({
        "type": "Coin",
        "title_en": "Test Item with Categories",
        "country_code": "US",
        "denomination": "1 Dollar",
        "year": 2026,
        "amount": 1,
        "visibility": "Public"
    }).execute()
    item_uuid = item_res.data[0]["uuid"]

    # 3. Associate both categories
    db_client.table("item_categories").insert([
        {"item_uuid": item_uuid, "category_uuid": cat1_uuid},
        {"item_uuid": item_uuid, "category_uuid": cat2_uuid}
    ]).execute()

    # 4. Verify associations
    joins = db_client.table("item_categories").select("*").eq("item_uuid", item_uuid).execute()
    assert len(joins.data) == 2
    category_uuids = [j["category_uuid"] for j in joins.data]
    assert cat1_uuid in category_uuids
    assert cat2_uuid in category_uuids

def test_items_rls_policies(db_client: Client) -> None:
    # Create public client (unauthenticated / anon)
    anon_client = create_client(settings.supabase_url, settings.supabase_anon_key)

    # Insert a public item and a private item using service role (admin)
    pub_res = db_client.table("items").insert({
        "type": "Coin",
        "title_en": "Test Item Public RLS",
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 2026,
        "amount": 1,
        "visibility": "Public"
    }).execute()
    pub_uuid = pub_res.data[0]["uuid"]

    priv_res = db_client.table("items").insert({
        "type": "Coin",
        "title_en": "Test Item Private RLS",
        "country_code": "US",
        "denomination": "5 Cents",
        "year": 2026,
        "amount": 1,
        "visibility": "Private"
    }).execute()
    priv_uuid = priv_res.data[0]["uuid"]

    # Query with public client (anon)
    anon_items_res = anon_client.table("items").select("*").like("title_en", "Test Item % RLS").execute()
    anon_items = anon_items_res.data
    
    # Anon should only see the public item
    assert len(anon_items) == 1
    assert anon_items[0]["uuid"] == pub_uuid
    assert anon_items[0]["title_en"] == "Test Item Public RLS"
