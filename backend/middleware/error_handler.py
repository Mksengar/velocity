# ==========================================
# Velocity BI - Error Handler
# File: backend/utils/error_handler.py
# ==========================================

import logging
import traceback

from flask import jsonify, request
from werkzeug.exceptions import HTTPException


# ==========================================
# Logger Configuration
# ==========================================

logger = logging.getLogger(__name__)


# ==========================================
# Custom Application Error
# ==========================================

class AppError(Exception):
    """
    Custom application exception.

    Example:
        raise AppError(
            "Dataset not found",
            status_code=404,
            error_code="DATASET_NOT_FOUND"
        )
    """

    def __init__(
        self,
        message="An application error occurred",
        status_code=400,
        error_code="APP_ERROR",
        details=None
    ):
        super().__init__(message)

        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details


# ==========================================
# Validation Error
# ==========================================

class ValidationError(AppError):
    """Raised when request data is invalid."""

    def __init__(
        self,
        message="Validation failed",
        details=None
    ):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


# ==========================================
# Authentication Error
# ==========================================

class AuthenticationError(AppError):
    """Raised when authentication fails."""

    def __init__(
        self,
        message="Authentication required",
        details=None
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )


# ==========================================
# Authorization Error
# ==========================================

class AuthorizationError(AppError):
    """Raised when user does not have permission."""

    def __init__(
        self,
        message="You do not have permission to perform this action",
        details=None
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


# ==========================================
# Resource Not Found Error
# ==========================================

class ResourceNotFoundError(AppError):
    """Raised when a requested resource does not exist."""

    def __init__(
        self,
        message="Resource not found",
        details=None
    ):
        super().__init__(
            message=message,
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details=details
        )


# ==========================================
# Database Error
# ==========================================

class DatabaseError(AppError):
    """Raised when a database operation fails."""

    def __init__(
        self,
        message="Database operation failed",
        details=None
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )


# ==========================================
# Error Response Helper
# ==========================================

def error_response(
    message,
    status_code=400,
    error_code="ERROR",
    details=None
):
    """
    Create a consistent API error response.
    """

    response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message
        }
    }

    if details is not None:
        response["error"]["details"] = details

    return jsonify(response), status_code


# ==========================================
# Application Error Handler
# ==========================================

def handle_app_error(error):
    """
    Handle custom AppError exceptions.
    """

    logger.warning(
        "Application error: %s",
        error.message
    )

    return error_response(
        message=error.message,
        status_code=error.status_code,
        error_code=error.error_code,
        details=error.details
    )


# ==========================================
# HTTP Error Handler
# ==========================================

def handle_http_error(error):
    """
    Handle Flask/Werkzeug HTTP errors.
    """

    status_code = error.code or 500

    logger.warning(
        "HTTP error %s: %s",
        status_code,
        error.description
    )

    return error_response(
        message=error.description,
        status_code=status_code,
        error_code=f"HTTP_{status_code}"
    )


# ==========================================
# 400 Bad Request
# ==========================================

def handle_bad_request(error):
    return error_response(
        message="Bad request",
        status_code=400,
        error_code="BAD_REQUEST"
    )


# ==========================================
# 401 Unauthorized
# ==========================================

def handle_unauthorized(error):
    return error_response(
        message="Authentication is required",
        status_code=401,
        error_code="UNAUTHORIZED"
    )


# ==========================================
# 403 Forbidden
# ==========================================

def handle_forbidden(error):
    return error_response(
        message="You do not have permission to access this resource",
        status_code=403,
        error_code="FORBIDDEN"
    )


# ==========================================
# 404 Not Found
# ==========================================

def handle_not_found(error):
    return error_response(
        message="The requested resource was not found",
        status_code=404,
        error_code="NOT_FOUND"
    )


# ==========================================
# 405 Method Not Allowed
# ==========================================

def handle_method_not_allowed(error):
    return error_response(
        message="HTTP method is not allowed for this endpoint",
        status_code=405,
        error_code="METHOD_NOT_ALLOWED"
    )


# ==========================================
# 409 Conflict
# ==========================================

def handle_conflict(error):
    return error_response(
        message="The request conflicts with the current state",
        status_code=409,
        error_code="CONFLICT"
    )


# ==========================================
# 422 Unprocessable Entity
# ==========================================

def handle_unprocessable_entity(error):
    return error_response(
        message="The request could not be processed",
        status_code=422,
        error_code="UNPROCESSABLE_ENTITY"
    )


# ==========================================
# 429 Too Many Requests
# ==========================================

def handle_rate_limit(error):
    return error_response(
        message="Too many requests. Please try again later",
        status_code=429,
        error_code="RATE_LIMIT_EXCEEDED"
    )


# ==========================================
# 500 Internal Server Error
# ==========================================

def handle_internal_error(error):
    """
    Handle unexpected server errors.

    Detailed traceback is logged on the server,
    but is NOT returned to the frontend.
    """

    logger.error(
        "Unhandled server error: %s",
        str(error)
    )

    logger.error(
        traceback.format_exc()
    )

    return error_response(
        message="An unexpected server error occurred",
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR"
    )


# ==========================================
# Global Exception Handler
# ==========================================

def handle_exception(error):
    """
    Catch unexpected exceptions.
    """

    logger.exception(
        "Unhandled exception: %s",
        str(error)
    )

    return error_response(
        message="An unexpected error occurred",
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR"
    )


# ==========================================
# Register Error Handlers
# ==========================================

def register_error_handlers(app):
    """
    Register all application error handlers
    with the Flask application.

    Usage:

        from utils.error_handler import register_error_handlers

        register_error_handlers(app)
    """

    # Custom application errors
    app.register_error_handler(
        AppError,
        handle_app_error
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

    app.register_error_handler(
        409,
        handle_conflict
    )

    app.register_error_handler(
        422,
        handle_unprocessable_entity
    )

    app.register_error_handler(
        429,
        handle_rate_limit
    )

    app.register_error_handler(
        500,
        handle_internal_error
    )

    # Catch-all exception handler
    app.register_error_handler(
        Exception,
        handle_exception
    )

    logger.info(
        "Velocity BI error handlers registered successfully"
    )