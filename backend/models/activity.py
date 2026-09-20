# ==========================================
# Velocity BI - Activity Log Model
# File: backend/models/activity.py
# ==========================================

from datetime import datetime, timezone

from extensions import db


class ActivityLog(db.Model):
    """
    Activity log model for Velocity BI.

    Records important user and system activities such as:
    - Login / logout
    - Dataset upload
    - Dataset deletion
    - Analysis
    - Dashboard creation
    - Report generation
    - Profile updates
    - Admin actions
    """

    __tablename__ = "activity_logs"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ==========================================
    # User Relationship
    # ==========================================

    user_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "users.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "activity_logs",
            lazy=True
        )
    )

    # ==========================================
    # Activity Information
    # ==========================================

    action = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    category = db.Column(
        db.String(50),
        nullable=False,
        default="system",
        index=True
    )

    # Examples:
    # authentication
    # dataset
    # analysis
    # dashboard
    # report
    # profile
    # admin
    # system

    # ==========================================
    # Target Information
    # ==========================================

    target_type = db.Column(
        db.String(50),
        nullable=True
    )

    target_id = db.Column(
        db.Integer,
        nullable=True
    )

    target_name = db.Column(
        db.String(200),
        nullable=True
    )

    # ==========================================
    # Request Information
    # ==========================================

    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    user_agent = db.Column(
        db.String(500),
        nullable=True
    )

    # ==========================================
    # Additional Data
    # ==========================================

    metadata_json = db.Column(
        db.Text,
        nullable=True
    )

    # JSON information stored as a string.
    #
    # Example:
    # {
    #     "dataset_id": 10,
    #     "rows": 5000,
    #     "columns": 12
    # }

    # ==========================================
    # Activity Status
    # ==========================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="success"
    )

    # Possible values:
    # success
    # failed
    # warning

    # ==========================================
    # Timestamp
    # ==========================================

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    # ==========================================
    # Constructor
    # ==========================================

    def __init__(
        self,
        action,
        user_id=None,
        description=None,
        category="system",
        target_type=None,
        target_id=None,
        target_name=None,
        ip_address=None,
        user_agent=None,
        metadata_json=None,
        status="success"
    ):
        self.action = action
        self.user_id = user_id

        self.description = description
        self.category = category

        self.target_type = target_type
        self.target_id = target_id
        self.target_name = target_name

        self.ip_address = ip_address
        self.user_agent = user_agent

        self.metadata_json = metadata_json

        self.status = status

    # ==========================================
    # Success Activity
    # ==========================================

    @classmethod
    def success(
        cls,
        action,
        user_id=None,
        description=None,
        category="system",
        target_type=None,
        target_id=None,
        target_name=None,
        metadata_json=None
    ):
        """
        Create a successful activity log.
        """

        return cls(
            action=action,
            user_id=user_id,
            description=description,
            category=category,
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            metadata_json=metadata_json,
            status="success"
        )

    # ==========================================
    # Failed Activity
    # ==========================================

    @classmethod
    def failed(
        cls,
        action,
        user_id=None,
        description=None,
        category="system",
        target_type=None,
        target_id=None,
        target_name=None,
        metadata_json=None
    ):
        """
        Create a failed activity log.
        """

        return cls(
            action=action,
            user_id=user_id,
            description=description,
            category=category,
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            metadata_json=metadata_json,
            status="failed"
        )

    # ==========================================
    # Warning Activity
    # ==========================================

    @classmethod
    def warning(
        cls,
        action,
        user_id=None,
        description=None,
        category="system",
        target_type=None,
        target_id=None,
        target_name=None,
        metadata_json=None
    ):
        """
        Create a warning activity log.
        """

        return cls(
            action=action,
            user_id=user_id,
            description=description,
            category=category,
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            metadata_json=metadata_json,
            status="warning"
        )

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        """
        Convert activity log into a JSON-friendly dictionary.
        """

        return {
            "id": self.id,

            "user_id": self.user_id,

            "action": self.action,
            "description": self.description,
            "category": self.category,

            "target_type": self.target_type,
            "target_id": self.target_id,
            "target_name": self.target_name,

            "ip_address": self.ip_address,
            "user_agent": self.user_agent,

            "metadata": self.metadata_json,

            "status": self.status,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }

    # ==========================================
    # String Representation
    # ==========================================

    def __repr__(self):
        return (
            f"<ActivityLog id={self.id} "
            f"action='{self.action}' "
            f"user_id={self.user_id}>"
        )