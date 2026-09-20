# ============================================================
# Velocity BI - Backend Configuration
# File: backend/config.py
# ============================================================

import os
from datetime import timedelta


# ============================================================
# Base Directory
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# Environment Helper
# ============================================================

def get_env(name, default=None):
    """
    Get a value from environment variables.
    """
    return os.getenv(name, default)


# ============================================================
# Application Configuration
# ============================================================

class Config:

    # --------------------------------------------------------
    # Application
    # --------------------------------------------------------

    APP_NAME = "Velocity BI"
    VERSION = "1.0.0"
    ENV = get_env("FLASK_ENV", "development")

    DEBUG = ENV == "development"
    TESTING = False

    # --------------------------------------------------------
    # Security
    # --------------------------------------------------------

    SECRET_KEY = get_env(
        "SECRET_KEY",
        "change-this-secret-key-in-production"
    )

    JWT_SECRET_KEY = get_env(
        "JWT_SECRET_KEY",
        "change-this-jwt-secret-key-in-production"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(get_env("JWT_EXPIRE_HOURS", "24"))
    )

    # --------------------------------------------------------
    # Server
    # --------------------------------------------------------

    HOST = get_env("HOST", "0.0.0.0")
    PORT = int(get_env("PORT", "5000"))

    # --------------------------------------------------------
    # CORS
    # --------------------------------------------------------

    CORS_ORIGINS = get_env(
        "CORS_ORIGINS",
        "*"
    )

    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    DATABASE_TYPE = get_env(
        "DATABASE_TYPE",
        "mysql"
    )

    DB_HOST = get_env(
        "DB_HOST",
        "localhost"
    )

    DB_PORT = int(get_env(
        "DB_PORT",
        "3306"
    ))

    DB_NAME = get_env(
        "DB_NAME",
        "velocity_bi"
    )

    DB_USER = get_env(
        "DB_USER",
        "root"
    )

    DB_PASSWORD = get_env(
        "DB_PASSWORD",
        ""
    )

    # SQLAlchemy connection URL
    SQLALCHEMY_DATABASE_URI = get_env(
        "DATABASE_URL",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280
    }

    # --------------------------------------------------------
    # File Upload
    # --------------------------------------------------------

    UPLOAD_FOLDER = os.path.join(
        BASE_DIR,
        "uploads"
    )

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

    ALLOWED_EXTENSIONS = {
        "csv",
        "xlsx",
        "xls",
        "json",
        "txt"
    }

    # --------------------------------------------------------
    # Dataset Settings
    # --------------------------------------------------------

    MAX_ROWS = int(get_env(
        "MAX_DATASET_ROWS",
        "100000"
    ))

    MAX_COLUMNS = int(get_env(
        "MAX_DATASET_COLUMNS",
        "200"
    ))

    # --------------------------------------------------------
    # Reports
    # --------------------------------------------------------

    REPORT_FOLDER = os.path.join(
        BASE_DIR,
        "reports"
    )

    REPORT_FORMATS = {
        "pdf",
        "xlsx",
        "csv"
    }

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    DEFAULT_PAGE = 1

    DEFAULT_PER_PAGE = 20

    MAX_PER_PAGE = 100

    # --------------------------------------------------------
    # API
    # --------------------------------------------------------

    API_PREFIX = "/api"

    # --------------------------------------------------------
    # Password Security
    # --------------------------------------------------------

    BCRYPT_LOG_ROUNDS = int(
        get_env(
            "BCRYPT_LOG_ROUNDS",
            "12"
        )
    )


# ============================================================
# Development Configuration
# ============================================================

class DevelopmentConfig(Config):

    ENV = "development"
    DEBUG = True


# ============================================================
# Production Configuration
# ============================================================

class ProductionConfig(Config):

    ENV = "production"
    DEBUG = False

    # Production should always use environment variables
    SECRET_KEY = get_env("SECRET_KEY")

    JWT_SECRET_KEY = get_env("JWT_SECRET_KEY")


# ============================================================
# Testing Configuration
# ============================================================

class TestingConfig(Config):

    ENV = "testing"
    TESTING = True
    DEBUG = True

    DATABASE_TYPE = "sqlite"

    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


# ============================================================
# Configuration Selector
# ============================================================

config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig
}


# ============================================================
# Create Required Directories
# ============================================================

def create_directories():

    directories = [
        Config.UPLOAD_FOLDER,
        Config.REPORT_FOLDER
    ]

    for directory in directories:
        os.makedirs(
            directory,
            exist_ok=True
        )


# Create folders when config.py is imported
create_directories()