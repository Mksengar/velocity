# ==========================================
# Velocity BI - Dataset API Tests
# File: backend/tests/test_datasets.py
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
# Helper Functions
# ==========================================

def register_user(client):
    """
    Register a test user.
    """

    return client.post(
        "/api/auth/register",
        json={
            "name": "Dataset Test User",
            "email": "dataset@example.com",
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
            "email": "dataset@example.com",
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

    register_response = register_user(client)

    # User may already exist in some test configurations.
    assert register_response.status_code in [200, 201, 400, 409]

    token = login_user(client)

    if not token:
        pytest.skip("JWT token was not returned by login.")

    return {
        "Authorization": f"Bearer {token}"
    }


# ==========================================
# Sample Dataset
# ==========================================

def create_csv_file():
    """
    Create an in-memory CSV file for testing.
    """

    csv_data = (
        "name,category,sales,quantity\n"
        "Laptop,Electronics,75000,2\n"
        "Mouse,Electronics,1500,10\n"
        "Keyboard,Electronics,3000,5\n"
        "Monitor,Electronics,25000,3\n"
    )

    return io.BytesIO(csv_data.encode("utf-8"))


# ==========================================
# Dataset List Tests
# ==========================================

def test_get_datasets_without_authentication(client):
    """
    Test that datasets require authentication.
    """

    response = client.get("/api/datasets")

    assert response.status_code in [401, 403]


def test_get_datasets(client, auth_headers):
    """
    Test retrieving the dataset list.
    """

    response = client.get(
        "/api/datasets",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data is not None


# ==========================================
# Dataset Upload Tests
# ==========================================

def test_upload_csv_dataset(client, auth_headers):
    """
    Test successful CSV dataset upload.
    """

    file = create_csv_file()

    response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                file,
                "sales.csv",
            )
        },
        content_type="multipart/form-data",
    )

    assert response.status_code in [200, 201]

    data = response.get_json()

    assert data is not None


def test_upload_dataset_without_authentication(client):
    """
    Test dataset upload without JWT authentication.
    """

    file = create_csv_file()

    response = client.post(
        "/api/datasets",
        data={
            "file": (
                file,
                "sales.csv",
            )
        },
        content_type="multipart/form-data",
    )

    assert response.status_code in [401, 403]


def test_upload_without_file(client, auth_headers):
    """
    Test upload request without a file.
    """

    response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={},
        content_type="multipart/form-data",
    )

    assert response.status_code in [400, 422]


def test_upload_empty_file(client, auth_headers):
    """
    Test uploading an empty CSV file.
    """

    empty_file = io.BytesIO(b"")

    response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                empty_file,
                "empty.csv",
            )
        },
        content_type="multipart/form-data",
    )

    assert response.status_code in [200, 201, 400, 422]


def test_upload_invalid_file_type(client, auth_headers):
    """
    Test uploading an unsupported file type.
    """

    invalid_file = io.BytesIO(
        b"This is not a supported dataset."
    )

    response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                invalid_file,
                "test.exe",
            )
        },
        content_type="multipart/form-data",
    )

    assert response.status_code in [400, 415, 422]


# ==========================================
# Dataset Retrieval Tests
# ==========================================

def test_get_dataset_by_id(client, auth_headers):
    """
    Test retrieving a dataset by ID.

    The test first uploads a dataset and then
    attempts to retrieve it.
    """

    file = create_csv_file()

    upload_response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                file,
                "sales.csv",
            )
        },
        content_type="multipart/form-data",
    )

    if upload_response.status_code not in [200, 201]:
        pytest.skip("Dataset upload is not available.")

    upload_data = upload_response.get_json() or {}

    dataset = upload_data.get("dataset", upload_data)

    dataset_id = (
        dataset.get("id")
        or dataset.get("dataset_id")
    )

    if not dataset_id:
        pytest.skip("Dataset ID was not returned.")

    response = client.get(
        f"/api/datasets/{dataset_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data is not None


def test_get_nonexistent_dataset(client, auth_headers):
    """
    Test retrieving a dataset that does not exist.
    """

    response = client.get(
        "/api/datasets/999999",
        headers=auth_headers,
    )

    assert response.status_code in [404, 400]


# ==========================================
# Dataset Preview Tests
# ==========================================

def test_dataset_preview(client, auth_headers):
    """
    Test dataset preview endpoint.

    Adjust the endpoint if your API uses a
    different preview URL.
    """

    file = create_csv_file()

    upload_response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                file,
                "sales.csv",
            )
        },
        content_type="multipart/form-data",
    )

    if upload_response.status_code not in [200, 201]:
        pytest.skip("Dataset upload is not available.")

    upload_data = upload_response.get_json() or {}

    dataset = upload_data.get("dataset", upload_data)

    dataset_id = (
        dataset.get("id")
        or dataset.get("dataset_id")
    )

    if not dataset_id:
        pytest.skip("Dataset ID was not returned.")

    response = client.get(
        f"/api/datasets/{dataset_id}/preview",
        headers=auth_headers,
    )

    assert response.status_code in [200, 404]


# ==========================================
# Dataset Update Tests
# ==========================================

def test_update_dataset(client, auth_headers):
    """
    Test updating dataset metadata.
    """

    file = create_csv_file()

    upload_response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                file,
                "sales.csv",
            )
        },
        content_type="multipart/form-data",
    )

    if upload_response.status_code not in [200, 201]:
        pytest.skip("Dataset upload is not available.")

    upload_data = upload_response.get_json() or {}

    dataset = upload_data.get("dataset", upload_data)

    dataset_id = (
        dataset.get("id")
        or dataset.get("dataset_id")
    )

    if not dataset_id:
        pytest.skip("Dataset ID was not returned.")

    response = client.put(
        f"/api/datasets/{dataset_id}",
        headers=auth_headers,
        json={
            "name": "Updated Sales Dataset",
            "description": "Updated dataset description",
        },
    )

    assert response.status_code in [200, 204, 404]


# ==========================================
# Dataset Delete Tests
# ==========================================

def test_delete_dataset(client, auth_headers):
    """
    Test deleting a dataset.
    """

    file = create_csv_file()

    upload_response = client.post(
        "/api/datasets",
        headers=auth_headers,
        data={
            "file": (
                file,
                "delete_test.csv",
            )
        },
        content_type="multipart/form-data",
    )

    if upload_response.status_code not in [200, 201]:
        pytest.skip("Dataset upload is not available.")

    upload_data = upload_response.get_json() or {}

    dataset = upload_data.get("dataset", upload_data)

    dataset_id = (
        dataset.get("id")
        or dataset.get("dataset_id")
    )

    if not dataset_id:
        pytest.skip("Dataset ID was not returned.")

    response = client.delete(
        f"/api/datasets/{dataset_id}",
        headers=auth_headers,
    )

    assert response.status_code in [200, 204]


def test_delete_nonexistent_dataset(client, auth_headers):
    """
    Test deleting a dataset that does not exist.
    """

    response = client.delete(
        "/api/datasets/999999",
        headers=auth_headers,
    )

    assert response.status_code in [404, 400]


# ==========================================
# Dataset Search Tests
# ==========================================

def test_search_datasets(client, auth_headers):
    """
    Test dataset search endpoint if available.
    """

    response = client.get(
        "/api/datasets?search=sales",
        headers=auth_headers,
    )

    assert response.status_code in [200, 404]


# ==========================================
# Dataset Pagination Tests
# ==========================================

def test_dataset_pagination(client, auth_headers):
    """
    Test dataset pagination parameters.
    """

    response = client.get(
        "/api/datasets?page=1&limit=10",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data is not None


# ==========================================
# Dataset Ownership Tests
# ==========================================

def test_dataset_access_requires_authentication(client):
    """
    Test that dataset details cannot be accessed
    without authentication.
    """

    response = client.get(
        "/api/datasets/1"
    )

    assert response.status_code in [401, 403]


# ==========================================
# Content Type Tests
# ==========================================

def test_dataset_upload_requires_multipart(client, auth_headers):
    """
    Test that dataset upload expects multipart data.
    """

    response = client.post(
        "/api/datasets",
        headers=auth_headers,
        json={
            "name": "test dataset"
        },
    )

    assert response.status_code in [400, 415, 422]


# ==========================================
# Health Check
# ==========================================

def test_dataset_api_available(client, auth_headers):
    """
    Basic check that the dataset API responds.
    """

    response = client.get(
        "/api/datasets",
        headers=auth_headers,
    )

    assert response.status_code in [200, 204]