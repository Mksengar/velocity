# ============================================================
# Velocity BI - Routes Package
# File: backend/routes/__init__.py
# ============================================================

"""
Velocity BI API Routes Package

This package contains all API route blueprints:

    auth_routes.py
    dataset_routes.py
    analytics_routes.py
    report_routes.py
    admin_routes.py

Blueprints are registered in app.py.
"""


# ============================================================
# Package Version
# ============================================================

__version__ = "1.0.0"


# ============================================================
# Route Prefixes
# ============================================================

AUTH_PREFIX = "/api/auth"

DATASET_PREFIX = "/api/datasets"

ANALYTICS_PREFIX = "/api/analytics"

REPORT_PREFIX = "/api/reports"

ADMIN_PREFIX = "/api/admin"


# ============================================================
# Available Route Modules
# ============================================================

AVAILABLE_ROUTES = [
    "auth_routes",
    "dataset_routes",
    "analytics_routes",
    "report_routes",
    "admin_routes"
]


# ============================================================
# Helper Function
# ============================================================

def get_route_prefix(route_name):
    """
    Return the API prefix for a route module.
    """

    prefixes = {
        "auth_routes": AUTH_PREFIX,
        "dataset_routes": DATASET_PREFIX,
        "analytics_routes": ANALYTICS_PREFIX,
        "report_routes": REPORT_PREFIX,
        "admin_routes": ADMIN_PREFIX
    }

    return prefixes.get(route_name)


# ============================================================
# Package Information
# ============================================================

def route_info():
    """
    Return information about the available API routes.
    """

    return {
        "version": __version__,
        "routes": {
            "authentication": AUTH_PREFIX,
            "datasets": DATASET_PREFIX,
            "analytics": ANALYTICS_PREFIX,
            "reports": REPORT_PREFIX,
            "admin": ADMIN_PREFIX
        }
    }