import os

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough-for-tests")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-that-is-long-enough-for-tests")

from app import create_app


def test_health_endpoint_returns_ok():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://"})
    response = app.test_client().get("/api/health")
    assert response.status_code == 200
    assert response.json == {"status": "ok"}
