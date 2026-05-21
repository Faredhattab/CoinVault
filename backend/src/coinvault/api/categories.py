from typing import Annotated, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from coinvault.middleware.auth_middleware import require_admin
from coinvault.models.category import Category, CategoryCreate, CategoryUpdate
from coinvault.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])
category_service = CategoryService()

@router.post(
    "",
    response_model=Category,
    status_code=status.HTTP_201_CREATED,
    operation_id="createCategory"
)
def create_category(
    category_in: CategoryCreate,
    admin: Annotated[Any, Depends(require_admin)]
) -> Any:
    try:
        return category_service.create_category(category_in)
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

@router.get("", response_model=list[Category], operation_id="listCategories")
def list_categories() -> Any:
    return category_service.list_categories()

@router.get("/{uuid}", response_model=Category, operation_id="getCategory")
def get_category(uuid: UUID) -> Any:
    category = category_service.get_category(uuid)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.put("/{uuid}", response_model=Category, operation_id="updateCategory")
def update_category(
    uuid: UUID,
    category_in: CategoryUpdate,
    admin: Annotated[Any, Depends(require_admin)]
) -> Any:
    # Check if category exists first
    existing = category_service.get_category(uuid)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    try:
        updated = category_service.update_category(uuid, category_in)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
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

@router.delete("/{uuid}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteCategory")
def delete_category(
    uuid: UUID,
    admin: Annotated[Any, Depends(require_admin)]
) -> None:
    existing = category_service.get_category(uuid)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    success = category_service.delete_category(uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
