import json
import logging
import sys
from datetime import datetime
from typing import Any

# Standard LogRecord attributes that should NOT be included in extra fields
_STANDARD_RECORD_ATTRS = frozenset(
    {
        "args",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "message",
        "module",
        "msecs",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)

# Sensitive field names that must never appear in logs
_SENSITIVE_KEYS = frozenset(
    {
        "password",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "authorization",
        "api_key",
        "private_key",
        "credential",
    }
)


def _is_sensitive(key: str) -> bool:
    """Check if a key name refers to sensitive data."""
    return key.lower() in _SENSITIVE_KEYS


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra_fields dict if present (legacy pattern)
        if hasattr(record, "extra_fields"):
            for key, value in record.extra_fields.items():
                if not _is_sensitive(key):
                    log_entry[key] = value

        # Capture any extra attributes passed via logging `extra={}` kwarg
        for key, value in record.__dict__.items():
            if key.startswith("_") or key in _STANDARD_RECORD_ATTRS:
                continue
            if key == "extra_fields":
                continue  # Already handled above
            if _is_sensitive(key):
                continue
            log_entry[key] = value

        return json.dumps(log_entry)


def setup_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    root_logger.addHandler(handler)

    # Silence some noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)


setup_logging()
logger = logging.getLogger("coinvault")
