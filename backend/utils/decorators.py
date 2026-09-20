# ==========================================
# Velocity BI - Custom Decorators
# File: backend/utils/decorators.py
# ==========================================

from functools import wraps

from flask import jsonify, request, g

try:
    from flask_jwt_extended import (
        verify_jwt_in_request,
        get_jwt,
        get_jwt_identity,
    )
except ImportError:
    verify_jwt_in_request = None
    get_jwt = None
    get_jwt_identity = None


# ==========================================
# Helper Functions
# ==========================================

def _error_response(message, status_code=401, error="Unauthorized"):
    """
    Create a standard API error response.
    """
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code


def _get_current_user_id():
    """
    Get the current authenticated user ID from JWT.
    """
    if get_jwt_identity is None:
        return None

    try:
        return get_jwt_identity()
    except Exception:
        return None


def _get_jwt_claims():
    """
    Get JWT claims safely.
    """
    if get_jwt is None:
        return {}

    try:
        return get_jwt() or {}
    except Exception:
        return {}


# ==========================================
# Authentication Decorator
# ==========================================

def jwt_required_custom(fn):
    """
    Protect a route using JWT authentication.

    Example:
        @jwt_required_custom
        def profile():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        if verify_jwt_in_request is None:
            return _error_response(
                "JWT authentication is not configured.",
                500,
                "ConfigurationError"
            )

        try:
            verify_jwt_in_request()

            user_id = _get_current_user_id()

            if user_id is None:
                return _error_response(
                    "Invalid authentication token.",
                    401,
                    "AuthenticationError"
                )

            # Store user ID for use inside the request
            g.current_user_id = user_id
            g.current_user = {
                "id": user_id
            }

            return fn(*args, **kwargs)

        except Exception as exc:
            return _error_response(
                str(exc) or "Authentication failed.",
                401,
                "AuthenticationError"
            )

    return wrapper


# ==========================================
# Optional Authentication
# ==========================================

def optional_jwt(fn):
    """
    Allow both authenticated and unauthenticated users.

    If a valid JWT exists, the user information is stored
    in Flask's g object.

    Example:
        @optional_jwt
        def public_dashboard():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        g.current_user_id = None
        g.current_user = None

        if verify_jwt_in_request is not None:
            try:
                verify_jwt_in_request(optional=True)

                user_id = _get_current_user_id()

                if user_id is not None:
                    g.current_user_id = user_id
                    g.current_user = {
                        "id": user_id
                    }

            except Exception:
                # Ignore invalid/missing JWT for optional authentication
                pass

        return fn(*args, **kwargs)

    return wrapper


# ==========================================
# Role-Based Access Control
# ==========================================

def role_required(*allowed_roles):
    """
    Restrict access based on the user's role.

    Example:
        @role_required("admin")
        def admin_dashboard():
            ...

    Multiple roles:
        @role_required("admin", "analyst")
    """

    allowed_roles = {
        str(role).lower()
        for role in allowed_roles
    }

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            if verify_jwt_in_request is None:
                return _error_response(
                    "JWT authentication is not configured.",
                    500,
                    "ConfigurationError"
                )

            try:
                verify_jwt_in_request()

                claims = _get_jwt_claims()

                role = (
                    claims.get("role")
                    or claims.get("user_role")
                    or claims.get("roles")
                )

                # Handle roles stored as a list
                if isinstance(role, list):
                    user_roles = {
                        str(item).lower()
                        for item in role
                    }
                else:
                    user_roles = {
                        str(role).lower()
                    } if role else set()

                if not user_roles.intersection(allowed_roles):
                    return _error_response(
                        "You do not have permission to access this resource.",
                        403,
                        "AuthorizationError"
                    )

                g.current_user_id = _get_current_user_id()
                g.current_user = {
                    "id": g.current_user_id,
                    "role": role
                }

                return fn(*args, **kwargs)

            except Exception as exc:

                if "permission" in str(exc).lower():
                    return _error_response(
                        str(exc),
                        403,
                        "AuthorizationError"
                    )

                return _error_response(
                    "Authentication failed.",
                    401,
                    "AuthenticationError"
                )

        return wrapper

    return decorator


# ==========================================
# Admin Only Decorator
# ==========================================

def admin_required(fn):
    """
    Allow only admin users.

    Example:
        @admin_required
        def delete_user():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        if verify_jwt_in_request is None:
            return _error_response(
                "JWT authentication is not configured.",
                500,
                "ConfigurationError"
            )

        try:
            verify_jwt_in_request()

            claims = _get_jwt_claims()

            role = claims.get("role")

            if str(role).lower() != "admin":
                return _error_response(
                    "Admin access is required.",
                    403,
                    "AuthorizationError"
                )

            g.current_user_id = _get_current_user_id()
            g.current_user = {
                "id": g.current_user_id,
                "role": "admin"
            }

            return fn(*args, **kwargs)

        except Exception:
            return _error_response(
                "Authentication failed.",
                401,
                "AuthenticationError"
            )

    return wrapper


# ==========================================
# Analyst Access
# ==========================================

def analyst_required(fn):
    """
    Allow admin and analyst users.

    Example:
        @analyst_required
        def analyze_dataset():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        protected = role_required(
            "admin",
            "analyst"
        )

        return protected(fn)(*args, **kwargs)

    return wrapper


# ==========================================
# User/Admin Access
# ==========================================

def user_or_admin_required(fn):
    """
    Allow normal users and admins.

    Example:
        @user_or_admin_required
        def dashboard():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        protected = role_required(
            "user",
            "admin",
            "analyst"
        )

        return protected(fn)(*args, **kwargs)

    return wrapper


# ==========================================
# Permission Decorator
# ==========================================

def permission_required(permission):
    """
    Check a specific permission stored in JWT claims.

    Example:
        @permission_required("dataset.upload")
        def upload_dataset():
            ...
    """

    @wraps(permission_required)
    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            if verify_jwt_in_request is None:
                return _error_response(
                    "JWT authentication is not configured.",
                    500,
                    "ConfigurationError"
                )

            try:
                verify_jwt_in_request()

                claims = _get_jwt_claims()

                permissions = claims.get(
                    "permissions",
                    []
                )

                if isinstance(permissions, str):
                    permissions = [permissions]

                if permission not in permissions:
                    return _error_response(
                        f"Permission required: {permission}",
                        403,
                        "AuthorizationError"
                    )

                g.current_user_id = _get_current_user_id()

                return fn(*args, **kwargs)

            except Exception:
                return _error_response(
                    "Authentication failed.",
                    401,
                    "AuthenticationError"
                )

        return wrapper

    return decorator


# ==========================================
# API Key Decorator
# ==========================================

def api_key_required(expected_key=None):
    """
    Protect an API endpoint using an API key.

    The API key can be passed using:

        X-API-Key: your-api-key

    Example:
        @api_key_required("my-secret-key")
        def api_endpoint():
            ...
    """

    @wraps(api_key_required)
    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            api_key = request.headers.get("X-API-Key")

            if not api_key:
                return _error_response(
                    "API key is required.",
                    401,
                    "AuthenticationError"
                )

            if expected_key is not None and api_key != expected_key:
                return _error_response(
                    "Invalid API key.",
                    403,
                    "AuthorizationError"
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ==========================================
# JSON Request Decorator
# ==========================================

def json_required(fn):
    """
    Require application/json content type.

    Example:
        @json_required
        def create_dataset():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "InvalidContentType",
                "message": "Content-Type must be application/json."
            }), 415

        return fn(*args, **kwargs)

    return wrapper


# ==========================================
# Required Fields Decorator
# ==========================================

def required_fields(*fields):
    """
    Require specific fields in a JSON request.

    Example:
        @required_fields("name", "email")
        def register():
            ...
    """

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            data = request.get_json(silent=True) or {}

            missing_fields = [
                field
                for field in fields
                if field not in data
                or data.get(field) in (None, "")
            ]

            if missing_fields:
                return jsonify({
                    "success": False,
                    "error": "ValidationError",
                    "message": "Required fields are missing.",
                    "missing_fields": missing_fields
                }), 400

            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ==========================================
# Ownership Decorator
# ==========================================

def owner_required(user_id_parameter="user_id"):
    """
    Check that the authenticated user owns the requested resource.

    Example:
        /api/users/<user_id>/datasets

        @owner_required("user_id")
        def get_user_datasets(user_id):
            ...
    """

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            current_user_id = _get_current_user_id()
            requested_user_id = kwargs.get(user_id_parameter)

            if current_user_id is None:
                return _error_response(
                    "Authentication required.",
                    401,
                    "AuthenticationError"
                )

            if requested_user_id is None:
                return jsonify({
                    "success": False,
                    "error": "ValidationError",
                    "message": "User ID is required."
                }), 400

            if str(current_user_id) != str(requested_user_id):

                claims = _get_jwt_claims()

                if str(claims.get("role", "")).lower() != "admin":
                    return _error_response(
                        "You can only access your own resources.",
                        403,
                        "AuthorizationError"
                    )

            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ==========================================
# Active User Decorator
# ==========================================

def active_user_required(fn):
    """
    Require an active user.

    The JWT should contain:
        is_active: true

    Example:
        @active_user_required
        def upload_file():
            ...
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        if verify_jwt_in_request is None:
            return _error_response(
                "JWT authentication is not configured.",
                500,
                "ConfigurationError"
            )

        try:
            verify_jwt_in_request()

            claims = _get_jwt_claims()

            is_active = claims.get(
                "is_active",
                True
            )

            if not is_active:
                return _error_response(
                    "Your account is inactive.",
                    403,
                    "AuthorizationError"
                )

            g.current_user_id = _get_current_user_id()

            return fn(*args, **kwargs)

        except Exception:
            return _error_response(
                "Authentication failed.",
                401,
                "AuthenticationError"
            )

    return wrapper


# ==========================================
# Rate Limit Placeholder
# ==========================================

def rate_limit(limit=100):
    """
    Lightweight placeholder for rate limiting.

    For production, use Flask-Limiter.

    Example:
        @rate_limit(100)
        def api_endpoint():
            ...
    """

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Actual rate limiting should be handled
            # by Flask-Limiter or another production
            # rate-limiting service.
            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ==========================================
# Export Decorators
# ==========================================

__all__ = [
    "jwt_required_custom",
    "optional_jwt",
    "role_required",
    "admin_required",
    "analyst_required",
    "user_or_admin_required",
    "permission_required",
    "api_key_required",
    "json_required",
    "required_fields",
    "owner_required",
    "active_user_required",
    "rate_limit",
]