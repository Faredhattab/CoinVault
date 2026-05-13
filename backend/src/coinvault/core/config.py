from __future__ import annotations

import os
from collections.abc import Iterable
from dataclasses import dataclass

SECRET_MARKERS = ("KEY", "SECRET", "TOKEN", "PASSWORD")


@dataclass(frozen=True)
class Settings:
    app_env: str = "local"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_anon_key: str = "replace-with-local-anon-key"
    supabase_service_role_key: str = "replace-with-local-service-role-key"
    supabase_db_url: str = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    supabase_storage_url: str = "http://127.0.0.1:54321/storage/v1"

    @classmethod
    def from_env(cls) -> Settings:
        return cls(
            app_env=os.getenv("APP_ENV", cls.app_env),
            api_host=os.getenv("API_HOST", cls.api_host),
            api_port=int(os.getenv("API_PORT", str(cls.api_port))),
            cors_origins=os.getenv("CORS_ORIGINS", cls.cors_origins),
            supabase_url=os.getenv("SUPABASE_URL", cls.supabase_url),
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", cls.supabase_anon_key),
            supabase_service_role_key=os.getenv(
                "SUPABASE_SERVICE_ROLE_KEY", cls.supabase_service_role_key
            ),
            supabase_db_url=os.getenv("SUPABASE_DB_URL", cls.supabase_db_url),
            supabase_storage_url=os.getenv("SUPABASE_STORAGE_URL", cls.supabase_storage_url),
        )

    def missing_required_values(self) -> list[str]:
        values = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_ANON_KEY": self.supabase_anon_key,
            "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
            "SUPABASE_DB_URL": self.supabase_db_url,
            "SUPABASE_STORAGE_URL": self.supabase_storage_url,
        }
        return [name for name, value in values.items() if not value or value.startswith("replace-")]


def redact_setting(name: str, value: str | None) -> str:
    if value is None:
        return ""
    if any(marker in name.upper() for marker in SECRET_MARKERS):
        return "[redacted]"
    return value


def redact_mapping(items: Iterable[tuple[str, str | None]]) -> dict[str, str]:
    return {name: redact_setting(name, value) for name, value in items}


settings = Settings.from_env()
