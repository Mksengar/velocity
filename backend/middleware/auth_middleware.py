# ==========================================
# Velocity BI - Authentication Middleware
# File: backend/middleware/auth_middleware.py
# ==========================================

from functools import wraps

from flask import jsonify, request, g
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
    get_jwt_identity,
)


# ==========================================
# JWT Authentication
# ==========================================

def jwt_required(fn):
    """
    Protect a route using JWT authentication.

    Example:
        @app.route("/api/profile")
        @jwt_required
        def profile():
            return jsonify({
                "message": "Authenticated user"
            })
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        try:
            # Verify JWT token
            verify_jwt_in_request()

            # Get user identity
            user_id = get_jwt_identity()

            # Get JWT claims
            claims = get_jwt()

            # Store authentication data in Flask's g object
            g.user_id = user_id
            g.user = claims

            return fn(*args, **kwargs)

        except Exception as exc:
            return jsonify({
                "success": False,
                "message": "Authentication required",
                "error": str(exc)
            }), 401

    return wrapper


# ==========================================
# Admin Authentication
# ==========================================

def admin_required(fn):
    """
    Protect a route so that only admin users
    can access it.

    Example:
        @app.route("/api/admin/users")
        @admin_required
        def get_users():
            return jsonify({
                "message": "Admin access granted"
            })
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        try:
            # First verify JWT
            verify_jwt_in_request()

            # Get JWT information
            user_id = get_jwt_identity()
            claims = get_jwt()

            # Get role from JWT claims
            role = claims.get("role", "user")

            # Check admin role
            if role.lower() != "admin":
                return jsonify({
                    "success": False,
                    "message": "Admin access required"
                }), 403

            # Store user information
            g.user_id = user_id
            g.user = claims
            g.user_role = role

            return fn(*args, **kwargs)

        except Exception as exc:
            return jsonify({
                "success": False,
                "message": "Authentication required",
                "error": str(exc)
            }), 401

    return wrapper


# ==========================================
# Role-Based Access Control
# ==========================================

def role_required(*allowed_roles):
    """
    Allow access only to specific roles.

    Example:
        @role_required("admin", "analyst")
        def analytics():
            ...
    """

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            try:
                # Verify JWT
                verify_jwt_in_request()

                # Get identity and claims
                user_id = get_jwt_identity()
                claims = get_jwt()

                user_role = claims.get("role", "user")

                # Check role
                if user_role.lower() not in [
                    role.lower() for role in allowed_roles
                ]:
                    return jsonify({
                        "success": False,
                        "message": "You do not have permission to access this resource"
                    }), 403

                # Store information
                g.user_id = user_id
                g.user = claims
                g.user_role = user_role

                return fn(*args, **kwargs)

            except Exception as exc:
                return jsonify({
                    "success": False,
                    "message": "Authentication required",
                    "error": str(exc)
                }), 401

        return wrapper

    return decorator


# ==========================================
# Optional Authentication
# ==========================================

def optional_jwt(fn):
    """
    Allows both authenticated and unauthenticated users.

    If a valid JWT exists, user information is stored
    in Flask's g object.

    If no JWT exists, the request continues normally.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):

        try:
            verify_jwt_in_request(optional=True)

            user_id = get_jwt_identity()
            claims = get_jwt()

            if user_id:
                g.user_id = user_id
                g.user = claims
                g.user_role = claims.get("role", "user")
            else:
                g.user_id = None
                g.user = None
                g.user_role = None

            return fn(*args, **kwargs)

        except Exception:
            g.user_id = None
            g.user = None
            g.user_role = None

            return fn(*args, **kwargs)

    return wrapper


# ==========================================
# Current User Helper
# ==========================================

def get_current_user():
    """
    Return the currently authenticated user.

    Returns:
        dict | None
    """

    if not hasattr(g, "user_id"):
        return None

    return {
        "id": g.user_id,
        "claims": getattr(g, "user", {}),
        "role": getattr(g, "user_role", "user")
    }


# ==========================================
# Get Current User ID
# ==========================================

def get_current_user_id():
    """
    Return the authenticated user's ID.
    """

    return getattr(g, "user_id", None)


# ==========================================
# Get Current User Role
# ==========================================

def get_current_user_role():
    """
    Return the authenticated user's role.
    """

    return getattr(g, "user_role", None)


# ==========================================
# Authentication Status
# ==========================================

def is_authenticated():
    """
    Check whether the current request
    has an authenticated user.
    """

    return getattr(g, "user_id", None) is not None