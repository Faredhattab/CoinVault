import pytest
from postgrest.exceptions import APIError
from supabase import create_client, Client
from coinvault.core.config import settings

@pytest.fixture(scope="module")
def db_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

@pytest.fixture(autouse=True)
def clean_test_categories(db_client: Client):
    # Setup: clean any orphaned test categories
    db_client.table("item_categories").delete().neq("item_uuid", "00000000-0000-0000-0000-000000000000").execute()
    db_client.table("categories").delete().like("name_en", "Test %").execute()
    yield
    # Teardown: clean up test categories
    db_client.table("categories").delete().like("name_en", "Test %").execute()

def test_category_depth_limit_three_levels(db_client: Client) -> None:
    # 1. Level 1: Root
    res_l1 = db_client.table("categories").insert({
        "name_en": "Test Level 1",
        "name_ar": "المستوى الأول"
    }).execute()
    l1_uuid = res_l1.data[0]["uuid"]

    # 2. Level 2
    res_l2 = db_client.table("categories").insert({
        "name_en": "Test Level 2",
        "name_ar": "المستوى الثاني",
        "parent_uuid": l1_uuid
    }).execute()
    l2_uuid = res_l2.data[0]["uuid"]

    # 3. Level 3
    res_l3 = db_client.table("categories").insert({
        "name_en": "Test Level 3",
        "name_ar": "المستوى الثالث",
        "parent_uuid": l2_uuid
    }).execute()
    l3_uuid = res_l3.data[0]["uuid"]

    assert l1_uuid is not None
    assert l2_uuid is not None
    assert l3_uuid is not None

    # 4. Level 4 (Should fail)
    with pytest.raises(APIError) as exc_info:
        db_client.table("categories").insert({
            "name_en": "Test Level 4",
            "name_ar": "المستوى الرابع",
            "parent_uuid": l3_uuid
        }).execute()
    
    assert "Category hierarchy depth cannot exceed 3 levels" in str(exc_info.value)

def test_category_self_reference_rejection(db_client: Client) -> None:
    res = db_client.table("categories").insert({
        "name_en": "Test Self Parent",
    }).execute()
    cat_uuid = res.data[0]["uuid"]

    # Try to set parent_uuid to itself
    with pytest.raises(APIError) as exc_info:
        db_client.table("categories").update({
            "parent_uuid": cat_uuid
        }).eq("uuid", cat_uuid).execute()

    assert "Category cannot reference itself as parent" in str(exc_info.value)

def test_category_circular_reference_rejection(db_client: Client) -> None:
    # A -> B -> C -> A
    res_a = db_client.table("categories").insert({"name_en": "Test A"}).execute()
    res_b = db_client.table("categories").insert({"name_en": "Test B"}).execute()
    
    uuid_a = res_a.data[0]["uuid"]
    uuid_b = res_b.data[0]["uuid"]

    # B's parent is A
    db_client.table("categories").update({"parent_uuid": uuid_a}).eq("uuid", uuid_b).execute()

    # Try setting A's parent to B
    with pytest.raises(APIError) as exc_info:
        db_client.table("categories").update({"parent_uuid": uuid_b}).eq("uuid", uuid_a).execute()

    assert "Circular reference detected" in str(exc_info.value)
