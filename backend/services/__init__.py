```python
# ==========================================
# Velocity BI - Services Package
# File: backend/services/__init__.py
# ==========================================

"""
Velocity BI Services Package

This package contains business-logic and service
modules used by the Flask backend.

Example services:
    - Data processing
    - Data analysis
    - Visualization
    - Report generation
    - Dataset management
    - Authentication helpers
"""

# Package version
__version__ = "1.0.0"

# Optional service imports
# Uncomment these when the corresponding files exist.

# from .dataset_service import DatasetService
# from .analysis_service import AnalysisService
# from .report_service import ReportService
# from .visualization_service import VisualizationService


def init_services(app):
    """
    Initialize backend services with the Flask application.

    Args:
        app: Flask application instance.
    """

    # Service initialization can be added here later.
    #
    # Example:
    # DatasetService.init_app(app)
    # AnalysisService.init_app(app)

    return app
```
