from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import re
from app.extensions import db
from app.models.user_model import User
from app.models.settings_model import UserSettings

settings_bp = Blueprint("settings", __name__)

email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


def validate_phone(phone):
    """Basic phone number validation"""
    if not phone:
        return True  # Phone is optional
    # Remove common characters
    cleaned = ''.join(filter(str.isdigit, phone))
    return 10 <= len(cleaned) <= 15


@settings_bp.route("/settings", methods=["GET"])
@jwt_required()
def get_settings():
    """Fetch user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get or create user settings
        settings = UserSettings.query.filter_by(user_id=user.id).first()
        if not settings:
            settings = UserSettings(user_id=user.id)
            db.session.add(settings)
            db.session.commit()
        
        return jsonify({
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "language": user.language or "en",
            "thresholds": {
                "pH_min": settings.pH_min,
                "pH_max": settings.pH_max,
                "tds": settings.tds,
                "turbidity": settings.turbidity,
                "temperature_min": settings.temperature_min,
                "temperature_max": settings.temperature_max,
                "conductivity": settings.conductivity,
            },
            "calibration": settings.to_dict().get("calibration", {}),
            "samplingInterval": settings.sampling_interval,
            "deviceStatus": settings.device_status
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/settings", methods=["POST"])
@jwt_required()
def save_settings():
    """Save user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json() or {}
        
        # Validate and update phone
        name = (data.get("name") or user.name or "").strip()
        email = (data.get("email") or user.email or "").strip()
        phone = (data.get("phone") or "").strip() or None
        language = (data.get("language") or user.language or "en").strip()
        if phone and not validate_phone(phone):
            return jsonify({"error": "Invalid phone number"}), 400

        if not name or not email:
            return jsonify({"error": "Name and email are required"}), 400

        if len(name) < 2 or len(name) > 100:
            return jsonify({"error": "Name must be between 2 and 100 characters"}), 400

        if not re.match(email_pattern, email):
            return jsonify({"error": "Enter a valid email address"}), 400

        if language not in {"en", "hi", "mr"}:
            return jsonify({"error": "Invalid language"}), 400

        existing_email_user = User.query.filter(User.email == email, User.id != user.id).first()
        if existing_email_user:
            return jsonify({"error": "Email is already in use"}), 400

        existing_name_user = User.query.filter(User.name == name, User.id != user.id).first()
        if existing_name_user:
            return jsonify({"error": "Name is already in use"}), 400
        
        user.name = name
        user.email = email
        user.phone = phone
        user.language = language
        
        # Get or create user settings
        settings = UserSettings.query.filter_by(user_id=user.id).first()
        if not settings:
            settings = UserSettings(user_id=user.id)
            db.session.add(settings)
        
        # Update threshold settings
        thresholds = data.get("thresholds", {})
        if thresholds:
            settings.pH_min = thresholds.get("pH_min", settings.pH_min)
            settings.pH_max = thresholds.get("pH_max", settings.pH_max)
            settings.tds = thresholds.get("tds", settings.tds)
            settings.turbidity = thresholds.get("turbidity", settings.turbidity)
            settings.temperature_min = thresholds.get("temperature_min", settings.temperature_min)
            settings.temperature_max = thresholds.get("temperature_max", settings.temperature_max)
            settings.conductivity = thresholds.get("conductivity", settings.conductivity)

        calibration = data.get("calibration", {})
        if calibration:
            settings.calibration_ph = calibration.get("ph", settings.calibration_ph)
            settings.calibration_tds = calibration.get("tds", settings.calibration_tds)
            settings.calibration_turbidity = calibration.get("turbidity", settings.calibration_turbidity)
            settings.calibration_conductivity = calibration.get("conductivity", settings.calibration_conductivity)

        if "samplingInterval" in data:
            settings.sampling_interval = data.get("samplingInterval", settings.sampling_interval)

        if "deviceStatus" in data:
            device_status = data.get("deviceStatus")
            if device_status not in {"active", "inactive"}:
                return jsonify({"error": "Invalid device status"}), 400
            settings.device_status = device_status
        
        db.session.commit()
        
        return jsonify({
            "message": "Settings saved successfully",
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "language": user.language or "en",
            "settings": settings.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
