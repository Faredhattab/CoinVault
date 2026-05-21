from typing import Annotated, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from postgrest.exceptions import APIError

from coinvault.middleware.auth_middleware import require_admin, get_current_user, get_user_client
from coinvault.models.item import Item, PublicItem, ItemCreate, ItemUpdate
from coinvault.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["items"])
item_service = ItemService()

async def get_is_admin(request: Request) -> bool:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    try:
        token = auth_header.split(" ")[1]
        user = await get_current_user(token, request)
        if not user:
            return False
        user_client = get_user_client(token)
        profile_res = user_client.table("profiles").select("role").eq("id", user.id).single().execute()
        profile = profile_res.data
        return bool(profile and isinstance(profile, dict) and profile.get("role") == "admin")
    except Exception:
        return False

@router.post(
    "",
    response_model=Item,
    status_code=status.HTTP_201_CREATED,
    operation_id="createItem"
)
def create_item(
    item_in: ItemCreate,
    admin: Annotated[Any, Depends(require_admin)]
) -> Any:
    try:
        return item_service.create_item(item_in)
    except APIError as e:
        error_msg = str(e.message) if hasattr(e, "message") else str(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=list[Any], operation_id="listItems")
async def list_items(
    type: str | None = None,
    country_code: str | None = None,
    category_uuid: UUID | None = None,
    is_admin: bool = Depends(get_is_admin)
) -> Any:
    items_raw = item_service.list_items(
        type=type,
        country_code=country_code,
        category_uuid=category_uuid,
        admin_view=is_admin
    )
    if is_admin:
        return [Item.model_validate(item) for item in items_raw]
    else:
        return [PublicItem.model_validate(item) for item in items_raw]

@router.get("/{uuid}", response_model=Any, operation_id="getItem")
async def get_item(uuid: UUID, is_admin: bool = Depends(get_is_admin)) -> Any:
    item = item_service.get_item(uuid, admin_view=is_admin)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    if is_admin:
        return Item.model_validate(item)
    else:
        return PublicItem.model_validate(item)

@router.put("/{uuid}", response_model=Item, operation_id="updateItem")
def update_item(
    uuid: UUID,
    item_in: ItemUpdate,
    admin: Annotated[Any, Depends(require_admin)]
) -> Any:
    existing = item_service.get_item(uuid, admin_view=True)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    try:
        updated = item_service.update_item(uuid, item_in)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        return updated
    except APIError as e:
        error_msg = str(e.message) if hasattr(e, "message") else str(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{uuid}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteItem")
def delete_item(
    uuid: UUID,
    admin: Annotated[Any, Depends(require_admin)]
) -> None:
    existing = item_service.get_item(uuid, admin_view=True)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    success = item_service.delete_item(uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
