import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from tensorflow.keras.models import load_model
import numpy as np
import joblib
from pathlib import Path
from app.models.user_model import User
from app.models.sensor_model import SensorReading
from app.services.threshold_service import get_or_create_user_settings, get_threshold_ranges

alert_api = Blueprint("alert_api", __name__)
MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_CANDIDATES = [
    MODEL_DIR / "lstm_best_water_model.keras",
    MODEL_DIR / "lstm_best_water_model.h5",
]

print("Loading ML models...")

# ---- LSTM Model for Prediction ----
try:
    model_path = next(path for path in MODEL_CANDIDATES if path.exists())
    lstm_model = load_model(model_path, compile=False)
    lstm_scaler = joblib.load(MODEL_DIR / "scaler.save")
    models_loaded = True
    print(f"✅ LSTM model loaded successfully from {model_path.name}")
except Exception as e:
    print(f"⚠️  Warning: Could not load LSTM model: {e}")
    lstm_model = None
    lstm_scaler = None
    models_loaded = False

# ---- Anomaly Detection Thresholds ----
ANOMALY_THRESHOLDS = {
    "pH": 0.5,
    "TDS": 50,
    "Turbidity": 0.5,
    "Conductivity": 30,
    "Temperature": 3
}

FEATURES = ['pH', 'TDS', 'Turbidity', 'Conductivity', 'Temperature']
WINDOW_SIZE = 10


@alert_api.route("/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    """
    Get current and future alerts for authenticated user's device
    
    Returns:
    - CURRENT ALERT (CRITICAL): If actual reading violates WHO limits
    - FUTURE ALERT (WARNING): If predicted next reading violates WHO limits
    - ANOMALY ALERT: If large deviation between actual and predicted
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    device_id = user.device_id
    settings = get_or_create_user_settings(user.id)
    thresholds = get_threshold_ranges(settings)

    # Get last 10 readings for prediction + current reading
    readings = SensorReading.query.filter_by(device_id=device_id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(11)\
        .all()

    if len(readings) < 2:
        return jsonify({
            "alerts": [],
            "message": "Not enough data for alert generation"
        }), 200

    # Reverse to get chronological order
    readings = list(reversed(readings))
    
    # Current reading (latest)
    current = readings[-1]
    actual = {
        'pH': current.pH,
        'TDS': current.tds,
        'Turbidity': current.turbidity,
        'Conductivity': current.conductivity,
        'Temperature': current.temperature
    }

    alerts = []
    critical_params = []

    # ============= CURRENT ALERT (WHO Threshold Check) =============
    for param, (low, high) in thresholds.items():
        actual_val = actual[param]
        
        if actual_val < low or actual_val > high:

            critical_params.append(param)

            alerts.append({
                "type": "critical",
                "parameter": param,
                "message": f"⚠️ {param} is UNSAFE NOW: {actual_val} (Safe range: {low}-{high})",
                "actual_value": actual_val,
                "safe_range": [low, high],
                "severity": "CRITICAL",
                "time": "Now"
            })

    # ============= FUTURE ALERT (LSTM Prediction) =============
    if models_loaded and len(readings) >= WINDOW_SIZE:
        try:
            # Get last 10 readings for prediction
            last_10 = readings[-WINDOW_SIZE:]
            data = np.array([[
                r.pH, r.tds, r.turbidity, r.conductivity, r.temperature
            ] for r in last_10])

            # Scale and reshape
            data_scaled = lstm_scaler.transform(data)
            X = np.reshape(data_scaled, (1, WINDOW_SIZE, len(FEATURES)))

            # Predict next reading
            pred_scaled = lstm_model.predict(X, verbose=0)
            predicted = lstm_scaler.inverse_transform(pred_scaled)[0]

            # Check predicted values against the user's active thresholds
            for i, param in enumerate(FEATURES):

                if param in critical_params:
                    continue
                low, high = thresholds[param]
                pred_val = float(predicted[i])
                
                if pred_val < low or pred_val > high:
                    alerts.append({
                        "type": "warning",
                        "parameter": param,
                        "message": f"🔔 {param} may go out of range: Predicted {pred_val} (Safe range: {low}-{high})",
                        "predicted_value": pred_val,
                        "safe_range": [low, high],
                        "severity": "WARNING",
                        "time": "Next reading"
                    })

                # ============= ANOMALY DETECTION =============
                actual_val = actual[param]
                delta = abs(actual_val - pred_val)
                threshold = ANOMALY_THRESHOLDS[param]
                
                if delta > threshold:
                    alerts.append({
                        "type": "anomaly",
                        "parameter": param,
                        "message": f"🚨 ANOMALY in {param}: Actual={actual_val}, Predicted={pred_val}, Delta={delta}",
                        "actual_value": actual_val,
                        "predicted_value": pred_val,
                        "delta": delta,
                        "threshold": threshold,
                        "severity": "MEDIUM",
                        "time": "Now"
                    })

        except Exception as e:
            print(f"Error during prediction: {e}")

    return jsonify({
        "alerts": alerts,
        "total_alerts": len(alerts),
        "critical_count": len([a for a in alerts if a["type"] == "critical"]),
        "warning_count": len([a for a in alerts if a["type"] == "warning"]),
        "anomaly_count": len([a for a in alerts if a["type"] == "anomaly"]),
        "timestamp": current.timestamp.isoformat() if current.timestamp else None
    }), 200
