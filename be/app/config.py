from dotenv import load_dotenv
import os
from datetime import timedelta   
from urllib.parse import quote_plus

load_dotenv()

class Config:
    APP_ENV = os.getenv("APP_ENV", "development").lower()
    IS_PRODUCTION = APP_ENV == "production"
    # DATABASE_URL is used in AWS/RDS. Locally, Docker Compose supplies the
    # PostgreSQL connection parts; SQLite remains a fallback for existing
    # non-Docker development setups.
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL and os.getenv("POSTGRES_PASSWORD"):
        DATABASE_URL = (
            "postgresql+psycopg://"
            f"{quote_plus(os.getenv('POSTGRES_USER', 'water_monitoring'))}:"
            f"{quote_plus(os.environ['POSTGRES_PASSWORD'])}@"
            f"{os.getenv('DATABASE_HOST', 'localhost')}:"
            f"{os.getenv('DATABASE_PORT', '5432')}/"
            f"{quote_plus(os.getenv('POSTGRES_DB', 'water_monitoring'))}"
        )
    DATABASE_URL = DATABASE_URL or "sqlite:///database.db"
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = (
        {"pool_pre_ping": True, "pool_recycle": 300}
        if not DATABASE_URL.startswith("sqlite")
        else {}
    )

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=5)
    JWT_TOKEN_LOCATION = ["headers"]
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(1024 * 1024)))
    CORS_ORIGINS = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if value.strip()]
    TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() in {"1", "true", "yes"}
    FORCE_HTTPS = os.getenv("FORCE_HTTPS", "false").lower() in {"1", "true", "yes"}
    ALLOW_INSECURE_PASSWORD_RESET = os.getenv("ALLOW_INSECURE_PASSWORD_RESET", "true" if not IS_PRODUCTION else "false").lower() in {"1", "true", "yes"}
    # Redis is shared by every backend task, so limits still work after AWS
    # scales the service beyond one container.
    REDIS_URL = os.getenv("REDIS_URL", "")
    RATELIMIT_STORAGE_URI = REDIS_URL or os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    PASSWORD_RESET_URL = os.getenv("PASSWORD_RESET_URL", "http://localhost:3000/reset-password")
    PASSWORD_RESET_CONSOLE = os.getenv("PASSWORD_RESET_CONSOLE", "true" if not IS_PRODUCTION else "false").lower() in {"1", "true", "yes"}
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "")
    SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() in {"1", "true", "yes"}

    @classmethod
    def validate(cls) -> None:
        if not cls.IS_PRODUCTION:
            return
        if not cls.SECRET_KEY or not cls.JWT_SECRET_KEY or len(cls.SECRET_KEY) < 32 or len(cls.JWT_SECRET_KEY) < 32:
            raise RuntimeError("Production requires SECRET_KEY and JWT_SECRET_KEY of at least 32 characters.")
        if cls.DATABASE_URL.startswith("sqlite"):
            raise RuntimeError("Production requires PostgreSQL via DATABASE_URL; SQLite is not supported.")
        if not cls.CORS_ORIGINS or any("localhost" in value for value in cls.CORS_ORIGINS):
            raise RuntimeError("Set CORS_ORIGINS to the deployed frontend HTTPS origin in production.")
        if cls.ALLOW_INSECURE_PASSWORD_RESET:
            raise RuntimeError("ALLOW_INSECURE_PASSWORD_RESET must be false in production.")
        if not cls.REDIS_URL:
            raise RuntimeError("Production requires REDIS_URL for shared rate limiting.")
        if cls.PASSWORD_RESET_CONSOLE or not cls.SMTP_HOST or not cls.SMTP_FROM:
            raise RuntimeError("Production requires SMTP configuration and PASSWORD_RESET_CONSOLE=false.")
        if not cls.PASSWORD_RESET_URL.startswith("https://"):
            raise RuntimeError("PASSWORD_RESET_URL must use HTTPS in production.")
