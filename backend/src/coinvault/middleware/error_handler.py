import os
import traceback
from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from coinvault.core.logging import logger


async def error_handler_middleware(
    request: Request, call_next: Callable[[Request], Coroutine[Any, Any, Any]]
) -> Any:
    try:
        return await call_next(request)
    except HTTPException as e:
        # Re-raise HTTP exceptions to let FastAPI handle them
        raise e
    except Exception as e:
        # Log unhandled exceptions
        logger.error(
            f"Unhandled exception: {str(e)}",
            extra={
                "extra_fields": {
                    "path": request.url.path,
                    "method": request.method,
                    "stack_trace": traceback.format_exc(),
                }
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "message": (
                    str(e)
                    if os.environ.get("ENVIRONMENT") == "development"
                    else "An unexpected error occurred."
                ),
            },
        )


def setup_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            f"Global exception: {exc}", extra={"extra_fields": {"stack": traceback.format_exc()}}
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
