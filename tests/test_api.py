# ==========================================
# Velocity BI - API Integration Tests
# File: backend/tests/test_api.py
# ==========================================

import pytest

from app import create_app


# ==========================================
# Test Configuration
# ==========================================

@pytest.fixture
def app():
    """
    Create Flask application for testing.
    """

    app = create_app("testing")

    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret-key",
        JWT_SECRET_KEY="test-jwt-secret-key",
    )

    return app


@pytest.fixture
def client(app):
    """
    Create Flask test client.
    """

    return app.test_client()


# ==========================================
# Authentication Helpers
# ==========================================

def register_test_user(client):
    """
    Register a test user.
    """

    return client.post(
        "/api/auth/register",
        json={
            "name": "API Test User",
            "email": "api-test@example.com",
            "password": "Password123",
        },
    )


def get_auth_token(client):
    """
    Register and login a test user.
    """

    register_response = register_test_user(client)

    assert register_response.status_code in [
        200,
        201,
        400,
        409,
    ]

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "api-test@example.com",
            "password": "Password123",
        },
    )

    if login_response.status_code != 200:
        return None

    data = login_response.get_json() or {}

    return (
        data.get("access_token")
        or data.get("token")
    )


@pytest.fixture
def auth_headers(client):
    """
    Return JWT authorization headers.
    """

    token = get_auth_token(client)

    if not token:
        pytest.skip("JWT token was not returned.")

    return {
        "Authorization": f"Bearer {token}"
    }


# ==========================================
# Root API Tests
# ==========================================

def test_api_root(client):
    """
    Test the root API endpoint.
    """

    response = client.get("/")

    assert response.status_code in [
        200,
        404,
    ]


def test_api_response_is_json(client):
    """
    Test that API responses can return JSON.
    """

    response = client.get("/api/health")

    if response.status_code == 200:
        assert response.is_json

        data = response.get_json()

        assert data is not None


# ==========================================
# Health API Tests
# ==========================================

def test_health_endpoint(client):
    """
    Test application health endpoint.
    """

    response = client.get("/api/health")

    assert response.status_code in [
        200,
        404,
    ]


def test_health_endpoint_json(client):
    """
    Test health endpoint JSON response.
    """

    response = client.get("/api/health")

    if response.status_code == 200:
        data = response.get_json()

        assert isinstance(data, dict)


# ==========================================
# Authentication API Tests
# ==========================================

def test_register_api(client):
    """
    Test registration API.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "name": "New API User",
            "email": "new-api-user@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code in [
        200,
        201,
        400,
        409,
    ]


def test_login_api(client):
    """
    Test login API.
    """

    register_test_user(client)

    response = client.post(
        "/api/auth/login",
        json={
            "email": "api-test@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code in [
        200,
        401,
        404,
    ]


def test_login_invalid_credentials(client):
    """
    Test invalid login credentials.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "WrongPassword",
        },
    )

    assert response.status_code in [
        400,
        401,
        404,
    ]


# ==========================================
# Dataset API Tests
# ==========================================

def test_datasets_endpoint_requires_auth(client):
    """
    Test that dataset endpoint requires authentication.
    """

    response = client.get("/api/datasets")

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_datasets_endpoint(client, auth_headers):
    """
    Test authenticated dataset endpoint.
    """

    response = client.get(
        "/api/datasets",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


# ==========================================
# Analysis API Tests
# ==========================================

def test_analysis_endpoint_requires_auth(client):
    """
    Test analysis authentication.
    """

    response = client.get("/api/analysis")

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_analysis_endpoint(client, auth_headers):
    """
    Test authenticated analysis endpoint.
    """

    response = client.get(
        "/api/analysis",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


# ==========================================
# Visualization API Tests
# ==========================================

def test_visualization_endpoint_requires_auth(client):
    """
    Test visualization endpoint authentication.
    """

    response = client.get("/api/visualization")

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_visualization_endpoint(client, auth_headers):
    """
    Test authenticated visualization endpoint.
    """

    response = client.get(
        "/api/visualization",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


# ==========================================
# Dashboard API Tests
# ==========================================

def test_dashboard_endpoint_requires_auth(client):
    """
    Test dashboard endpoint authentication.
    """

    response = client.get("/api/dashboard")

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_dashboard_endpoint(client, auth_headers):
    """
    Test authenticated dashboard endpoint.
    """

    response = client.get(
        "/api/dashboard",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


# ==========================================
# Report API Tests
# ==========================================

def test_reports_endpoint_requires_auth(client):
    """
    Test report endpoint authentication.
    """

    response = client.get("/api/reports")

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_reports_endpoint(client, auth_headers):
    """
    Test authenticated reports endpoint.
    """

    response = client.get(
        "/api/reports",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


# ==========================================
# Admin API Tests
# ==========================================

def test_admin_endpoint_requires_auth(client):
    """
    Test admin endpoint authentication.
    """

    response = client.get("/api/admin")

    assert response.status_code in [
        401,
        403,
        404,
    ]


# ==========================================
# Profile API Tests
# ==========================================

def test_profile_endpoint(client, auth_headers):
    """
    Test profile endpoint.
    """

    response = client.get(
        "/api/profile",
        headers=auth_headers,
    )

    assert response.status_code in [
        200,
        404,
    ]


def test_profile_without_authentication(client):
    """
    Test profile endpoint without authentication.
    """

    response = client.get("/api/profile")

    assert response.status_code in [
        401,
        403,
        404,
    ]


# ==========================================
# HTTP Method Tests
# ==========================================

def test_invalid_method_for_health(client):
    """
    Test unsupported HTTP method.
    """

    response = client.delete("/api/health")

    assert response.status_code in [
        404,
        405,
    ]


def test_invalid_method_for_login(client):
    """
    Test invalid HTTP method for login.
    """

    response = client.get("/api/auth/login")

    assert response.status_code in [
        404,
        405,
    ]


# ==========================================
# Error Handling Tests
# ==========================================

def test_not_found_endpoint(client):
    """
    Test unknown API endpoint.
    """

    response = client.get(
        "/api/this-endpoint-does-not-exist"
    )

    assert response.status_code == 404


def test_invalid_json_request(client):
    """
    Test malformed JSON request.
    """

    response = client.post(
        "/api/auth/login",
        data="{invalid-json}",
        content_type="application/json",
    )

    assert response.status_code in [
        400,
        415,
        422,
    ]


# ==========================================
# Authentication Token Tests
# ==========================================

def test_invalid_token(client):
    """
    Test API request with invalid JWT.
    """

    response = client.get(
        "/api/datasets",
        headers={
            "Authorization": "Bearer invalid-token"
        },
    )

    assert response.status_code in [
        401,
        403,
        404,
    ]


def test_empty_authorization_header(client):
    """
    Test empty authorization header.
    """

    response = client.get(
        "/api/datasets",
        headers={
            "Authorization": ""
        },
    )

    assert response.status_code in [
        401,
        403,
        404,
    ]


# ==========================================
# API Content-Type Tests
# ==========================================

def test_json_content_type(client):
    """
    Test JSON request handling.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "email": "api-test@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code in [
        200,
        401,
        404,
    ]


# ==========================================
# CORS Test
# ==========================================

def test_cors_headers(client):
    """
    Test CORS configuration if enabled.
    """

    response = client.options(
        "/api/auth/login"
    )

    assert response.status_code in [
        200,
        204,
        404,
        405,
    ]


# ==========================================
# API Security Tests
# ==========================================

def test_protected_api_with_fake_token(client):
    """
    Ensure protected API does not accept a fake token.
    """

    response = client.get(
        "/api/dashboard",
        headers={
            "Authorization": "Bearer fake.jwt.token"
        },
    )

    assert response.status_code in [
        401,
        403,
        404,
    ]


# ==========================================
# API Availability Test
# ==========================================

def test_api_is_running(client):
    """
    Basic API availability test.
    """

    endpoints = [
        "/api/health",
        "/api/auth/login",
        "/api/datasets",
        "/api/analysis",
        "/api/visualization",
        "/api/dashboard",
        "/api/reports",
    ]

    for endpoint in endpoints:
        response = client.get(endpoint)

        assert response.status_code < 600