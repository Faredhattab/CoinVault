from __future__ import annotations

import logging
import traceback

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from coinvault.api.auth import router as auth_router
from coinvault.api.health import router as health_router
from coinvault.api.categories import router as categories_router
from coinvault.api.items import router as items_router
from coinvault.core.config import settings

logger = logging.getLogger("coinvault")


def create_app() -> FastAPI:
    cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
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
    app.include_router(categories_router, prefix="/api/v1")
    app.include_router(items_router, prefix="/api/v1")

    # Global exception handler (registered after routers)
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"Unhandled exception: {type(exc).__name__}: {str(exc)}\n"
            f"Path: {request.url.path}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": f"Internal server error: {type(exc).__name__}: {str(exc)}",
                "type": type(exc).__name__,
            },
        )

    return app


app = create_app()
