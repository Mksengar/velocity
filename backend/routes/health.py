# ==========================================
# Velocity BI - Health Check Routes
# File: backend/routes/health.py
# ==========================================

from flask import Blueprint, jsonify
from datetime import datetime, timezone
import os
import platform
import time

# Optional database import
try:
    from sqlalchemy import text
except ImportError:
    text = None

try:
    from extensions import db
except ImportError:
    db = None


# ==========================================
# Blueprint
# ==========================================

health_bp = Blueprint(
    "health",
    __name__,
    url_prefix="/api/health"
)


# ==========================================
# Application Start Time
# ==========================================

START_TIME = time.time()


# ==========================================
# Helper Functions
# ==========================================

def get_uptime():
    """Return application uptime in seconds."""
    return round(time.time() - START_TIME, 2)


def check_database():
    """
    Check whether the database connection is available.
    """

    if db is None or text is None:
        return {
            "status": "not_configured",
            "message": "Database extension is not configured."
        }

    try:
        db.session.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "message": "Database connection is working."
        }

    except Exception as error:
        return {
            "status": "unhealthy",
            "message": "Database connection failed.",
            "error": str(error)
        }


# ==========================================
# Basic Health Check
# ==========================================

@health_bp.route("/", methods=["GET"])
def health_check():
    """
    Basic API health check.

    GET /api/health/
    """

    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "Velocity BI API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": get_uptime()
    }), 200


# ==========================================
# Detailed Health Check
# ==========================================

@health_bp.route("/status", methods=["GET"])
def detailed_health_check():
    """
    Detailed health status.

    GET /api/health/status
    """

    database = check_database()

    overall_status = (
        "healthy"
        if database["status"] in ["healthy", "not_configured"]
        else "unhealthy"
    )

    response = {
        "success": overall_status == "healthy",
        "status": overall_status,
        "service": "Velocity BI API",
        "version": "1.0.0",

        "timestamp": datetime.now(timezone.utc).isoformat(),

        "components": {
            "api": {
                "status": "healthy"
            },
            "database": database
        },

        "system": {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "python_version": platform.python_version()
        },

        "uptime_seconds": get_uptime()
    }

    status_code = 200 if overall_status == "healthy" else 503

    return jsonify(response), status_code


# ==========================================
# Database Health Check
# ==========================================

@health_bp.route("/database", methods=["GET"])
def database_health():
    """
    Check only the database connection.

    GET /api/health/database
    """

    database = check_database()

    status_code = (
        200
        if database["status"] in ["healthy", "not_configured"]
        else 503
    )

    return jsonify({
        "success": database["status"] == "healthy",
        "database": database
    }), status_code


# ==========================================
# Readiness Check
# ==========================================

@health_bp.route("/ready", methods=["GET"])
def readiness_check():
    """
    Check whether the application is ready to receive requests.

    GET /api/health/ready
    """

    database = check_database()

    if database["status"] == "unhealthy":

        return jsonify({
            "success": False,
            "ready": False,
            "message": "Application is not ready.",
            "database": database
        }), 503

    return jsonify({
        "success": True,
        "ready": True,
        "message": "Velocity BI API is ready.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200


# ==========================================
# Liveness Check
# ==========================================

@health_bp.route("/live", methods=["GET"])
def liveness_check():
    """
    Check whether the application process is alive.

    GET /api/health/live
    """

    return jsonify({
        "success": True,
        "alive": True,
        "service": "Velocity BI API",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200