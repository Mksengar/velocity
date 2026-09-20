"""
==========================================
Velocity BI - Utility Package
File: backend/utils/__init__.py
==========================================

This package contains reusable utility/helper
functions used throughout the Velocity BI backend.

Examples:
    - Authentication helpers
    - File validation
    - Data validation
    - Error handling
    - Response formatting
    - Security utilities
    - Date/time helpers
"""

# ==========================================
# Package Information
# ==========================================

__version__ = "1.0.0"
__author__ = "Velocity BI Team"


# ==========================================
# Utility Package Initialization
# ==========================================

# Keep this file lightweight.
# Individual utility modules can be imported when needed.

# Example:
# from utils.auth_utils import generate_token
# from utils.file_utils import allowed_file


__all__ = [
    "__version__",
    "__author__",
]