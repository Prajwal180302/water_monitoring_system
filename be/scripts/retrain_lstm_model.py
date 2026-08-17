import os
import sqlite3
from datetime import datetime
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "instance" / "database.db"
MODEL_DIR = BASE_DIR / "models"
LEGACY_MODEL_PATH = MODEL_DIR / "lstm_best_water_model.h5"
KERAS_MODEL_PATH = MODEL_DIR / "lstm_best_water_model.keras"
SCALER_PATH = MODEL_DIR / "scaler.save"
MANIFEST_PATH = MODEL_DIR / "retrain_manifest.json"
BACKUP_DIR = Path(
    os.getenv("MODEL_BACKUP_DIR", str(BASE_DIR / "instance" / "model_backups"))
)
WINDOW_SIZE = 10
FEATURES = ["pH", "tds", "turbidity", "conductivity", "temperature"]
SEED = 42


def load_sensor_data() -> pd.DataFrame:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    query = """
        SELECT device_id, pH, tds, turbidity, conductivity, temperature, timestamp
        FROM sensor_readings
        WHERE pH IS NOT NULL
          AND tds IS NOT NULL
          AND turbidity IS NOT NULL
          AND conductivity IS NOT NULL
          AND temperature IS NOT NULL
          AND timestamp IS NOT NULL
        ORDER BY device_id, timestamp
    """
    with sqlite3.connect(DB_PATH) as connection:
        df = pd.read_sql_query(query, connection)

    if df.empty:
        raise ValueError("No sensor data found for training.")

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def build_sequences(df: pd.DataFrame, scaler: MinMaxScaler) -> tuple[np.ndarray, np.ndarray]:
    sequences = []
    labels = []

    for _, group in df.groupby("device_id", sort=False):
        feature_data = group[FEATURES].to_numpy(dtype=np.float32)
        if len(feature_data) <= WINDOW_SIZE:
            continue

        scaled = scaler.transform(feature_data)
        for idx in range(WINDOW_SIZE, len(scaled)):
            sequences.append(scaled[idx - WINDOW_SIZE:idx])
            labels.append(scaled[idx])

    if not sequences:
        raise ValueError("Not enough readings to create training windows.")

    return np.array(sequences, dtype=np.float32), np.array(labels, dtype=np.float32)


def build_model() -> Sequential:
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(WINDOW_SIZE, len(FEATURES))),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(32, activation="relu"),
        Dense(len(FEATURES)),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model


def backup_file(path: Path) -> Path | None:
    if not path.exists():
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / f"{path.stem}_{timestamp}{path.suffix}.bak"
    backup_path.write_bytes(path.read_bytes())
    return backup_path


def main() -> None:
    np.random.seed(SEED)

    print(f"Loading training data from {DB_PATH}")
    df = load_sensor_data()
    device_counts = df.groupby("device_id").size().to_dict()
    print(f"Loaded {len(df)} readings across {df['device_id'].nunique()} devices")
    print(f"Per-device counts: {device_counts}")

    scaler = MinMaxScaler()
    scaler.fit(df[FEATURES].to_numpy(dtype=np.float32))

    X, y = build_sequences(df, scaler)
    print(f"Created {len(X)} training windows with shape {X.shape[1:]}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=SEED, shuffle=True
    )

    model = build_model()
    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=8,
            restore_best_weights=True,
            verbose=1,
        )
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=40,
        batch_size=32,
        callbacks=callbacks,
        verbose=1,
    )

    loss, mae = model.evaluate(X_val, y_val, verbose=0)
    print(f"Validation loss: {loss:.6f}")
    print(f"Validation MAE: {mae:.6f}")
    print(f"Best epoch count: {len(history.history['loss'])}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    keras_model_backup = backup_file(KERAS_MODEL_PATH)
    legacy_model_backup = backup_file(LEGACY_MODEL_PATH)
    scaler_backup = backup_file(SCALER_PATH)

    model.save(KERAS_MODEL_PATH)
    model.save(LEGACY_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    manifest = {
        "trained_at": datetime.now().isoformat(),
        "database": str(DB_PATH),
        "window_size": WINDOW_SIZE,
        "features": FEATURES,
        "devices_used": sorted(device_counts.keys()),
        "readings_used": int(len(df)),
        "device_reading_counts": {device: int(count) for device, count in device_counts.items()},
        "artifacts_updated": [
            KERAS_MODEL_PATH.name,
            LEGACY_MODEL_PATH.name,
            SCALER_PATH.name,
        ],
        "validation": {
            "loss": float(loss),
            "mae": float(mae),
            "epochs_ran": int(len(history.history["loss"])),
        },
        "notes": [
            "This project currently loads only the LSTM model and scaler for prediction and alerts.",
            "Random-forest potability artifacts were not retrained because the local SQLite data does not contain potability labels.",
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))

    print(f"Saved model to {KERAS_MODEL_PATH}")
    print(f"Saved legacy model to {LEGACY_MODEL_PATH}")
    print(f"Saved scaler to {SCALER_PATH}")
    print(f"Saved retrain manifest to {MANIFEST_PATH}")
    if keras_model_backup:
        print(f"Backed up previous Keras model to {keras_model_backup}")
    if legacy_model_backup:
        print(f"Backed up previous legacy model to {legacy_model_backup}")
    if scaler_backup:
        print(f"Backed up previous scaler to {scaler_backup}")


if __name__ == "__main__":
    main()
