# ==========================================
# Velocity BI - User Model
# File: backend/models/user.py
# ==========================================

from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


class User(db.Model):
    """
    User model for Velocity BI.

    Stores user authentication, profile,
    role, and account status information.
    """

    __tablename__ = "users"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ==========================================
    # User Information
    # ==========================================

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False,
        index=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    # ==========================================
    # Profile Information
    # ==========================================

    first_name = db.Column(
        db.String(50),
        nullable=True
    )

    last_name = db.Column(
        db.String(50),
        nullable=True
    )

    profile_image = db.Column(
        db.String(255),
        nullable=True
    )

    # ==========================================
    # Role & Account Status
    # ==========================================

    role = db.Column(
        db.String(20),
        nullable=False,
        default="user"
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    is_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    # ==========================================
    # Login Information
    # ==========================================

    last_login = db.Column(
        db.DateTime,
        nullable=True
    )

    login_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    # ==========================================
    # Timestamps
    # ==========================================

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # ==========================================
    # Constructor
    # ==========================================

    def __init__(
        self,
        username,
        email,
        password=None,
        first_name=None,
        last_name=None,
        role="user"
    ):
        self.username = username
        self.email = email.lower().strip()
        self.first_name = first_name
        self.last_name = last_name
        self.role = role

        if password:
            self.set_password(password)

    # ==========================================
    # Password Methods
    # ==========================================

    def set_password(self, password):
        """
        Hash and store the user's password.
        """

        if not password:
            raise ValueError("Password cannot be empty.")

        self.password_hash = generate_password_hash(
            password,
            method="pbkdf2:sha256"
        )

    def check_password(self, password):
        """
        Verify a password against the stored hash.
        """

        if not self.password_hash:
            return False

        return check_password_hash(
            self.password_hash,
            password
        )

    # ==========================================
    # Full Name
    # ==========================================

    @property
    def full_name(self):
        """
        Return user's full name.
        """

        name = " ".join(
            part for part in [
                self.first_name,
                self.last_name
            ]
            if part
        )

        return name or self.username

    # ==========================================
    # Admin Check
    # ==========================================

    @property
    def is_admin(self):
        """
        Check whether the user has admin privileges.
        """

        return self.role == "admin"

    # ==========================================
    # Update Login Information
    # ==========================================

    def update_login(self):
        """
        Update login information after successful login.
        """

        self.last_login = datetime.now(timezone.utc)
        self.login_count += 1

    # ==========================================
    # Convert User to Dictionary
    # ==========================================

    def to_dict(self, include_email=True):
        """
        Convert user object to a JSON-friendly dictionary.

        Password hash is intentionally never returned.
        """

        data = {
            "id": self.id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "profile_image": self.profile_image,
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "login_count": self.login_count,
            "last_login": (
                self.last_login.isoformat()
                if self.last_login
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }

        if include_email:
            data["email"] = self.email

        return data

    # ==========================================
    # String Representation
    # ==========================================

    def __repr__(self):
        return (
            f"<User id={self.id} "
            f"username='{self.username}' "
            f"email='{self.email}'>"
        )