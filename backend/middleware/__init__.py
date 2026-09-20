# ==========================================
# Velocity BI - Middleware Package
# File: backend/middleware/__init__.py
# ==========================================

"""
Middleware package for Velocity BI.

This package contains reusable Flask middleware
for authentication, authorization, error handling,
request logging, and security-related processing.
"""

from .auth_middleware import (
    jwt_required,
    admin_required,
)

from .error_middleware import (
    register_error_handlers,
)

from .logging_middleware import (
    request_logger,
)

__all__ = [
    "jwt_required",
    "admin_required",
    "register_error_handlers",
    "request_logger",
]