from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user_model import User
from app.models.sensor_model import SensorReading

data_bp = Blueprint("data", __name__)

@data_bp.route("/data", methods=["GET"])
@jwt_required()
def get_data():
    """
    Get latest sensor readings for authenticated user's device
    Returns last 20 readings in reverse chronological order
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    device_id = user.device_id

    # Query last 20 readings from database, ordered by timestamp descending
    readings = SensorReading.query.filter_by(device_id=device_id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(20)\
        .all()

    if not readings:
        return jsonify({"error": f"No data found for device {device_id}"}), 404

    # Reverse to get chronological order (oldest to newest)
    readings = list(reversed(readings))
    
    # Convert to dict
    data = [r.to_dict() for r in readings]

    return jsonify(data), 200