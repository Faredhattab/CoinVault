from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from coinvault.core.config import Settings, settings
from coinvault.services.admin_health import admin_account_seeded
from coinvault.services.auth_health import auth_reachable
from coinvault.services.database_health import database_reachable
from coinvault.services.migration_health import migrations_applied
from coinvault.services.storage_health import storage_reachable
from coinvault.services.supabase_client import supabase_admin


class HealthStatus(StrEnum):
    ok = "ok"
    degraded = "degraded"
    unavailable = "unavailable"


class ServiceHealth(BaseModel):
    status: HealthStatus
    latency_ms: float | None = Field(default=None, ge=0)
    message: str = Field(min_length=1)


class HealthResponse(BaseModel):
    status: HealthStatus
    checked_at: datetime
    services: dict[str, ServiceHealth]


router = APIRouter(tags=["foundation"])


def get_settings() -> Settings:
    return settings


def aggregate_status(services: dict[str, ServiceHealth]) -> HealthStatus:
    statuses = [service.status for service in services.values()]
    if any(status == HealthStatus.unavailable for status in statuses):
        return HealthStatus.unavailable
    if any(status == HealthStatus.degraded for status in statuses):
        return HealthStatus.degraded
    return HealthStatus.ok


def _status_from_probe(result: tuple[bool, str]) -> ServiceHealth:
    reachable, message = result
    return ServiceHealth(
        status=HealthStatus.ok if reachable else HealthStatus.unavailable,
        message=message,
    )


@router.get(
    "/health", response_model=HealthResponse, operation_id="getFoundationHealth"
)
def get_health(config: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    missing = config.missing_required_values()
    config_message = (
        f"Missing local configuration: {', '.join(missing)}"
        if missing
        else "Backend reachable"
    )
    backend_status = HealthStatus.degraded if missing else HealthStatus.ok

    services = {
        "web": ServiceHealth(
            status=HealthStatus.ok, message="Frontend shell reachable"
        ),
        "backend": ServiceHealth(status=backend_status, message=config_message),
        "database": _status_from_probe(database_reachable(config.supabase_db_url)),
        "migrations": _status_from_probe(migrations_applied(supabase_admin)),
        "auth": _status_from_probe(auth_reachable(config.supabase_url)),
        "admin": _status_from_probe(admin_account_seeded(supabase_admin, config)),
        "storage": _status_from_probe(storage_reachable(config.supabase_storage_url)),
    }
    return HealthResponse(
        status=aggregate_status(services),
        checked_at=datetime.now(UTC),
        services=services,
    )
