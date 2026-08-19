import os
import logging

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
if os.getenv("USE_GPU", "true").lower() in {"0", "false", "no"}:
    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")

from flask import Flask, jsonify
from sqlalchemy import text
from werkzeug.middleware.proxy_fix import ProxyFix
from app.extensions import db, jwt, limiter, migrate
from app.config import Config
from flask_cors import CORS 

def create_app(config_override=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_override:
        app.config.update(config_override)
    Config.validate()

    if app.config["TRUST_PROXY"]:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    app.logger.setLevel(getattr(logging, app.config["LOG_LEVEL"], logging.INFO))

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, methods=["GET", "POST", "PUT", "OPTIONS"], allow_headers=["Authorization", "Content-Type"], max_age=3600)

    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db)

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    @app.get("/api/ready")
    def readiness_check():
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "ready", "database": "ok"}), 200
        except Exception:
            db.session.rollback()
            app.logger.exception("Database readiness check failed")
            return jsonify({"status": "not_ready", "database": "unavailable"}), 503

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if app.config["FORCE_HTTPS"]:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # ---- Import models ----
    from app.models.user_model import User
    from app.models.sensor_model import SensorReading
    from app.models.settings_model import UserSettings
    from app.models.password_reset_model import PasswordResetToken

    # ---- Import blueprints ----
    from app.routes.auth_routes import auth_bp
    from app.routes.data_routes import data_bp
    from app.routes.prediction_routes import prediction_api
    from app.routes.alert_routes import alert_api
    from app.routes.report_routes import report_api
    from app.routes.settings_routes import settings_bp


    # ---- Register blueprints ----
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(data_bp, url_prefix="/api")
    app.register_blueprint(prediction_api, url_prefix="/api")
    app.register_blueprint(alert_api, url_prefix="/api")
    app.register_blueprint(report_api, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")

    return app
