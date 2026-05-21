from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class CategoryBase(BaseModel):
    name_en: str = Field(..., min_length=1)
    name_ar: str | None = Field(default=None, min_length=1)
    parent_uuid: UUID | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name_en: str | None = Field(default=None, min_length=1)
    name_ar: str | None = Field(default=None, min_length=1)
    parent_uuid: UUID | None = None

class Category(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    uuid: UUID
    created_at: datetime
    updated_at: datetime
