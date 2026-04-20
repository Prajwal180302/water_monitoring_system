import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
if os.getenv("USE_GPU", "true").lower() in {"0", "false", "no"}:
    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")

from flask import Flask
from app.extensions import db, jwt
from app.config import Config
from flask_cors import CORS 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    # ---- Import models ----
    from app.models.user_model import User
    from app.models.sensor_model import SensorReading
    from app.models.settings_model import UserSettings

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
