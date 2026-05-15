from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserProfile(UserBase):
    id: str
    role: str = "user"
    linked_providers: list[str] = []
    display_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str
