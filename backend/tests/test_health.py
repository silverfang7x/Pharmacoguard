"""Smoke test – app boots and health endpoint responds."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_openapi_schema_loads():
    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    assert "paths" in response.json()
