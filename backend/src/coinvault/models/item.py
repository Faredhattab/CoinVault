from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from coinvault.models.category import Category

class ItemBase(BaseModel):
    type: str = Field(..., pattern="^(Coin|Banknote)$")
    title_en: str = Field(..., min_length=1)
    title_ar: str | None = Field(default=None, min_length=1)
    description_en: str | None = None
    description_ar: str | None = None
    country_code: str = Field(..., pattern="^[A-Z]{2}$")
    denomination: str = Field(..., min_length=1)
    year: int = Field(..., ge=0)
    visibility: str = Field(default="Public", pattern="^(Public|Private)$")
    tags: list[str] = Field(default_factory=list)
    front_image: str | None = None
    back_image: str | None = None
    additional_images: list[str] = Field(default_factory=list)

class ItemCreate(ItemBase):
    amount: int = Field(default=1, ge=0)
    acquisition_year: int | None = Field(default=None, ge=0)
    category_uuids: list[UUID] = Field(default_factory=list)

class ItemUpdate(BaseModel):
    type: str | None = Field(default=None, pattern="^(Coin|Banknote)$")
    title_en: str | None = Field(default=None, min_length=1)
    title_ar: str | None = Field(default=None, min_length=1)
    description_en: str | None = None
    description_ar: str | None = None
    country_code: str | None = Field(default=None, pattern="^[A-Z]{2}$")
    denomination: str | None = Field(default=None, min_length=1)
    year: int | None = Field(default=None, ge=0)
    amount: int | None = Field(default=None, ge=0)
    acquisition_year: int | None = Field(default=None, ge=0)
    visibility: str | None = Field(default=None, pattern="^(Public|Private)$")
    tags: list[str] | None = None
    front_image: str | None = None
    back_image: str | None = None
    additional_images: list[str] | None = None
    category_uuids: list[UUID] | None = None

class PublicItem(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    uuid: UUID
    collection_id: str
    created_at: datetime
    updated_at: datetime
    categories: list[Category] = []

class Item(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    uuid: UUID
    collection_id: str
    amount: int
    acquisition_year: int | None = None
    created_at: datetime
    updated_at: datetime
    categories: list[Category] = []
