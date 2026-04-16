from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user_model import User
from app.models.settings_model import UserSettings

settings_bp = Blueprint("settings", __name__)


def validate_phone(phone):
    """Basic phone number validation"""
    if not phone:
        return True  # Phone is optional
    # Remove common characters
    cleaned = ''.join(filter(str.isdigit, phone))
    # Check if it has at least 10 digits (international format)
    return len(cleaned) >= 10


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
            "phone": user.phone,
            "thresholds": settings.to_dict()
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
        
        data = request.get_json()
        
        # Validate and update phone
        phone = data.get("phone")
        if phone and not validate_phone(phone):
            return jsonify({"error": "Invalid phone number"}), 400
        
        user.phone = phone
        
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
        
        db.session.commit()
        
        return jsonify({
            "message": "Settings saved successfully",
            "phone": user.phone,
            "thresholds": settings.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
