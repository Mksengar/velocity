# ==========================================
# Velocity BI - Report Service
# File: backend/services/report_service.py
# ==========================================

from datetime import datetime
from typing import Optional, Dict, List, Any

from models.report import Report
from models.dataset import Dataset


class ReportService:
    """
    Service layer for managing BI reports.

    Responsibilities:
    - Create reports
    - Get reports
    - Update reports
    - Delete reports
    - Generate reports from datasets
    - Prepare report data for frontend/export
    """

    # ==========================================
    # CREATE REPORT
    # ==========================================

    @staticmethod
    def create_report(
        user_id: int,
        dataset_id: int,
        title: str,
        description: str = "",
        report_type: str = "dashboard",
        configuration: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:

        if not user_id:
            raise ValueError("User ID is required.")

        if not dataset_id:
            raise ValueError("Dataset ID is required.")

        if not title or not title.strip():
            raise ValueError("Report title is required.")

        allowed_types = [
            "dashboard",
            "analysis",
            "visualization",
            "time_series",
            "forecast",
            "custom"
        ]

        if report_type not in allowed_types:
            raise ValueError(
                f"Invalid report type. Allowed types: {allowed_types}"
            )

        dataset = Dataset.query.get(dataset_id)

        if not dataset:
            raise ValueError("Dataset not found.")

        report = Report(
            user_id=user_id,
            dataset_id=dataset_id,
            title=title.strip(),
            description=description.strip(),
            report_type=report_type,
            configuration=configuration or {},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Works when the model uses SQLAlchemy db.session.
        from extensions import db

        db.session.add(report)
        db.session.commit()

        return ReportService.serialize_report(report)

    # ==========================================
    # GET REPORT BY ID
    # ==========================================

    @staticmethod
    def get_report(report_id: int) -> Optional[Dict[str, Any]]:

        if not report_id:
            return None

        report = Report.query.get(report_id)

        if not report:
            return None

        return ReportService.serialize_report(report)

    # ==========================================
    # GET USER REPORTS
    # ==========================================

    @staticmethod
    def get_user_reports(
        user_id: int,
        dataset_id: Optional[int] = None,
        report_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:

        if not user_id:
            return []

        query = Report.query.filter_by(user_id=user_id)

        if dataset_id:
            query = query.filter_by(dataset_id=dataset_id)

        if report_type:
            query = query.filter_by(report_type=report_type)

        reports = query.order_by(
            Report.created_at.desc()
        ).all()

        return [
            ReportService.serialize_report(report)
            for report in reports
        ]

    # ==========================================
    # UPDATE REPORT
    # ==========================================

    @staticmethod
    def update_report(
        report_id: int,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        report_type: Optional[str] = None,
        configuration: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:

        report = Report.query.get(report_id)

        if not report:
            return None

        # Security check
        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to update this report."
            )

        if title is not None:
            if not title.strip():
                raise ValueError("Report title cannot be empty.")

            report.title = title.strip()

        if description is not None:
            report.description = description.strip()

        if report_type is not None:

            allowed_types = [
                "dashboard",
                "analysis",
                "visualization",
                "time_series",
                "forecast",
                "custom"
            ]

            if report_type not in allowed_types:
                raise ValueError("Invalid report type.")

            report.report_type = report_type

        if configuration is not None:
            report.configuration = configuration

        report.updated_at = datetime.utcnow()

        from extensions import db

        db.session.commit()

        return ReportService.serialize_report(report)

    # ==========================================
    # DELETE REPORT
    # ==========================================

    @staticmethod
    def delete_report(
        report_id: int,
        user_id: int
    ) -> bool:

        report = Report.query.get(report_id)

        if not report:
            return False

        # Security check
        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to delete this report."
            )

        from extensions import db

        db.session.delete(report)
        db.session.commit()

        return True

    # ==========================================
    # GENERATE REPORT
    # ==========================================

    @staticmethod
    def generate_report(
        user_id: int,
        dataset_id: int,
        title: str,
        report_type: str = "analysis"
    ) -> Dict[str, Any]:

        dataset = Dataset.query.get(dataset_id)

        if not dataset:
            raise ValueError("Dataset not found.")

        configuration = {
            "dataset_id": dataset_id,
            "generated_by": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": report_type,
            "sections": [
                {
                    "name": "Dataset Overview",
                    "enabled": True
                },
                {
                    "name": "Statistics",
                    "enabled": True
                },
                {
                    "name": "Data Quality",
                    "enabled": True
                },
                {
                    "name": "Visualizations",
                    "enabled": True
                },
                {
                    "name": "Insights",
                    "enabled": True
                }
            ]
        }

        return ReportService.create_report(
            user_id=user_id,
            dataset_id=dataset_id,
            title=title,
            description=f"Automatically generated {report_type} report.",
            report_type=report_type,
            configuration=configuration
        )

    # ==========================================
    # UPDATE REPORT CONFIGURATION
    # ==========================================

    @staticmethod
    def update_configuration(
        report_id: int,
        user_id: int,
        configuration: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:

        if not isinstance(configuration, dict):
            raise ValueError("Configuration must be a dictionary.")

        report = Report.query.get(report_id)

        if not report:
            return None

        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to modify this report."
            )

        report.configuration = configuration
        report.updated_at = datetime.utcnow()

        from extensions import db

        db.session.commit()

        return ReportService.serialize_report(report)

    # ==========================================
    # ADD REPORT SECTION
    # ==========================================

    @staticmethod
    def add_section(
        report_id: int,
        user_id: int,
        section: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:

        if not isinstance(section, dict):
            raise ValueError("Section must be a dictionary.")

        report = Report.query.get(report_id)

        if not report:
            return None

        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to modify this report."
            )

        configuration = report.configuration or {}

        sections = configuration.get("sections", [])

        sections.append(section)

        configuration["sections"] = sections

        report.configuration = configuration
        report.updated_at = datetime.utcnow()

        from extensions import db

        db.session.commit()

        return ReportService.serialize_report(report)

    # ==========================================
    # REMOVE REPORT SECTION
    # ==========================================

    @staticmethod
    def remove_section(
        report_id: int,
        user_id: int,
        section_name: str
    ) -> Optional[Dict[str, Any]]:

        report = Report.query.get(report_id)

        if not report:
            return None

        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to modify this report."
            )

        configuration = report.configuration or {}

        sections = configuration.get("sections", [])

        configuration["sections"] = [
            section
            for section in sections
            if section.get("name") != section_name
        ]

        report.configuration = configuration
        report.updated_at = datetime.utcnow()

        from extensions import db

        db.session.commit()

        return ReportService.serialize_report(report)

    # ==========================================
    # REPORT SUMMARY
    # ==========================================

    @staticmethod
    def get_report_summary(
        report_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:

        report = Report.query.get(report_id)

        if not report:
            return None

        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to view this report."
            )

        configuration = report.configuration or {}

        sections = configuration.get("sections", [])

        return {
            "id": report.id,
            "title": report.title,
            "description": report.description,
            "report_type": report.report_type,
            "dataset_id": report.dataset_id,
            "section_count": len(sections),
            "sections": sections,
            "created_at": (
                report.created_at.isoformat()
                if report.created_at
                else None
            ),
            "updated_at": (
                report.updated_at.isoformat()
                if report.updated_at
                else None
            )
        }

    # ==========================================
    # SERIALIZE REPORT
    # ==========================================

    @staticmethod
    def serialize_report(report: Report) -> Dict[str, Any]:

        return {
            "id": report.id,
            "user_id": report.user_id,
            "dataset_id": report.dataset_id,
            "title": report.title,
            "description": report.description,
            "report_type": report.report_type,
            "configuration": report.configuration or {},
            "created_at": (
                report.created_at.isoformat()
                if report.created_at
                else None
            ),
            "updated_at": (
                report.updated_at.isoformat()
                if report.updated_at
                else None
            )
        }

    # ==========================================
    # EXPORT REPORT DATA
    # ==========================================

    @staticmethod
    def get_export_data(
        report_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:

        report = Report.query.get(report_id)

        if not report:
            return None

        if report.user_id != user_id:
            raise PermissionError(
                "You do not have permission to export this report."
            )

        return {
            "report": {
                "id": report.id,
                "title": report.title,
                "description": report.description,
                "type": report.report_type
            },
            "dataset_id": report.dataset_id,
            "configuration": report.configuration or {},
            "generated_at": datetime.utcnow().isoformat()
        }