from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from coinvault.api.auth import router as auth_router
from coinvault.api.health import router as health_router
from coinvault.core.config import settings


def create_app() -> FastAPI:
    cors_origins = [
        origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
    ]
    app = FastAPI(
        title="CoinVault Foundation API",
        version="0.1.0",
        description="Local-only Phase 1 foundation API for CoinVault.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    return app


app = create_app()
