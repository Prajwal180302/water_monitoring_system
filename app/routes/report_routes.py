from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user_model import User
from app.models.sensor_model import SensorReading

report_api = Blueprint("report_api", __name__)

# WHO Safe Ranges for calculations
WHO_LIMITS = {
    "pH": (6.5, 8.5),
    "TDS": (0, 300),
    "Turbidity": (0, 1),
    "Conductivity": (0, 150),
    "Temperature": (15, 25)
}


@report_api.route("/reports", methods=["GET"])
@jwt_required()
def get_reports():
    """
    Get comprehensive water quality report for authenticated user's device
    
    Returns:
    - Summary statistics (avg, min, max for each parameter)
    - Safety metrics (percentage of safe readings, total alerts)
    - Historical data (last 100 readings)
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    device_id = user.device_id

    # Get last 100 readings for report
    readings = SensorReading.query.filter_by(device_id=device_id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(100)\
        .all()

    if not readings:
        return jsonify({"error": f"No data found for device {device_id}"}), 404

    # Reverse to get chronological order
    readings = list(reversed(readings))
    
    # ============= SUMMARY STATISTICS =============
    temperatures = [r.temperature for r in readings]
    phs = [r.pH for r in readings]
    tdss = [r.tds for r in readings]
    turbidities = [r.turbidity for r in readings]
    conductivities = [r.conductivity for r in readings]

    summary = {
        "data_points": len(readings),
        "time_span_hours": (readings[-1].timestamp - readings[0].timestamp).total_seconds() / 3600 if len(readings) > 1 else 0,
        
        # Temperature
        "temperature": {
            "avg": round(sum(temperatures) / len(temperatures), 2),
            "min": round(min(temperatures), 2),
            "max": round(max(temperatures), 2),
            "safe_range": WHO_LIMITS["Temperature"]
        },
        
        # pH
        "pH": {
            "avg": round(sum(phs) / len(phs), 2),
            "min": round(min(phs), 2),
            "max": round(max(phs), 2),
            "safe_range": WHO_LIMITS["pH"]
        },
        
        # TDS
        "TDS": {
            "avg": round(sum(tdss) / len(tdss), 2),
            "min": round(min(tdss), 2),
            "max": round(max(tdss), 2),
            "safe_range": WHO_LIMITS["TDS"]
        },
        
        # Turbidity
        "Turbidity": {
            "avg": round(sum(turbidities) / len(turbidities), 2),
            "min": round(min(turbidities), 2),
            "max": round(max(turbidities), 2),
            "safe_range": WHO_LIMITS["Turbidity"]
        },
        
        # Conductivity
        "Conductivity": {
            "avg": round(sum(conductivities) / len(conductivities), 2),
            "min": round(min(conductivities), 2),
            "max": round(max(conductivities), 2),
            "safe_range": WHO_LIMITS["Conductivity"]
        }
    }

    # ============= SAFETY METRICS =============
    safe_readings = sum(1 for r in readings if (
        WHO_LIMITS["Temperature"][0] <= r.temperature <= WHO_LIMITS["Temperature"][1] and
        WHO_LIMITS["pH"][0] <= r.pH <= WHO_LIMITS["pH"][1] and
        r.tds <= WHO_LIMITS["TDS"][1] and
        r.turbidity <= WHO_LIMITS["Turbidity"][1] and
        WHO_LIMITS["Conductivity"][0] <= r.conductivity <= WHO_LIMITS["Conductivity"][1]
    ))
    
    unsafe_readings = len(readings) - safe_readings
    safe_percentage = (safe_readings / len(readings) * 100) if len(readings) > 0 else 0

    alerts = {
        "total_safe_readings": safe_readings,
        "total_unsafe_readings": unsafe_readings,
        "safety_percentage": round(safe_percentage, 2),
        
        # Parameter-wise violations
        "violations_by_parameter": {
            "pH_violations": sum(1 for r in readings if r.pH < WHO_LIMITS["pH"][0] or r.pH > WHO_LIMITS["pH"][1]),
            "TDS_violations": sum(1 for r in readings if r.tds > WHO_LIMITS["TDS"][1]),
            "Turbidity_violations": sum(1 for r in readings if r.turbidity > WHO_LIMITS["Turbidity"][1]),
            "Temperature_violations": sum(1 for r in readings if r.temperature < WHO_LIMITS["Temperature"][0] or r.temperature > WHO_LIMITS["Temperature"][1]),
            "Conductivity_violations": sum(1 for r in readings if r.conductivity < WHO_LIMITS["Conductivity"][0] or r.conductivity > WHO_LIMITS["Conductivity"][1])
        }
    }

    # ============= HISTORICAL DATA =============
    data = [r.to_dict() for r in readings]

    return jsonify({
        "device_id": device_id,
        "summary": summary,
        "alerts": alerts,
        "data": data
    }), 200