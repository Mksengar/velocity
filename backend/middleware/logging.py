# ==========================================
# Velocity BI - Logging Middleware
# File: backend/middleware/logging.py
# ==========================================

import time
import logging

from flask import request, g


# ==========================================
# Logger Configuration
# ==========================================

logger = logging.getLogger("velocity_bi.middleware")


# ==========================================
# Request Logging Middleware
# ==========================================

def request_logger(app):
    """
    Register request logging middleware with Flask.

    Logs:
        - HTTP method
        - Request path
        - IP address
        - Response status
        - Request duration
    """

    @app.before_request
    def before_request():
        """
        Runs before every request.
        """

        # Store request start time
        g.request_start_time = time.perf_counter()

        logger.info(
            "REQUEST START | method=%s | path=%s | ip=%s",
            request.method,
            request.path,
            get_client_ip()
        )

    @app.after_request
    def after_request(response):
        """
        Runs after every request.
        """

        start_time = getattr(
            g,
            "request_start_time",
            None
        )

        # Calculate request duration
        if start_time is not None:
            duration = (
                time.perf_counter() - start_time
            )
        else:
            duration = 0.0

        logger.info(
            "REQUEST END | method=%s | path=%s | "
            "status=%s | duration=%.4fs",
            request.method,
            request.path,
            response.status_code,
            duration
        )

        return response

    @app.teardown_request
    def teardown_request(exception):
        """
        Runs when request processing finishes.

        Logs unexpected request exceptions.
        """

        if exception:

            logger.exception(
                "REQUEST ERROR | method=%s | path=%s | error=%s",
                request.method,
                request.path,
                str(exception)
            )


# ==========================================
# Get Client IP
# ==========================================

def get_client_ip():
    """
    Get the client's IP address.

    Uses X-Forwarded-For when the application
    is running behind a trusted reverse proxy.
    """

    forwarded_for = request.headers.get(
        "X-Forwarded-For"
    )

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.remote_addr or "unknown"


# ==========================================
# Get Request Duration
# ==========================================

def get_request_duration():
    """
    Return the current request duration in seconds.
    """

    start_time = getattr(
        g,
        "request_start_time",
        None
    )

    if start_time is None:
        return 0.0

    return time.perf_counter() - start_time


# ==========================================
# Log Custom Request Event
# ==========================================

def log_request_event(
    event,
    message=None
):
    """
    Log a custom event during a request.

    Example:
        log_request_event(
            "DATASET_UPLOAD",
            "Dataset uploaded successfully"
        )
    """

    logger.info(
        "REQUEST EVENT | event=%s | method=%s | "
        "path=%s | message=%s",
        event,
        request.method,
        request.path,
        message or ""
    )


# ==========================================
# Log Authentication Event
# ==========================================

def log_auth_event(
    event,
    user_id=None,
    success=True
):
    """
    Log authentication-related events.
    """

    status = "SUCCESS" if success else "FAILED"

    logger.info(
        "AUTH EVENT | event=%s | user_id=%s | "
        "status=%s | ip=%s",
        event,
        user_id or "anonymous",
        status,
        get_client_ip()
    )


# ==========================================
# Log API Error
# ==========================================

def log_api_error(
    error,
    status_code=500
):
    """
    Log an API error.
    """

    logger.error(
        "API ERROR | method=%s | path=%s | "
        "status=%s | error=%s",
        request.method,
        request.path,
        status_code,
        str(error)
    )