from typing import Any, cast
from uuid import UUID
from supabase import Client
from coinvault.services.supabase_client import supabase_admin
from coinvault.models.item import ItemCreate, ItemUpdate

class ItemService:
    def __init__(self, client: Client = supabase_admin) -> None:
        self.client = client

    def _format_item_data(self, data: dict[str, Any]) -> dict[str, Any]:
        formatted = dict(data)
        
        # Translation fallback (US3 / FR-007): fallback Arabic to English if absent
        if not formatted.get("title_ar"):
            formatted["title_ar"] = formatted.get("title_en")
        if not formatted.get("description_ar"):
            formatted["description_ar"] = formatted.get("description_en")
            
        categories_raw = formatted.pop("categories", []) or []
        categories = []
        for cat in categories_raw:
            if isinstance(cat, dict) and "categories" in cat:
                c = cat["categories"]
                if c:
                    c_formatted = dict(c)
                    if not c_formatted.get("name_ar"):
                        c_formatted["name_ar"] = c_formatted.get("name_en")
                    categories.append(c_formatted)
        formatted["categories"] = categories
        return formatted

    def list_items(
        self,
        type: str | None = None,
        country_code: str | None = None,
        category_uuid: UUID | None = None,
        admin_view: bool = False
    ) -> list[dict[str, Any]]:
        query = self.client.table("items").select("*, categories:item_categories(categories(*))")
        
        if not admin_view:
            query = query.eq("visibility", "Public")
            
        if type:
            query = query.eq("type", type)
            
        if country_code:
            query = query.eq("country_code", country_code)

        if category_uuid:
            joins = (
                self.client.table("item_categories")
                .select("item_uuid")
                .eq("category_uuid", str(category_uuid))
                .execute()
            )
            item_uuids = [j["item_uuid"] for j in joins.data]
            if not item_uuids:
                return []
            query = query.in_("uuid", item_uuids)

        response = query.order("created_at", desc=True).execute()
        return [self._format_item_data(item) for item in response.data]

    def get_item(self, item_uuid: UUID, admin_view: bool = False) -> dict[str, Any] | None:
        query = (
            self.client.table("items")
            .select("*, categories:item_categories(categories(*))")
            .eq("uuid", str(item_uuid))
        )
        
        if not admin_view:
            query = query.eq("visibility", "Public")

        response = query.execute()
        if response.data and len(response.data) > 0:
            return self._format_item_data(response.data[0])
        return None

    def create_item(self, item_in: ItemCreate) -> dict[str, Any]:
        item_data = {
            "type": item_in.type,
            "title_en": item_in.title_en,
            "title_ar": item_in.title_ar,
            "description_en": item_in.description_en,
            "description_ar": item_in.description_ar,
            "country_code": item_in.country_code,
            "denomination": item_in.denomination,
            "year": item_in.year,
            "amount": item_in.amount,
            "acquisition_year": item_in.acquisition_year,
            "visibility": item_in.visibility,
            "tags": item_in.tags,
            "front_image": item_in.front_image,
            "back_image": item_in.back_image,
            "additional_images": item_in.additional_images,
        }
        res = self.client.table("items").insert(item_data).execute()
        new_item = res.data[0]
        item_uuid = new_item["uuid"]

        if item_in.category_uuids:
            join_data = [
                {"item_uuid": str(item_uuid), "category_uuid": str(cat_uuid)}
                for cat_uuid in item_in.category_uuids
            ]
            self.client.table("item_categories").insert(join_data).execute()

        return self.get_item(UUID(item_uuid), admin_view=True) # type: ignore

    def update_item(self, item_uuid: UUID, item_in: ItemUpdate) -> dict[str, Any] | None:
        existing = self.get_item(item_uuid, admin_view=True)
        if not existing:
            return None

        update_data = {}
        for field in [
            "type", "title_en", "title_ar", "description_en", "description_ar",
            "country_code", "denomination", "year", "amount", "acquisition_year",
            "visibility", "tags", "front_image", "back_image", "additional_images"
        ]:
            val = getattr(item_in, field, None)
            if val is not None:
                update_data[field] = val

        if "visibility" in item_in.model_fields_set:
            update_data["visibility"] = item_in.visibility

        if update_data:
            self.client.table("items").update(update_data).eq("uuid", str(item_uuid)).execute()

        if item_in.category_uuids is not None:
            self.client.table("item_categories").delete().eq("item_uuid", str(item_uuid)).execute()
            if item_in.category_uuids:
                join_data = [
                    {"item_uuid": str(item_uuid), "category_uuid": str(cat_uuid)}
                    for cat_uuid in item_in.category_uuids
                ]
                self.client.table("item_categories").insert(join_data).execute()

        return self.get_item(item_uuid, admin_view=True)

    def delete_item(self, item_uuid: UUID) -> bool:
        res = self.client.table("items").delete().eq("uuid", str(item_uuid)).execute()
        return bool(res.data and len(res.data) > 0)
