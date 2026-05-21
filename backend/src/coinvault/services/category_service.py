from typing import Any, cast
from uuid import UUID
from supabase import Client
from coinvault.services.supabase_client import supabase_admin
from coinvault.models.category import CategoryCreate, CategoryUpdate

class CategoryService:
    def __init__(self, client: Client = supabase_admin) -> None:
        self.client = client

    def list_categories(self) -> list[dict[str, Any]]:
        response = self.client.table("categories").select("*").order("name_en").execute()
        return cast(list[dict[str, Any]], response.data)

    def get_category(self, category_uuid: UUID) -> dict[str, Any] | None:
        response = (
            self.client.table("categories")
            .select("*")
            .eq("uuid", str(category_uuid))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return cast(dict[str, Any], response.data[0])
        return None

    def create_category(self, category_in: CategoryCreate) -> dict[str, Any]:
        data = {
            "name_en": category_in.name_en,
            "name_ar": category_in.name_ar,
            "parent_uuid": str(category_in.parent_uuid) if category_in.parent_uuid else None,
        }
        response = self.client.table("categories").insert(data).execute()
        return cast(dict[str, Any], response.data[0])

    def update_category(self, category_uuid: UUID, category_in: CategoryUpdate) -> dict[str, Any] | None:
        # Build update dict with only provided fields
        update_data = {}
        if category_in.name_en is not None:
            update_data["name_en"] = category_in.name_en
        if category_in.name_ar is not None:
            update_data["name_ar"] = category_in.name_ar
        if "parent_uuid" in category_in.model_fields_set:
            update_data["parent_uuid"] = (
                str(category_in.parent_uuid) if category_in.parent_uuid else None
            )

        if not update_data:
            return self.get_category(category_uuid)

        response = (
            self.client.table("categories")
            .update(update_data)
            .eq("uuid", str(category_uuid))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return cast(dict[str, Any], response.data[0])
        return None

    def delete_category(self, category_uuid: UUID) -> bool:
        response = (
            self.client.table("categories")
            .delete()
            .eq("uuid", str(category_uuid))
            .execute()
        )
        return bool(response.data and len(response.data) > 0)
