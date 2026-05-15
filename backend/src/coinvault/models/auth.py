from pydantic import BaseModel

from coinvault.models.session import Session
from coinvault.models.user import UserProfile


class AuthResponse(BaseModel):
    user: UserProfile
    session: Session | None = None
    access_token: str
    refresh_token: str
