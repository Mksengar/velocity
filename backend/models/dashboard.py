# ==========================================
# Velocity BI - Dashboard Model
# File: backend/models/dashboard.py
# ==========================================

from datetime import datetime, timezone

from extensions import db


class Dashboard(db.Model):
    """
    Dashboard model for Velocity BI.

    Stores:
    - Dashboard name and description
    - Dashboard owner
    - Layout/configuration
    - Dataset connection
    - Publication status
    - Creation/update timestamps
    """

    __tablename__ = "dashboards"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ==========================================
    # Dashboard Information
    # ==========================================

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    # ==========================================
    # Dashboard Type
    # ==========================================

    dashboard_type = db.Column(
        db.String(50),
        nullable=False,
        default="analytics"
    )

    # Examples:
    # analytics
    # sales
    # finance
    # marketing
    # healthcare
    # custom

    # ==========================================
    # Dashboard Configuration
    # ==========================================

    layout = db.Column(
        db.Text,
        nullable=True
    )

    configuration = db.Column(
        db.Text,
        nullable=True
    )

    filters = db.Column(
        db.Text,
        nullable=True
    )

    # These fields store JSON strings.
    # SQLite/MySQL compatible approach.

    # ==========================================
    # Dataset Relationship
    # ==========================================

    dataset_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "datasets.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    dataset = db.relationship(
        "Dataset",
        backref=db.backref(
            "dashboards",
            lazy=True
        )
    )

    # ==========================================
    # User / Owner Relationship
    # ==========================================

    user_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "dashboards",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    # ==========================================
    # Dashboard Status
    # ==========================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="draft"
    )

    is_public = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    is_favorite = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    # ==========================================
    # Dashboard Statistics
    # ==========================================

    view_count = db.Column(
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
        name,
        user_id,
        description=None,
        dashboard_type="analytics",
        dataset_id=None,
        layout=None,
        configuration=None,
        filters=None
    ):
        self.name = name
        self.user_id = user_id

        self.description = description
        self.dashboard_type = dashboard_type
        self.dataset_id = dataset_id

        self.layout = layout
        self.configuration = configuration
        self.filters = filters

    # ==========================================
    # Publish Dashboard
    # ==========================================

    def publish(self):
        """
        Publish the dashboard.
        """

        self.status = "published"
        self.is_public = True

    # ==========================================
    # Unpublish Dashboard
    # ==========================================

    def unpublish(self):
        """
        Convert dashboard back to private draft.
        """

        self.status = "draft"
        self.is_public = False

    # ==========================================
    # Archive Dashboard
    # ==========================================

    def archive(self):
        """
        Archive the dashboard.
        """

        self.status = "archived"
        self.is_public = False

    # ==========================================
    # Favorite Dashboard
    # ==========================================

    def toggle_favorite(self):
        """
        Toggle dashboard favorite status.
        """

        self.is_favorite = not self.is_favorite

    # ==========================================
    # Increment View Count
    # ==========================================

    def increment_views(self):
        """
        Increase dashboard view count.
        """

        self.view_count += 1

    # ==========================================
    # Update Configuration
    # ==========================================

    def update_configuration(
        self,
        layout=None,
        configuration=None,
        filters=None
    ):
        """
        Update dashboard layout/configuration.
        """

        if layout is not None:
            self.layout = layout

        if configuration is not None:
            self.configuration = configuration

        if filters is not None:
            self.filters = filters

    # ==========================================
    # Dashboard Status Helpers
    # ==========================================

    @property
    def is_published(self):
        """
        Check whether dashboard is published.
        """

        return self.status == "published"

    @property
    def is_archived(self):
        """
        Check whether dashboard is archived.
        """

        return self.status == "archived"

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        """
        Convert dashboard object to JSON-friendly dictionary.
        """

        return {
            "id": self.id,

            "name": self.name,
            "description": self.description,

            "dashboard_type": self.dashboard_type,

            "layout": self.layout,
            "configuration": self.configuration,
            "filters": self.filters,

            "dataset_id": self.dataset_id,
            "user_id": self.user_id,

            "status": self.status,
            "is_public": self.is_public,
            "is_published": self.is_published,
            "is_favorite": self.is_favorite,

            "view_count": self.view_count,

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

    # ==========================================
    # String Representation
    # ==========================================

    def __repr__(self):
        return (
            f"<Dashboard id={self.id} "
            f"name='{self.name}' "
            f"user_id={self.user_id}>"
        )