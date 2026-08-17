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

prediction_api = Blueprint("prediction_api", __name__)
MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_CANDIDATES = [
    MODEL_DIR / "lstm_best_water_model.keras",
    MODEL_DIR / "lstm_best_water_model.h5",
]

print("Loading LSTM prediction model...")

# ---- Load LSTM Model ----
try:
    model_path = next(path for path in MODEL_CANDIDATES if path.exists())
    lstm_model = load_model(model_path, compile=False)
    lstm_scaler = joblib.load(MODEL_DIR / "scaler.save")
    model_loaded = True
    print(f"✅ LSTM model loaded successfully from {model_path.name}")
except Exception as e:
    print(f"❌ Error loading LSTM model: {e}")
    lstm_model = None
    lstm_scaler = None
    model_loaded = False

FEATURES = ['pH', 'TDS', 'Turbidity', 'Conductivity', 'Temperature']
WINDOW_SIZE = 10  # Use last 10 readings to predict the 11th


@prediction_api.route("/predict", methods=["GET"])
@jwt_required()
def predict():
    """
    Predict next sensor reading (11th reading) based on last 10 actual readings
    
    Returns:
    - pH, TDS, Turbidity, Conductivity, Temperature (predicted next values)
    """
    if not model_loaded:
        return jsonify({
            "error": "Prediction model not available",
            "message": "LSTM model could not be loaded"
        }), 503

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    device_id = user.device_id

    # Get last 10 readings for prediction
    readings = SensorReading.query.filter_by(device_id=device_id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(WINDOW_SIZE)\
        .all()

    if len(readings) < WINDOW_SIZE:
        return jsonify({
            "error": f"Not enough data for prediction",
            "message": f"Need at least {WINDOW_SIZE} readings, found {len(readings)}",
            "device_id": device_id
        }), 400

    # Reverse to get chronological order
    readings = list(reversed(readings))
    
    # Extract feature values in correct order
    data = np.array([[
        r.pH, r.tds, r.turbidity, r.conductivity, r.temperature
    ] for r in readings])

    try:
        # Scale the data
        data_scaled = lstm_scaler.transform(data)
        
        # Reshape for LSTM: (samples=1, timesteps=10, features=5)
        X = np.reshape(data_scaled, (1, WINDOW_SIZE, len(FEATURES)))
        
        # Predict next reading
        pred_scaled = lstm_model.predict(X, verbose=0)
        predicted = lstm_scaler.inverse_transform(pred_scaled)[0]
        
        # Get current (latest) reading for comparison
        latest = readings[-1]
        
        return jsonify({
            "device_id": device_id,
            "prediction_for_next_reading": {
                "pH": float(predicted[0]),
                "TDS": float(predicted[1]),
                "Turbidity": float(predicted[2]),
                "Conductivity": float(predicted[3]),
                "Temperature": float(predicted[4])
            },
            "latest_actual_reading": {
                "pH": latest.pH,
                "TDS": latest.tds,
                "Turbidity": latest.turbidity,
                "Conductivity": latest.conductivity,
                "Temperature": latest.temperature,
                "timestamp": latest.timestamp.isoformat()
            },
            "readings_used_for_prediction": WINDOW_SIZE,
            "model": "LSTM Time-Series"
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500
