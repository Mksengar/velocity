# ==========================================
# Velocity BI - Report Model
# File: backend/models/report.py
# ==========================================

from datetime import datetime, timezone

from extensions import db


class Report(db.Model):
    """
    Report model for Velocity BI.

    Stores:
    - Report information
    - Report owner
    - Dataset/dashboard relationships
    - Generated report content
    - Export information
    - Report status
    """

    __tablename__ = "reports"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ==========================================
    # Report Information
    # ==========================================

    name = db.Column(
        db.String(150),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    report_type = db.Column(
        db.String(50),
        nullable=False,
        default="analytics"
    )

    # Examples:
    # analytics
    # sales
    # financial
    # marketing
    # performance
    # custom

    # ==========================================
    # Report Content
    # ==========================================

    content = db.Column(
        db.Text,
        nullable=True
    )

    summary = db.Column(
        db.Text,
        nullable=True
    )

    insights = db.Column(
        db.Text,
        nullable=True
    )

    charts = db.Column(
        db.Text,
        nullable=True
    )

    # JSON data can be stored as strings.
    # This works with both SQLite and MySQL.

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
            "reports",
            lazy=True
        )
    )

    # ==========================================
    # Dashboard Relationship
    # ==========================================

    dashboard_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "dashboards.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    dashboard = db.relationship(
        "Dashboard",
        backref=db.backref(
            "reports",
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
            "reports",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    # ==========================================
    # Report Status
    # ==========================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="draft"
    )

    # Possible values:
    # draft
    # generating
    # completed
    # failed
    # archived

    error_message = db.Column(
        db.Text,
        nullable=True
    )

    # ==========================================
    # Export Information
    # ==========================================

    export_format = db.Column(
        db.String(20),
        nullable=True
    )

    # Examples:
    # pdf
    # excel
    # csv
    # json

    file_path = db.Column(
        db.String(500),
        nullable=True
    )

    file_name = db.Column(
        db.String(255),
        nullable=True
    )

    # ==========================================
    # Visibility
    # ==========================================

    is_public = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    # ==========================================
    # Report Statistics
    # ==========================================

    view_count = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    download_count = db.Column(
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

    generated_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # ==========================================
    # Constructor
    # ==========================================

    def __init__(
        self,
        name,
        user_id,
        title=None,
        description=None,
        report_type="analytics",
        dataset_id=None,
        dashboard_id=None
    ):
        self.name = name
        self.user_id = user_id

        self.title = title
        self.description = description
        self.report_type = report_type

        self.dataset_id = dataset_id
        self.dashboard_id = dashboard_id

    # ==========================================
    # Start Generation
    # ==========================================

    def start_generation(self):
        """
        Mark report generation as started.
        """

        self.status = "generating"
        self.error_message = None

    # ==========================================
    # Complete Report
    # ==========================================

    def mark_completed(self):
        """
        Mark report generation as completed.
        """

        self.status = "completed"
        self.generated_at = datetime.now(timezone.utc)
        self.error_message = None

    # ==========================================
    # Mark Report Failed
    # ==========================================

    def mark_failed(self, error_message):
        """
        Mark report generation as failed.
        """

        self.status = "failed"
        self.error_message = str(error_message)

    # ==========================================
    # Archive Report
    # ==========================================

    def archive(self):
        """
        Archive the report.
        """

        self.status = "archived"
        self.is_public = False

    # ==========================================
    # Publish Report
    # ==========================================

    def publish(self):
        """
        Make the report publicly accessible.
        """

        self.is_public = True

    # ==========================================
    # Unpublish Report
    # ==========================================

    def unpublish(self):
        """
        Make the report private.
        """

        self.is_public = False

    # ==========================================
    # Update Report Content
    # ==========================================

    def update_content(
        self,
        content=None,
        summary=None,
        insights=None,
        charts=None
    ):
        """
        Update generated report content.
        """

        if content is not None:
            self.content = content

        if summary is not None:
            self.summary = summary

        if insights is not None:
            self.insights = insights

        if charts is not None:
            self.charts = charts

    # ==========================================
    # Set Export Information
    # ==========================================

    def set_export(
        self,
        export_format,
        file_path=None,
        file_name=None
    ):
        """
        Store report export information.
        """

        self.export_format = export_format
        self.file_path = file_path
        self.file_name = file_name

    # ==========================================
    # View Counter
    # ==========================================

    def increment_views(self):
        """
        Increase report view count.
        """

        self.view_count += 1

    # ==========================================
    # Download Counter
    # ==========================================

    def increment_downloads(self):
        """
        Increase report download count.
        """

        self.download_count += 1

    # ==========================================
    # Status Properties
    # ==========================================

    @property
    def is_completed(self):
        """
        Check whether report generation is complete.
        """

        return self.status == "completed"

    @property
    def is_generating(self):
        """
        Check whether report is currently generating.
        """

        return self.status == "generating"

    @property
    def is_failed(self):
        """
        Check whether report generation failed.
        """

        return self.status == "failed"

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        """
        Convert report object to JSON-friendly dictionary.
        """

        return {
            "id": self.id,

            "name": self.name,
            "title": self.title,
            "description": self.description,
            "report_type": self.report_type,

            "content": self.content,
            "summary": self.summary,
            "insights": self.insights,
            "charts": self.charts,

            "dataset_id": self.dataset_id,
            "dashboard_id": self.dashboard_id,
            "user_id": self.user_id,

            "status": self.status,
            "error_message": self.error_message,

            "export_format": self.export_format,
            "file_path": self.file_path,
            "file_name": self.file_name,

            "is_public": self.is_public,

            "view_count": self.view_count,
            "download_count": self.download_count,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),

            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),

            "generated_at": (
                self.generated_at.isoformat()
                if self.generated_at
                else None
            )
        }

    # ==========================================
    # String Representation
    # ==========================================

    def __repr__(self):
        return (
            f"<Report id={self.id} "
            f"name='{self.name}' "
            f"user_id={self.user_id}>"
        )