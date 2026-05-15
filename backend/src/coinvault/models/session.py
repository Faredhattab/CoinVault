from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class SessionBase(BaseModel):
    user_id: UUID
    device_info: dict[str, Any] = {}
    ip_address: str | None = None
    user_agent: str | None = None


class SessionCreate(SessionBase):
    expires_at: datetime


class Session(SessionBase):
    id: UUID
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True
