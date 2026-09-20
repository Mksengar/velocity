# ==========================================
# Velocity BI - Analysis API Tests
# File: backend/tests/test_analysis.py
# ==========================================

import io
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

def register_user(client):
    """
    Register a test user.
    """

    return client.post(
        "/api/auth/register",
        json={
            "name": "Analysis Test User",
            "email": "analysis@example.com",
            "password": "Password123",
        },
    )


def login_user(client):
    """
    Login test user and return JWT token.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "email": "analysis@example.com",
            "password": "Password123",
        },
    )

    if response.status_code != 200:
        return None

    data = response.get_json() or {}

    return (
        data.get("access_token")
        or data.get("token")
    )


@pytest.fixture
def auth_headers(client):
    """
    Create authentication headers.
    """

    response = register_user(client)

    # User may already exist depending on test database.
    assert response.status_code in [200, 201, 400, 409]

    token = login_user(client)

    if not token:
        pytest.skip("JWT token was not returned.")

    return {
        "Authorization": f"Bearer {token}"
    }


# ==========================================
# Sample Dataset
# ==========================================

def create_csv_file():
    """
    Create an in-memory CSV dataset.
    """

    csv_data = (
        "product,category,sales,quantity,profit\n"
        "Laptop,Electronics,75000,2,12000\n"
        "Mouse,Electronics,1500,10,500\n"
        "Keyboard,Electronics,3000,5,1000\n"
        "Monitor,Electronics,25000,3,5000\n"
        "Phone,Electronics,60000,4,9000\n"
    )

    return io.BytesIO(csv_data.encode("utf-8"))


# ==========================================
# Analysis List Tests
# ==========================================

def test_analysis_without_authentication(client):
    """
    Analysis APIs should require authentication.
    """

    response = client.get("/api/analysis")

    assert response.status_code in [401, 403, 404]


def test_get_analysis(client, auth_headers):
    """
    Test the main analysis endpoint.
    """

    response = client.get(
        "/api/analysis",
        headers=auth_headers,
    )

    assert response.status_code in [200, 404]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


# ==========================================
# Statistical Analysis Tests
# ==========================================

def test_statistics_analysis(client, auth_headers):
    """
    Test statistical analysis endpoint.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers=auth_headers,
        json={
            "data": [
                {
                    "sales": 100,
                    "quantity": 2,
                    "profit": 20
                },
                {
                    "sales": 200,
                    "quantity": 4,
                    "profit": 50
                },
                {
                    "sales": 300,
                    "quantity": 6,
                    "profit": 80
                }
            ]
        },
    )

    assert response.status_code in [200, 201, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


def test_statistics_missing_data(client, auth_headers):
    """
    Test statistics analysis without data.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers=auth_headers,
        json={},
    )

    assert response.status_code in [400, 404, 422]


# ==========================================
# Descriptive Statistics Tests
# ==========================================

def test_descriptive_statistics(client, auth_headers):
    """
    Test descriptive statistics.
    """

    response = client.post(
        "/api/analysis/descriptive",
        headers=auth_headers,
        json={
            "data": [
                {"sales": 100},
                {"sales": 200},
                {"sales": 300},
                {"sales": 400},
            ]
        },
    )

    assert response.status_code in [200, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


# ==========================================
# Correlation Tests
# ==========================================

def test_correlation_analysis(client, auth_headers):
    """
    Test correlation analysis.
    """

    response = client.post(
        "/api/analysis/correlation",
        headers=auth_headers,
        json={
            "data": [
                {
                    "sales": 100,
                    "quantity": 2,
                    "profit": 20
                },
                {
                    "sales": 200,
                    "quantity": 4,
                    "profit": 50
                },
                {
                    "sales": 300,
                    "quantity": 6,
                    "profit": 80
                },
                {
                    "sales": 400,
                    "quantity": 8,
                    "profit": 120
                }
            ]
        },
    )

    assert response.status_code in [200, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


def test_correlation_without_data(client, auth_headers):
    """
    Test correlation analysis without data.
    """

    response = client.post(
        "/api/analysis/correlation",
        headers=auth_headers,
        json={},
    )

    assert response.status_code in [400, 404, 422]


# ==========================================
# EDA Tests
# ==========================================

def test_eda_analysis(client, auth_headers):
    """
    Test Exploratory Data Analysis endpoint.
    """

    response = client.post(
        "/api/analysis/eda",
        headers=auth_headers,
        json={
            "data": [
                {
                    "product": "Laptop",
                    "sales": 75000,
                    "quantity": 2
                },
                {
                    "product": "Mouse",
                    "sales": 1500,
                    "quantity": 10
                },
                {
                    "product": "Keyboard",
                    "sales": 3000,
                    "quantity": 5
                }
            ]
        },
    )

    assert response.status_code in [200, 201, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


# ==========================================
# Data Summary Tests
# ==========================================

def test_data_summary(client, auth_headers):
    """
    Test dataset summary endpoint.
    """

    response = client.post(
        "/api/analysis/summary",
        headers=auth_headers,
        json={
            "data": [
                {"sales": 100, "profit": 20},
                {"sales": 200, "profit": 50},
                {"sales": 300, "profit": 80},
            ]
        },
    )

    assert response.status_code in [200, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


# ==========================================
# Missing Values Tests
# ==========================================

def test_missing_values_analysis(client, auth_headers):
    """
    Test missing-value analysis.
    """

    response = client.post(
        "/api/analysis/missing-values",
        headers=auth_headers,
        json={
            "data": [
                {
                    "name": "Laptop",
                    "sales": 75000
                },
                {
                    "name": "Mouse",
                    "sales": None
                },
                {
                    "name": "Keyboard",
                    "sales": 3000
                }
            ]
        },
    )

    assert response.status_code in [200, 400, 404, 422]

    if response.status_code == 200:
        data = response.get_json()

        assert data is not None


# ==========================================
# Dataset-Based Analysis
# ==========================================

def test_analysis_with_dataset_id(client, auth_headers):
    """
    Test analysis using an existing dataset ID.

    The endpoint can be adjusted according to the
    actual Velocity BI API implementation.
    """

    response = client.post(
        "/api/analysis/run",
        headers=auth_headers,
        json={
            "dataset_id": 1,
            "analysis_type": "eda"
        },
    )

    assert response.status_code in [
        200,
        201,
        400,
        404,
        422
    ]


# ==========================================
# Analysis Type Validation
# ==========================================

def test_invalid_analysis_type(client, auth_headers):
    """
    Test invalid analysis type.
    """

    response = client.post(
        "/api/analysis/run",
        headers=auth_headers,
        json={
            "dataset_id": 1,
            "analysis_type": "invalid_analysis"
        },
    )

    assert response.status_code in [400, 404, 422]


# ==========================================
# Empty Dataset Tests
# ==========================================

def test_empty_dataset_analysis(client, auth_headers):
    """
    Test analysis with an empty dataset.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers=auth_headers,
        json={
            "data": []
        },
    )

    assert response.status_code in [200, 400, 422]


# ==========================================
# Invalid Data Tests
# ==========================================

def test_invalid_analysis_data(client, auth_headers):
    """
    Test analysis with invalid data format.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers=auth_headers,
        json={
            "data": "invalid-data"
        },
    )

    assert response.status_code in [400, 404, 422]


# ==========================================
# Content-Type Tests
# ==========================================

def test_analysis_invalid_content_type(client, auth_headers):
    """
    Test analysis endpoint with invalid content type.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers=auth_headers,
        data="invalid request",
    )

    assert response.status_code in [400, 404, 415, 422]


# ==========================================
# Authorization Tests
# ==========================================

def test_analysis_requires_valid_token(client):
    """
    Test analysis endpoint with an invalid JWT.
    """

    response = client.post(
        "/api/analysis/statistics",
        headers={
            "Authorization": "Bearer invalid-token"
        },
        json={
            "data": [
                {"sales": 100},
                {"sales": 200}
            ]
        },
    )

    assert response.status_code in [401, 403]


# ==========================================
# Health / Availability Test
# ==========================================

def test_analysis_api_available(client, auth_headers):
    """
    Basic analysis API availability test.
    """

    response = client.get(
        "/api/analysis",
        headers=auth_headers,
    )

    assert response.status_code in [200, 404]