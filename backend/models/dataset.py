# ==========================================
# Velocity BI - Dataset Model
# File: backend/models/dataset.py
# ==========================================

from datetime import datetime, timezone

from extensions import db


class Dataset(db.Model):
    """
    Dataset model for Velocity BI.

    Stores metadata about uploaded datasets such as:
    - Dataset name
    - File information
    - File type
    - Number of rows and columns
    - Upload status
    - Dataset owner
    """

    __tablename__ = "datasets"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ==========================================
    # Dataset Information
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
    # File Information
    # ==========================================

    original_filename = db.Column(
        db.String(255),
        nullable=False
    )

    stored_filename = db.Column(
        db.String(255),
        nullable=True
    )

    file_path = db.Column(
        db.String(500),
        nullable=True
    )

    file_type = db.Column(
        db.String(50),
        nullable=True
    )

    file_size = db.Column(
        db.BigInteger,
        nullable=True
    )

    # ==========================================
    # Dataset Statistics
    # ==========================================

    row_count = db.Column(
        db.BigInteger,
        nullable=False,
        default=0
    )

    column_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    # ==========================================
    # Dataset Status
    # ==========================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="uploaded"
    )

    is_processed = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    error_message = db.Column(
        db.Text,
        nullable=True
    )

    # ==========================================
    # Dataset Format
    # ==========================================

    source_type = db.Column(
        db.String(50),
        nullable=False,
        default="file"
    )

    # Examples:
    # file
    # csv
    # excel
    # json
    # sql
    # api

    # ==========================================
    # User Relationship
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
            "datasets",
            lazy=True,
            cascade="all, delete-orphan"
        )
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
        original_filename,
        user_id,
        description=None,
        stored_filename=None,
        file_path=None,
        file_type=None,
        file_size=None,
        source_type="file"
    ):
        self.name = name
        self.original_filename = original_filename
        self.user_id = user_id

        self.description = description
        self.stored_filename = stored_filename
        self.file_path = file_path
        self.file_type = file_type
        self.file_size = file_size
        self.source_type = source_type

    # ==========================================
    # Update Statistics
    # ==========================================

    def update_statistics(
        self,
        row_count=0,
        column_count=0
    ):
        """
        Update dataset row and column statistics.
        """

        self.row_count = max(0, int(row_count))
        self.column_count = max(0, int(column_count))

    # ==========================================
    # Mark as Processed
    # ==========================================

    def mark_processed(self):
        """
        Mark dataset processing as successful.
        """

        self.is_processed = True
        self.status = "processed"
        self.error_message = None

    # ==========================================
    # Mark Processing Error
    # ==========================================

    def mark_error(self, error_message):
        """
        Mark dataset processing as failed.
        """

        self.is_processed = False
        self.status = "error"
        self.error_message = str(error_message)

    # ==========================================
    # Mark Processing
    # ==========================================

    def mark_processing(self):
        """
        Mark dataset as currently being processed.
        """

        self.status = "processing"
        self.error_message = None

    # ==========================================
    # File Size Formatter
    # ==========================================

    @property
    def file_size_mb(self):
        """
        Return file size in MB.
        """

        if not self.file_size:
            return 0

        return round(
            self.file_size / (1024 * 1024),
            2
        )

    # ==========================================
    # Dataset Status Check
    # ==========================================

    @property
    def is_ready(self):
        """
        Return True if dataset is ready for analysis.
        """

        return (
            self.is_processed
            and self.status == "processed"
        )

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        """
        Convert dataset object to JSON-friendly dictionary.
        """

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,

            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "file_size_mb": self.file_size_mb,

            "row_count": self.row_count,
            "column_count": self.column_count,

            "status": self.status,
            "is_processed": self.is_processed,
            "is_ready": self.is_ready,
            "error_message": self.error_message,

            "source_type": self.source_type,

            "user_id": self.user_id,

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
            f"<Dataset id={self.id} "
            f"name='{self.name}' "
            f"user_id={self.user_id}>"
        )