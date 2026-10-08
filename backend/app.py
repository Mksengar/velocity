# ============================================================
# Velocity BI - Flask Backend
# File: backend/app.py
# ============================================================

import os
import sys
from datetime import timedelta
from pathlib import Path
import secrets

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

try:
    from database import db
except ModuleNotFoundError:
    from backend.database import db

try:
    from models import User
except ModuleNotFoundError:
    from backend.models import User

try:
    from routes.auth import auth_bp
except ModuleNotFoundError:
    from backend.routes.auth import auth_bp


jwt = JWTManager()


def create_app(config_name=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)

    config_name = (config_name or os.getenv("FLASK_ENV", "development")).lower()
    is_production = config_name == "production"

    secret_key = os.getenv("SECRET_KEY")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    database_url = os.getenv("DATABASE_URL")

    if is_production:
        missing_settings = [
            name
            for name, value in (
                ("SECRET_KEY", secret_key),
                ("JWT_SECRET_KEY", jwt_secret_key),
                ("DATABASE_URL", database_url),
            )
            if not value
        ]
        if missing_settings:
            raise RuntimeError(
                "Missing required production environment variables: "
                + ", ".join(missing_settings)
            )

    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config["SECRET_KEY"] = secret_key or secrets.token_urlsafe(32)
    app.config["JWT_SECRET_KEY"] = jwt_secret_key or secrets.token_urlsafe(32)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    app.config["TESTING"] = config_name == "testing"

    if config_name == "testing":
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url or "sqlite:///velocity_bi.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
    )

    db.init_app(app)
    jwt.init_app(app)

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({
            "success": False,
            "error": "Authorization token is missing"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "success": False,
            "error": "Invalid authorization token"
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "error": "Authorization token has expired"
        }), 401

    @app.route("/")
    def home():
        accepted = request.accept_mimetypes
        if accepted["text/html"] > accepted["application/json"]:
            return send_from_directory(PROJECT_ROOT / "frontend", "index.html")
        return jsonify({
            "success": True,
            "message": "Velocity BI Backend is running",
            "version": "1.0.0",
            "api": "/api"
        })

    @app.route("/css/<path:filename>")
    def frontend_css(filename):
        return send_from_directory(PROJECT_ROOT / "frontend" / "CSS", filename)

    @app.route("/<path:filename>")
    def frontend_files(filename):
        return send_from_directory(PROJECT_ROOT / "frontend", filename)

    @app.route("/api")
    def api_status():
        return jsonify({
            "success": True,
            "message": "Velocity BI API is working",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth",
                "datasets": "/api/datasets",
                "analytics": "/api/analytics",
                "reports": "/api/reports"
            }
        })

    @app.route(
        "/api/<path:filename>",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    def api_not_found(filename):
        return jsonify({
            "success": False,
            "error": "Endpoint not found"
        }), 404

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "success": True,
            "status": "healthy",
            "service": "Velocity BI Backend"
        })

    @app.route("/api/test", methods=["GET"])
    def test_api():
        return jsonify({
            "success": True,
            "message": "Backend connection successful"
        })

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Endpoint not found"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": "Method not allowed"
        }), 405

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            "success": False,
            "error": "File is too large. Maximum size is 50 MB."
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    try:
        from routes.datasets import datasets_bp
        app.register_blueprint(datasets_bp)
    except ModuleNotFoundError:
        from backend.routes.datasets import datasets_bp
        app.register_blueprint(datasets_bp)

    try:
        from routes.dashboard import dashboard_bp
        app.register_blueprint(dashboard_bp)
    except ModuleNotFoundError:
        from backend.routes.dashboard import dashboard_bp
        app.register_blueprint(dashboard_bp)

    try:
        from routes.admin import admin_bp
        app.register_blueprint(admin_bp)
    except ModuleNotFoundError:
        from backend.routes.admin import admin_bp
        app.register_blueprint(admin_bp)

    with app.app_context():
        db.create_all()

    return app


app = create_app()


if __name__ == "__main__":
    print("=" * 60)
    print("             VELOCITY BI BACKEND")
    print("=" * 60)
    port = int(os.getenv("PORT", "5000"))
    print(f"Port:   {port}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=False)
