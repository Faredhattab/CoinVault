from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from coinvault.main import app
from coinvault.middleware.auth_middleware import require_admin
from coinvault.api.items import get_is_admin

client = TestClient(app)

@pytest.fixture
def mock_admin_auth():
    app.dependency_overrides[require_admin] = lambda: MagicMock(id=str(uuid4()))
    app.dependency_overrides[get_is_admin] = lambda: True
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def mock_item_service():
    with patch("coinvault.api.items.item_service") as mock:
        yield mock

def test_list_items_anonymous(mock_item_service: MagicMock) -> None:
    # Setup mock items (1 public, 1 private)
    # The service returns raw data. The controller must filter/validate using PublicItem or Item schemas
    mock_item_service.list_items.return_value = [
        {
            "uuid": str(uuid4()),
            "collection_id": "US-0001",
            "type": "Coin",
            "title_en": "Lincoln Cent",
            "title_ar": "سنت لنكولن",
            "description_en": "A cent coin",
            "description_ar": "عملة سنت",
            "country_code": "US",
            "denomination": "1 Cent",
            "year": 1909,
            "amount": 100,
            "acquisition_year": 2020,
            "visibility": "Public",
            "tags": [],
            "front_image": None,
            "back_image": None,
            "additional_images": [],
            "categories": [],
            "created_at": "2026-05-21T00:00:00Z",
            "updated_at": "2026-05-21T00:00:00Z",
        }
    ]

    response = client.get("/api/v1/items")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    # Assert public masking: amount and acquisition_year must not be present
    assert "amount" not in data[0]
    assert "acquisition_year" not in data[0]
    assert data[0]["title_en"] == "Lincoln Cent"

def test_list_items_admin(mock_item_service: MagicMock, mock_admin_auth: None) -> None:
    mock_item_service.list_items.return_value = [
        {
            "uuid": str(uuid4()),
            "collection_id": "US-0001",
            "type": "Coin",
            "title_en": "Lincoln Cent",
            "title_ar": "سنت لنكولن",
            "description_en": "A cent coin",
            "description_ar": "عملة سنت",
            "country_code": "US",
            "denomination": "1 Cent",
            "year": 1909,
            "amount": 100,
            "acquisition_year": 2020,
            "visibility": "Public",
            "tags": [],
            "front_image": None,
            "back_image": None,
            "additional_images": [],
            "categories": [],
            "created_at": "2026-05-21T00:00:00Z",
            "updated_at": "2026-05-21T00:00:00Z",
        }
    ]

    # Include mock admin auth header
    response = client.get("/api/v1/items", headers={"Authorization": "Bearer mock-admin-token"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    # Assert admin visibility: amount and acquisition_year must be present
    assert "amount" in data[0]
    assert "acquisition_year" in data[0]
    assert data[0]["amount"] == 100

def test_get_item_public_anonymous(mock_item_service: MagicMock) -> None:
    item_uuid = str(uuid4())
    mock_item_service.get_item.return_value = {
        "uuid": item_uuid,
        "collection_id": "US-0001",
        "type": "Coin",
        "title_en": "Lincoln Cent",
        "title_ar": "سنت لنكولن",
        "description_en": "A cent coin",
        "description_ar": "عملة سنت",
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 1909,
        "amount": 100,
        "acquisition_year": 2020,
        "visibility": "Public",
        "tags": [],
        "front_image": None,
        "back_image": None,
        "additional_images": [],
        "categories": [],
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }

    response = client.get(f"/api/v1/items/{item_uuid}")
    assert response.status_code == 200
    data = response.json()
    assert "amount" not in data
    assert "acquisition_year" not in data

def test_get_item_private_anonymous(mock_item_service: MagicMock) -> None:
    item_uuid = str(uuid4())
    # The service returns None when queried anonymously for private items (since admin_view=False)
    mock_item_service.get_item.return_value = None

    response = client.get(f"/api/v1/items/{item_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"

def test_get_item_private_admin(mock_item_service: MagicMock, mock_admin_auth: None) -> None:
    item_uuid = str(uuid4())
    mock_item_service.get_item.return_value = {
        "uuid": item_uuid,
        "collection_id": "US-0001",
        "type": "Coin",
        "title_en": "Lincoln Cent",
        "title_ar": "سنت لنكولن",
        "description_en": "A cent coin",
        "description_ar": "عملة سنت",
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 1909,
        "amount": 100,
        "acquisition_year": 2020,
        "visibility": "Private",
        "tags": [],
        "front_image": None,
        "back_image": None,
        "additional_images": [],
        "categories": [],
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }

    response = client.get(f"/api/v1/items/{item_uuid}", headers={"Authorization": "Bearer mock-admin-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["visibility"] == "Private"
    assert "amount" in data
    assert data["amount"] == 100

def test_create_item_success(mock_item_service: MagicMock, mock_admin_auth: None) -> None:
    item_uuid = str(uuid4())
    mock_item_service.create_item.return_value = {
        "uuid": item_uuid,
        "collection_id": "US-0001",
        "type": "Coin",
        "title_en": "Lincoln Cent",
        "title_ar": None,
        "description_en": None,
        "description_ar": None,
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 1909,
        "amount": 1,
        "acquisition_year": None,
        "visibility": "Public",
        "tags": [],
        "front_image": None,
        "back_image": None,
        "additional_images": [],
        "categories": [],
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }

    payload = {
        "type": "Coin",
        "title_en": "Lincoln Cent",
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 1909,
        "amount": 1,
        "visibility": "Public"
    }

    response = client.post("/api/v1/items", json=payload, headers={"Authorization": "Bearer mock-admin-token"})
    assert response.status_code == 201
    assert response.json()["uuid"] == item_uuid

def test_arabic_fallback(mock_item_service: MagicMock) -> None:
    item_uuid = str(uuid4())
    # Service layer formats the item data, populating title_ar with title_en
    # If the database returns title_ar = None, ItemService._format_item_data copies title_en
    mock_item_service.get_item.return_value = {
        "uuid": item_uuid,
        "collection_id": "US-0001",
        "type": "Coin",
        "title_en": "Lincoln Cent",
        "title_ar": "Lincoln Cent", # fallback applied
        "description_en": "A cent coin",
        "description_ar": "A cent coin", # fallback applied
        "country_code": "US",
        "denomination": "1 Cent",
        "year": 1909,
        "amount": 100,
        "acquisition_year": 2020,
        "visibility": "Public",
        "tags": [],
        "front_image": None,
        "back_image": None,
        "additional_images": [],
        "categories": [],
        "created_at": "2026-05-21T00:00:00Z",
        "updated_at": "2026-05-21T00:00:00Z",
    }

    response = client.get(f"/api/v1/items/{item_uuid}")
    assert response.status_code == 200
    data = response.json()
    assert data["title_ar"] == "Lincoln Cent"
    assert data["description_ar"] == "A cent coin"
