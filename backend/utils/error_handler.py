"""
==========================================
Velocity BI - Error Handler
File: backend/utils/error_handler.py
==========================================

Centralized error handling for the Flask API.

Handles:
- HTTP errors
- Validation errors
- Authentication errors
- Database errors
- File errors
- General server errors
- JSON API responses
- Logging
"""

from __future__ import annotations

import logging
import os
import traceback
from datetime import datetime, timezone
from typing import Any, Optional

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException


# ==========================================
# Configuration
# ==========================================

DEBUG_MODE = os.getenv(
    "FLASK_DEBUG",
    "False"
).lower() == "true"


# ==========================================
# Logger Configuration
# ==========================================

logger = logging.getLogger(
    "velocity_bi"
)

if not logger.handlers:
    handler = logging.StreamHandler()

    formatter = logging.Formatter(
        "[%(asctime)s] "
        "%(levelname)s - "
        "%(name)s - "
        "%(message)s"
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    logger.setLevel(
        logging.DEBUG
        if DEBUG_MODE
        else logging.INFO
    )


# ==========================================
# Custom Exceptions
# ==========================================

class VelocityBIError(Exception):
    """
    Base exception for Velocity BI.
    """

    status_code = 500
    error_code = "VELOCITY_BI_ERROR"

    def __init__(
        self,
        message: str = "An error occurred.",
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        details: Any = None,
    ):
        super().__init__(message)

        self.message = message

        if status_code is not None:
            self.status_code = status_code

        if error_code is not None:
            self.error_code = error_code

        self.details = details


class ValidationError(VelocityBIError):
    """
    Raised when request data is invalid.
    """

    status_code = 400
    error_code = "VALIDATION_ERROR"


class AuthenticationError(VelocityBIError):
    """
    Raised when authentication fails.
    """

    status_code = 401
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(VelocityBIError):
    """
    Raised when user lacks permission.
    """

    status_code = 403
    error_code = "AUTHORIZATION_ERROR"


class ResourceNotFoundError(VelocityBIError):
    """
    Raised when requested resource does not exist.
    """

    status_code = 404
    error_code = "RESOURCE_NOT_FOUND"


class ConflictError(VelocityBIError):
    """
    Raised when a resource conflicts with
    an existing resource.
    """

    status_code = 409
    error_code = "CONFLICT_ERROR"


class FileProcessingError(VelocityBIError):
    """
    Raised when file processing fails.
    """

    status_code = 422
    error_code = "FILE_PROCESSING_ERROR"


class DatabaseError(VelocityBIError):
    """
    Raised when a database operation fails.
    """

    status_code = 500
    error_code = "DATABASE_ERROR"


# ==========================================
# Timestamp
# ==========================================

def get_timestamp() -> str:
    """
    Return current UTC timestamp.
    """

    return datetime.now(
        timezone.utc
    ).isoformat()


# ==========================================
# Request Information
# ==========================================

def get_request_info() -> dict:
    """
    Return basic request information.

    Does not include sensitive request data.
    """

    return {
        "method": request.method,
        "path": request.path,
        "endpoint": request.endpoint,
    }


# ==========================================
# Error Response
# ==========================================

def error_response(
    message: str,
    status_code: int = 500,
    error_code: str = "INTERNAL_SERVER_ERROR",
    details: Any = None,
):
    """
    Create a standardized JSON error response.
    """

    response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        },
        "timestamp": get_timestamp(),
    }

    if details is not None:
        response["error"]["details"] = details

    return jsonify(response), status_code


# ==========================================
# Success Response Helper
# ==========================================

def success_response(
    data: Any = None,
    message: str = "Request successful.",
    status_code: int = 200,
):
    """
    Create a standardized JSON success response.
    """

    response = {
        "success": True,
        "message": message,
        "timestamp": get_timestamp(),
    }

    if data is not None:
        response["data"] = data

    return jsonify(response), status_code


# ==========================================
# Custom Velocity BI Error Handler
# ==========================================

def handle_velocity_bi_error(
    error: VelocityBIError
):
    """
    Handle custom Velocity BI exceptions.
    """

    logger.warning(
        "%s: %s",
        error.error_code,
        error.message
    )

    return error_response(
        message=error.message,
        status_code=error.status_code,
        error_code=error.error_code,
        details=error.details,
    )


# ==========================================
# HTTP Error Handler
# ==========================================

def handle_http_error(
    error: HTTPException
):
    """
    Handle Flask/Werkzeug HTTP errors.

    Examples:
        400
        401
        403
        404
        405
        415
        500
    """

    status_code = error.code or 500

    error_code = (
        error.name
        .upper()
        .replace(" ", "_")
        if error.name
        else "HTTP_ERROR"
    )

    logger.warning(
        "HTTP %s - %s - %s",
        status_code,
        error_code,
        request.path
    )

    return error_response(
        message=error.description
        or "HTTP request failed.",
        status_code=status_code,
        error_code=error_code,
    )


# ==========================================
# Bad Request
# ==========================================

def handle_bad_request(error):
    """
    Handle malformed requests.
    """

    logger.warning(
        "Bad request: %s",
        error
    )

    return error_response(
        message="Invalid request.",
        status_code=400,
        error_code="BAD_REQUEST",
    )


# ==========================================
# Method Not Allowed
# ==========================================

def handle_method_not_allowed(error):
    """
    Handle unsupported HTTP methods.

    Example:
        Sending GET to a POST-only endpoint.
    """

    logger.warning(
        "Method not allowed: %s %s",
        request.method,
        request.path
    )

    return error_response(
        message=(
            f"HTTP method '{request.method}' "
            "is not allowed for this endpoint."
        ),
        status_code=405,
        error_code="METHOD_NOT_ALLOWED",
    )


# ==========================================
# Unauthorized
# ==========================================

def handle_unauthorized(error=None):
    """
    Handle unauthorized requests.
    """

    logger.warning(
        "Unauthorized request: %s",
        request.path
    )

    return error_response(
        message="Authentication is required.",
        status_code=401,
        error_code="UNAUTHORIZED",
    )


# ==========================================
# Forbidden
# ==========================================

def handle_forbidden(error=None):
    """
    Handle forbidden requests.
    """

    logger.warning(
        "Forbidden request: %s",
        request.path
    )

    return error_response(
        message="You do not have permission to access this resource.",
        status_code=403,
        error_code="FORBIDDEN",
    )


# ==========================================
# Not Found
# ==========================================

def handle_not_found(error=None):
    """
    Handle missing routes/resources.
    """

    logger.warning(
        "Resource not found: %s %s",
        request.method,
        request.path
    )

    return error_response(
        message="The requested resource was not found.",
        status_code=404,
        error_code="NOT_FOUND",
    )


# ==========================================
# Database Error
# ==========================================

def handle_database_error(error):
    """
    Handle database-related exceptions.
    """

    logger.error(
        "Database error: %s",
        str(error)
    )

    if DEBUG_MODE:
        details = str(error)
    else:
        details = None

    return error_response(
        message="A database error occurred.",
        status_code=500,
        error_code="DATABASE_ERROR",
        details=details,
    )


# ==========================================
# File Error
# ==========================================

def handle_file_error(error):
    """
    Handle file-processing errors.
    """

    logger.error(
        "File processing error: %s",
        str(error)
    )

    return error_response(
        message="Unable to process the uploaded file.",
        status_code=422,
        error_code="FILE_PROCESSING_ERROR",
        details=(
            str(error)
            if DEBUG_MODE
            else None
        ),
    )


# ==========================================
# JSON Decode Error
# ==========================================

def handle_json_error(error):
    """
    Handle invalid JSON request bodies.
    """

    logger.warning(
        "Invalid JSON request: %s",
        str(error)
    )

    return error_response(
        message="Invalid JSON request body.",
        status_code=400,
        error_code="INVALID_JSON",
    )


# ==========================================
# General Exception
# ==========================================

def handle_general_exception(error):
    """
    Handle unexpected server errors.

    Detailed exception information is logged,
    but is not exposed to users in production.
    """

    logger.exception(
        "Unhandled exception: %s",
        str(error)
    )

    details = None

    if DEBUG_MODE:
        details = {
            "type": type(error).__name__,
            "message": str(error),
            "traceback": traceback.format_exc(),
        }

    return error_response(
        message="An unexpected server error occurred.",
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        details=details,
    )


# ==========================================
# Register Error Handlers
# ==========================================

def register_error_handlers(
    app: Flask
) -> Flask:
    """
    Register all global error handlers
    with the Flask application.

    Usage:

        register_error_handlers(app)
    """

    # Custom Velocity BI errors
    app.register_error_handler(
        VelocityBIError,
        handle_velocity_bi_error
    )

    # HTTP errors
    app.register_error_handler(
        HTTPException,
        handle_http_error
    )

    # Specific HTTP errors
    app.register_error_handler(
        400,
        handle_bad_request
    )

    app.register_error_handler(
        401,
        handle_unauthorized
    )

    app.register_error_handler(
        403,
        handle_forbidden
    )

    app.register_error_handler(
        404,
        handle_not_found
    )

    app.register_error_handler(
        405,
        handle_method_not_allowed
    )

    # General errors
    app.register_error_handler(
        Exception,
        handle_general_exception
    )

    logger.info(
        "Velocity BI error handlers registered."
    )

    return app


# ==========================================
# Safe Error Message
# ==========================================

def get_safe_error_message(
    error: Exception
) -> str:
    """
    Return an error message suitable for
    API responses.
    """

    if isinstance(
        error,
        VelocityBIError
    ):
        return error.message

    if DEBUG_MODE:
        return str(error)

    return "An unexpected error occurred."


# ==========================================
# Exported Functions
# ==========================================

__all__ = [
    "VelocityBIError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ResourceNotFoundError",
    "ConflictError",
    "FileProcessingError",
    "DatabaseError",
    "error_response",
    "success_response",
    "handle_velocity_bi_error",
    "handle_http_error",
    "handle_bad_request",
    "handle_method_not_allowed",
    "handle_unauthorized",
    "handle_forbidden",
    "handle_not_found",
    "handle_database_error",
    "handle_file_error",
    "handle_json_error",
    "handle_general_exception",
    "register_error_handlers",
    "get_safe_error_message",
]