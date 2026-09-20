# ==========================================
# Velocity BI - Database Models
# File: backend/models/__init__.py
# ==========================================

"""
Velocity BI Database Models

This package contains all SQLAlchemy database models
used by the Velocity BI backend.

Models:
    User
    Dataset
    Analysis
    Report
    Dashboard
    ActivityLog

All models are imported here so they can be accessed as:

    from models import User, Dataset
"""


# ==========================================
# Import Models
# ==========================================

# Import these when the corresponding model files exist.

try:
    from .user import User
except ImportError:
    User = None

try:
    from .dataset import Dataset
except ImportError:
    Dataset = None

try:
    from .analysis import Analysis
except ImportError:
    Analysis = None

try:
    from .report import Report
except ImportError:
    Report = None

try:
    from .dashboard import Dashboard
except ImportError:
    Dashboard = None

try:
    from .activity import ActivityLog
except ImportError:
    ActivityLog = None


# ==========================================
# Public Models
# ==========================================

__all__ = [
    "User",
    "Dataset",
    "Analysis",
    "Report",
    "Dashboard",
    "ActivityLog",
]