# ==========================================
# Velocity BI - Admin Service
# File: backend/services/admin_service.py
# ==========================================

from datetime import datetime
from typing import Optional, Dict, List, Any

from models.user import User
from models.dataset import Dataset
from models.report import Report

from extensions import db


class AdminService:
    """
    Service layer for administrative operations.

    Responsibilities:
    - Verify admin users
    - Manage users
    - Activate/deactivate users
    - Delete users
    - View datasets and reports
    - Generate admin dashboard statistics
    - Search users
    """

    # ==========================================
    # ADMIN AUTHORIZATION
    # ==========================================

    @staticmethod
    def verify_admin(user_id: int) -> bool:
        """
        Check whether a user has administrator privileges.
        """

        if not user_id:
            return False

        user = User.query.get(user_id)

        if not user:
            return False

        return (
            getattr(user, "role", "").lower() == "admin"
        )

    # ==========================================
    # REQUIRE ADMIN
    # ==========================================

    @staticmethod
    def require_admin(user_id: int) -> User:
        """
        Return admin user or raise PermissionError.
        """

        if not user_id:
            raise PermissionError("Admin authentication required.")

        user = User.query.get(user_id)

        if not user:
            raise PermissionError("Admin user not found.")

        if getattr(user, "role", "").lower() != "admin":
            raise PermissionError(
                "Administrator privileges are required."
            )

        return user

    # ==========================================
    # GET ALL USERS
    # ==========================================

    @staticmethod
    def get_users(
        admin_id: int,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get users for the admin dashboard.
        """

        AdminService.require_admin(admin_id)

        query = User.query

        # Search by name/email
        if search:
            search_value = f"%{search.strip()}%"

            query = query.filter(
                db.or_(
                    User.name.ilike(search_value),
                    User.email.ilike(search_value)
                )
            )

        # Filter by role
        if role:
            query = query.filter_by(role=role)

        # Filter by status
        if status:
            query = query.filter_by(status=status)

        users = query.order_by(
            User.created_at.desc()
        ).all()

        return [
            AdminService.serialize_user(user)
            for user in users
        ]

    # ==========================================
    # GET USER BY ID
    # ==========================================

    @staticmethod
    def get_user(
        admin_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific user's details.
        """

        AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return None

        return AdminService.serialize_user(user)

    # ==========================================
    # UPDATE USER
    # ==========================================

    @staticmethod
    def update_user(
        admin_id: int,
        user_id: int,
        name: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update user information.
        """

        AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return None

        if name is not None:
            if not name.strip():
                raise ValueError("Name cannot be empty.")

            user.name = name.strip()

        if email is not None:
            email = email.strip().lower()

            if not email:
                raise ValueError("Email cannot be empty.")

            existing_user = User.query.filter(
                User.email == email,
                User.id != user_id
            ).first()

            if existing_user:
                raise ValueError(
                    "Another user already uses this email."
                )

            user.email = email

        if role is not None:

            allowed_roles = [
                "user",
                "admin"
            ]

            if role not in allowed_roles:
                raise ValueError(
                    "Invalid role."
                )

            user.role = role

        if status is not None:

            allowed_statuses = [
                "active",
                "inactive",
                "suspended"
            ]

            if status not in allowed_statuses:
                raise ValueError(
                    "Invalid user status."
                )

            user.status = status

        user.updated_at = datetime.utcnow()

        db.session.commit()

        return AdminService.serialize_user(user)

    # ==========================================
    # ACTIVATE USER
    # ==========================================

    @staticmethod
    def activate_user(
        admin_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Activate a user account.
        """

        AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return None

        user.status = "active"
        user.updated_at = datetime.utcnow()

        db.session.commit()

        return AdminService.serialize_user(user)

    # ==========================================
    # DEACTIVATE USER
    # ==========================================

    @staticmethod
    def deactivate_user(
        admin_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Deactivate a user account.
        """

        admin = AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return None

        # Prevent accidental self-deactivation
        if admin.id == user.id:
            raise ValueError(
                "An administrator cannot deactivate their own account."
            )

        user.status = "inactive"
        user.updated_at = datetime.utcnow()

        db.session.commit()

        return AdminService.serialize_user(user)

    # ==========================================
    # SUSPEND USER
    # ==========================================

    @staticmethod
    def suspend_user(
        admin_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Suspend a user account.
        """

        admin = AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return None

        if admin.id == user.id:
            raise ValueError(
                "An administrator cannot suspend their own account."
            )

        user.status = "suspended"
        user.updated_at = datetime.utcnow()

        db.session.commit()

        return AdminService.serialize_user(user)

    # ==========================================
    # DELETE USER
    # ==========================================

    @staticmethod
    def delete_user(
        admin_id: int,
        user_id: int
    ) -> bool:
        """
        Permanently delete a user.
        """

        admin = AdminService.require_admin(admin_id)

        user = User.query.get(user_id)

        if not user:
            return False

        # Prevent admin from deleting themselves
        if admin.id == user.id:
            raise ValueError(
                "An administrator cannot delete their own account."
            )

        db.session.delete(user)
        db.session.commit()

        return True

    # ==========================================
    # GET DASHBOARD STATISTICS
    # ==========================================

    @staticmethod
    def get_dashboard_stats(
        admin_id: int
    ) -> Dict[str, Any]:
        """
        Generate statistics for the admin dashboard.
        """

        AdminService.require_admin(admin_id)

        total_users = User.query.count()

        try:
            active_users = User.query.filter_by(
                status="active"
            ).count()
        except Exception:
            active_users = 0

        try:
            inactive_users = User.query.filter_by(
                status="inactive"
            ).count()
        except Exception:
            inactive_users = 0

        try:
            suspended_users = User.query.filter_by(
                status="suspended"
            ).count()
        except Exception:
            suspended_users = 0

        try:
            admin_users = User.query.filter_by(
                role="admin"
            ).count()
        except Exception:
            admin_users = 0

        try:
            total_datasets = Dataset.query.count()
        except Exception:
            total_datasets = 0

        try:
            total_reports = Report.query.count()
        except Exception:
            total_reports = 0

        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": inactive_users,
                "suspended": suspended_users,
                "admins": admin_users
            },
            "datasets": {
                "total": total_datasets
            },
            "reports": {
                "total": total_reports
            },
            "generated_at": datetime.utcnow().isoformat()
        }

    # ==========================================
    # GET DATASET STATISTICS
    # ==========================================

    @staticmethod
    def get_dataset_stats(
        admin_id: int
    ) -> Dict[str, Any]:
        """
        Get dataset-related statistics.
        """

        AdminService.require_admin(admin_id)

        total = Dataset.query.count()

        return {
            "total_datasets": total,
            "generated_at": datetime.utcnow().isoformat()
        }

    # ==========================================
    # GET REPORT STATISTICS
    # ==========================================

    @staticmethod
    def get_report_stats(
        admin_id: int
    ) -> Dict[str, Any]:
        """
        Get report-related statistics.
        """

        AdminService.require_admin(admin_id)

        total = Report.query.count()

        stats = {
            "total_reports": total,
            "by_type": {}
        }

        try:
            reports = Report.query.all()

            for report in reports:

                report_type = getattr(
                    report,
                    "report_type",
                    "unknown"
                )

                stats["by_type"][report_type] = (
                    stats["by_type"].get(report_type, 0) + 1
                )

        except Exception:
            pass

        stats["generated_at"] = datetime.utcnow().isoformat()

        return stats

    # ==========================================
    # RECENT USERS
    # ==========================================

    @staticmethod
    def get_recent_users(
        admin_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Return recently registered users.
        """

        AdminService.require_admin(admin_id)

        limit = max(1, min(limit, 100))

        users = User.query.order_by(
            User.created_at.desc()
        ).limit(limit).all()

        return [
            AdminService.serialize_user(user)
            for user in users
        ]

    # ==========================================
    # SEARCH USERS
    # ==========================================

    @staticmethod
    def search_users(
        admin_id: int,
        keyword: str
    ) -> List[Dict[str, Any]]:
        """
        Search users by name or email.
        """

        AdminService.require_admin(admin_id)

        if not keyword or not keyword.strip():
            return []

        keyword = f"%{keyword.strip()}%"

        users = User.query.filter(
            db.or_(
                User.name.ilike(keyword),
                User.email.ilike(keyword)
            )
        ).order_by(
            User.created_at.desc()
        ).all()

        return [
            AdminService.serialize_user(user)
            for user in users
        ]

    # ==========================================
    # GET SYSTEM OVERVIEW
    # ==========================================

    @staticmethod
    def get_system_overview(
        admin_id: int
    ) -> Dict[str, Any]:
        """
        Return complete admin dashboard information.
        """

        AdminService.require_admin(admin_id)

        dashboard = AdminService.get_dashboard_stats(
            admin_id
        )

        recent_users = AdminService.get_recent_users(
            admin_id,
            limit=10
        )

        report_stats = AdminService.get_report_stats(
            admin_id
        )

        return {
            "dashboard": dashboard,
            "recent_users": recent_users,
            "report_stats": report_stats,
            "generated_at": datetime.utcnow().isoformat()
        }

    # ==========================================
    # SERIALIZE USER
    # ==========================================

    @staticmethod
    def serialize_user(
        user: User
    ) -> Dict[str, Any]:
        """
        Convert User model into JSON-safe dictionary.

        Password/password_hash is intentionally excluded.
        """

        return {
            "id": user.id,
            "name": getattr(user, "name", None),
            "email": getattr(user, "email", None),
            "role": getattr(user, "role", "user"),
            "status": getattr(user, "status", "active"),
            "created_at": (
                user.created_at.isoformat()
                if getattr(user, "created_at", None)
                else None
            ),
            "updated_at": (
                user.updated_at.isoformat()
                if getattr(user, "updated_at", None)
                else None
            )
        }


# ==========================================
# SERVICE INSTANCE
# ==========================================

admin_service = AdminService()