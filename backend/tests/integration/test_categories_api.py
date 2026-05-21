from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from postgrest.exceptions import APIError

from coinvault.main import app
from coinvault.middleware.auth_middleware import require_admin

client = TestClient(app)

# Helper to mock admin user dependency override
@pytest.fixture
def mock_admin_auth():
    # Override require_admin dependency to bypass auth checks
    app.dependency_overrides[require_admin] = lambda: MagicMock(id=str(uuid4()))
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def mock_service():
    with patch("coinvault.api.categories.category_service") as mock:
        yield mock

def test_list_categories(mock_service: MagicMock) -> None:
    mock_service.list_categories.return_value = [
        {
            "uuid": str(uuid4()),
            "name_en": "Europe",
            "name_ar": "أوروبا",
            "parent_uuid": None,
            "created_at": "2026-05-21T00:00:00Z",
            "updated_at": "2026-05-21T00:00:00Z",
        }
    ]
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name_en"] == "Europe"

def test_get_category_success(mock_service: MagicMock) -> None:
    uuid_str = str(uuid4())
    mock_service.get_category.return_value = {
        "uuid": uuid_str,
        "name_en": "Netherlands",
        "name_ar": "هولندا",
        "parent_uuid": None,
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }
    response = client.get(f"/api/v1/categories/{uuid_str}")
    assert response.status_code == 200
    assert response.json()["name_en"] == "Netherlands"

def test_get_category_not_found(mock_service: MagicMock) -> None:
    mock_service.get_category.return_value = None
    response = client.get(f"/api/v1/categories/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"

def test_create_category_success(mock_service: MagicMock, mock_admin_auth: None) -> None:
    uuid_str = str(uuid4())
    mock_service.create_category.return_value = {
        "uuid": uuid_str,
        "name_en": "Netherlands",
        "name_ar": "هولندا",
        "parent_uuid": None,
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }
    payload = {
        "name_en": "Netherlands",
        "name_ar": "هولندا"
    }
    response = client.post("/api/v1/categories", json=payload)
    assert response.status_code == 201
    assert response.json()["uuid"] == uuid_str

def test_create_category_unauthorized(mock_service: MagicMock) -> None:
    # No auth override, should fail with 401 (or 403 depending on implementation)
    payload = {
        "name_en": "Netherlands"
    }
    response = client.post("/api/v1/categories", json=payload)
    assert response.status_code in (401, 403)

def test_create_category_db_error(mock_service: MagicMock, mock_admin_auth: None) -> None:
    # Simulate DB trigger raising APIError
    mock_service.create_category.side_effect = APIError({"message": "Category hierarchy depth cannot exceed 3 levels."})
    payload = {
        "name_en": "Netherlands",
        "parent_uuid": str(uuid4())
    }
    response = client.post("/api/v1/categories", json=payload)
    assert response.status_code == 400
    assert "Category hierarchy depth cannot exceed 3 levels" in response.json()["detail"]

def test_update_category_success(mock_service: MagicMock, mock_admin_auth: None) -> None:
    uuid_str = str(uuid4())
    mock_service.get_category.return_value = {"uuid": uuid_str, "name_en": "Old Name"}
    mock_service.update_category.return_value = {
        "uuid": uuid_str,
        "name_en": "New Name",
        "name_ar": None,
        "parent_uuid": None,
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }
    payload = {"name_en": "New Name"}
    response = client.put(f"/api/v1/categories/{uuid_str}", json=payload)
    assert response.status_code == 200
    assert response.json()["name_en"] == "New Name"

def test_update_category_not_found(mock_service: MagicMock, mock_admin_auth: None) -> None:
    mock_service.get_category.return_value = None
    payload = {"name_en": "New Name"}
    response = client.put(f"/api/v1/categories/{uuid4()}", json=payload)
    assert response.status_code == 404

def test_delete_category_success(mock_service: MagicMock, mock_admin_auth: None) -> None:
    uuid_str = str(uuid4())
    mock_service.get_category.return_value = {"uuid": uuid_str}
    mock_service.delete_category.return_value = True
    response = client.delete(f"/api/v1/categories/{uuid_str}")
    assert response.status_code == 204

def test_delete_category_not_found(mock_service: MagicMock, mock_admin_auth: None) -> None:
    mock_service.get_category.return_value = None
    response = client.delete(f"/api/v1/categories/{uuid4()}")
    assert response.status_code == 404
