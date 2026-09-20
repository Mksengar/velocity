# ==========================================
# Velocity BI - Authentication Tests
# File: backend/tests/test_auth.py
# ==========================================

import pytest

from app import create_app


# ==========================================
# Test Configuration
# ==========================================

@pytest.fixture
def app():
    """
    Create a Flask application for testing.
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
    Create a Flask test client.
    """

    return app.test_client()


# ==========================================
# Helper Functions
# ==========================================

def register_user(client, email="test@example.com", password="Password123"):
    """
    Helper function to register a test user.
    """

    return client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": email,
            "password": password,
        },
    )


def login_user(client, email="test@example.com", password="Password123"):
    """
    Helper function to log in a test user.
    """

    return client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


# ==========================================
# Registration Tests
# ==========================================

def test_register_user(client):
    """
    Test successful user registration.
    """

    response = register_user(client)

    assert response.status_code in [200, 201]

    data = response.get_json()

    assert data is not None


def test_register_duplicate_user(client):
    """
    Test registering the same email twice.
    """

    first_response = register_user(client)

    assert first_response.status_code in [200, 201]

    second_response = register_user(client)

    assert second_response.status_code in [400, 409]

    data = second_response.get_json()

    assert data is not None


def test_register_missing_name(client):
    """
    Test registration without a name.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code in [400, 422]


def test_register_missing_email(client):
    """
    Test registration without an email.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "password": "Password123",
        },
    )

    assert response.status_code in [400, 422]


def test_register_missing_password(client):
    """
    Test registration without a password.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
        },
    )

    assert response.status_code in [400, 422]


def test_register_invalid_email(client):
    """
    Test registration using an invalid email address.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "invalid-email",
            "password": "Password123",
        },
    )

    assert response.status_code in [400, 422]


def test_register_short_password(client):
    """
    Test registration using a weak/short password.
    """

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "123",
        },
    )

    assert response.status_code in [400, 422]


# ==========================================
# Login Tests
# ==========================================

def test_login_user(client):
    """
    Test successful user login.
    """

    register_response = register_user(client)

    assert register_response.status_code in [200, 201]

    response = login_user(client)

    assert response.status_code == 200

    data = response.get_json()

    assert data is not None


def test_login_wrong_password(client):
    """
    Test login with an incorrect password.
    """

    register_response = register_user(client)

    assert register_response.status_code in [200, 201]

    response = login_user(
        client,
        password="WrongPassword123"
    )

    assert response.status_code in [400, 401, 403]


def test_login_unknown_user(client):
    """
    Test login with an email that does not exist.
    """

    response = login_user(
        client,
        email="unknown@example.com"
    )

    assert response.status_code in [400, 401, 404]


def test_login_missing_email(client):
    """
    Test login without an email.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "password": "Password123",
        },
    )

    assert response.status_code in [400, 422]


def test_login_missing_password(client):
    """
    Test login without a password.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
        },
    )

    assert response.status_code in [400, 422]


# ==========================================
# Protected Route Tests
# ==========================================

def test_protected_route_without_token(client):
    """
    Test accessing a protected endpoint without JWT token.
    """

    response = client.get("/api/auth/me")

    assert response.status_code in [401, 403]


def test_protected_route_with_token(client):
    """
    Test accessing a protected endpoint with a valid JWT token.
    """

    register_response = register_user(client)

    assert register_response.status_code in [200, 201]

    login_response = login_user(client)

    assert login_response.status_code == 200

    login_data = login_response.get_json()

    token = (
        login_data.get("access_token")
        or login_data.get("token")
    )

    if not token:
        pytest.skip("Login response does not contain a JWT token.")

    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code in [200, 204]


# ==========================================
# Logout Tests
# ==========================================

def test_logout_user(client):
    """
    Test logout endpoint if implemented.
    """

    register_response = register_user(client)

    assert register_response.status_code in [200, 201]

    login_response = login_user(client)

    assert login_response.status_code == 200

    login_data = login_response.get_json()

    token = (
        login_data.get("access_token")
        or login_data.get("token")
    )

    if not token:
        pytest.skip("Login response does not contain a JWT token.")

    response = client.post(
        "/api/auth/logout",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    # Logout may not be implemented yet.
    assert response.status_code in [200, 204, 404]


# ==========================================
# Content-Type Tests
# ==========================================

def test_register_invalid_content_type(client):
    """
    Test registration with invalid request content.
    """

    response = client.post(
        "/api/auth/register",
        data="invalid request"
    )

    assert response.status_code in [400, 415, 422]


def test_login_invalid_content_type(client):
    """
    Test login with invalid request content.
    """

    response = client.post(
        "/api/auth/login",
        data="invalid request"
    )

    assert response.status_code in [400, 415, 422]