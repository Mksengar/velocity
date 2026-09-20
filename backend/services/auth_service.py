
# ==========================================
# Velocity BI - Authentication Service
# File: backend/services/auth_service.py
# ==========================================

from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import current_app, request


# ==========================================
# Password Utilities
# ==========================================

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    Args:
        password: Plain-text password.

    Returns:
        Hashed password as a string.
    """

    if not password:
        raise ValueError("Password is required.")

    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against a bcrypt hash.

    Args:
        password: Plain-text password.
        password_hash: Stored bcrypt password hash.

    Returns:
        True if password matches, otherwise False.
    """

    if not password or not password_hash:
        return False

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


# ==========================================
# JWT Utilities
# ==========================================

def create_access_token(user_id, email, role="user"):
    """
    Create a JWT access token.

    Args:
        user_id: Unique user ID.
        email: User email.
        role: User role.

    Returns:
        JWT token string.
    """

    secret_key = current_app.config.get("JWT_SECRET_KEY")

    if not secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured."
        )

    expiration_minutes = current_app.config.get(
        "JWT_ACCESS_TOKEN_EXPIRES_MINUTES",
        60
    )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(
            minutes=expiration_minutes
        )
    }

    token = jwt.encode(
        payload,
        secret_key,
        algorithm="HS256"
    )

    return token


def decode_access_token(token: str):
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token.

    Returns:
        Token payload if valid.

    Raises:
        ValueError: If token is invalid or expired.
    """

    secret_key = current_app.config.get("JWT_SECRET_KEY")

    if not secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured."
        )

    if not token:
        raise ValueError("Access token is required.")

    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=["HS256"]
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise ValueError("Access token has expired.")

    except jwt.InvalidTokenError:
        raise ValueError("Invalid access token.")


# ==========================================
# Authorization Decorator
# ==========================================

def token_required(function):
    """
    Protect a Flask route using JWT authentication.

    Example:

        @app.route("/profile")
        @token_required
        def profile():
            return {"message": "Authenticated"}
    """

    @wraps(function)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return {
                "success": False,
                "message": "Authorization header is required."
            }, 401

        if not auth_header.startswith("Bearer "):
            return {
                "success": False,
                "message": "Authorization header must use Bearer token."
            }, 401

        token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return {
                "success": False,
                "message": "Access token is missing."
            }, 401

        try:
            payload = decode_access_token(token)

        except ValueError as error:
            return {
                "success": False,
                "message": str(error)
            }, 401

        # Make authenticated user information
        # available to the route.
        request.current_user = payload

        return function(*args, **kwargs)

    return decorated


# ==========================================
# Role Authorization
# ==========================================

def role_required(*allowed_roles):
    """
    Restrict a route to specific user roles.

    Example:

        @app.route("/admin/users")
        @token_required
        @role_required("admin")
        def admin_users():
            return {"message": "Admin access granted"}
    """

    def decorator(function):

        @wraps(function)
        def decorated(*args, **kwargs):

            current_user = getattr(
                request,
                "current_user",
                None
            )

            if not current_user:
                return {
                    "success": False,
                    "message": "Authentication required."
                }, 401

            user_role = current_user.get("role")

            if user_role not in allowed_roles:
                return {
                    "success": False,
                    "message": "You do not have permission to access this resource."
                }, 403

            return function(*args, **kwargs)

        return decorated

    return decorator


# ==========================================
# Authentication Service
# ==========================================

class AuthService:
    """
    Main authentication service.

    Database operations are intentionally kept separate
    so this service can work with MySQL, PostgreSQL,
    SQLite, or another database layer.
    """

    @staticmethod
    def register_user(user_repository, name, email, password, role="user"):
        """
        Register a new user.

        Args:
            user_repository: Database/repository object.
            name: User's name.
            email: User email.
            password: Plain-text password.
            role: User role.

        Returns:
            Created user information.
        """

        if not name or not name.strip():
            raise ValueError("Name is required.")

        if not email or not email.strip():
            raise ValueError("Email is required.")

        if not password:
            raise ValueError("Password is required.")

        if len(password) < 6:
            raise ValueError(
                "Password must contain at least 6 characters."
            )

        email = email.strip().lower()

        # Check whether email already exists.
        existing_user = user_repository.find_by_email(email)

        if existing_user:
            raise ValueError(
                "An account with this email already exists."
            )

        password_hash = hash_password(password)

        user_data = {
            "name": name.strip(),
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "created_at": datetime.now(timezone.utc)
        }

        user = user_repository.create(user_data)

        return user

    @staticmethod
    def login_user(user_repository, email, password):
        """
        Authenticate a user and generate a JWT.

        Args:
            user_repository: Database/repository object.
            email: User email.
            password: Plain-text password.

        Returns:
            Dictionary containing token and user information.
        """

        if not email or not password:
            raise ValueError(
                "Email and password are required."
            )

        email = email.strip().lower()

        user = user_repository.find_by_email(email)

        if not user:
            raise ValueError(
                "Invalid email or password."
            )

        password_hash = user.get("password_hash")

        if not verify_password(
            password,
            password_hash
        ):
            raise ValueError(
                "Invalid email or password."
            )

        token = create_access_token(
            user_id=user.get("id"),
            email=user.get("email"),
            role=user.get("role", "user")
        )

        return {
            "token": token,
            "user": {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role", "user")
            }
        }

    @staticmethod
    def get_current_user():
        """
        Get the currently authenticated user.

        Returns:
            User information stored inside the JWT.
        """

        current_user = getattr(
            request,
            "current_user",
            None
        )

        if not current_user:
            return None

        return current_user


# ==========================================
# Service Health Check
# ==========================================

def auth_service_status():
    """
    Return authentication service status.
    """

    return {
        "service": "authentication",
        "status": "active",
        "jwt": True,
        "password_hashing": "bcrypt"
    }

