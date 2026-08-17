import csv
import json
import os
from collections import Counter
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = Path(os.getenv("POTABILITY_DATASET", str(BASE_DIR / "water_potability.csv")))
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "rf_water_potability_model.pkl"
SCALER_PATH = MODEL_DIR / "rf_scaler.pkl"
IMPUTER_PATH = MODEL_DIR / "rf_imputer.pkl"
MANIFEST_PATH = MODEL_DIR / "potability_retrain_manifest.json"
BACKUP_DIR = Path(
    os.getenv("MODEL_BACKUP_DIR", str(BASE_DIR / "instance" / "model_backups"))
)

# Keep only features that match the live system measurements.
FEATURE_MAP = {
    "ph": "ph",
    "Solids": "tds",
    "Conductivity": "conductivity",
    "Turbidity": "turbidity",
}


def backup_file(path: Path) -> Path | None:
    if not path.exists():
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / f"{path.stem}_{timestamp}{path.suffix}.bak"
    backup_path.write_bytes(path.read_bytes())
    return backup_path


def load_dataset() -> tuple[np.ndarray, np.ndarray, dict[str, int]]:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    rows: list[list[float]] = []
    labels: list[int] = []
    missing_counts = {source: 0 for source in FEATURE_MAP}

    with DATASET_PATH.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        required = set(FEATURE_MAP) | {"Potability"}
        missing_columns = required - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(f"Dataset is missing columns: {sorted(missing_columns)}")

        for record in reader:
            feature_row: list[float] = []
            for source in FEATURE_MAP:
                raw = record.get(source, "")
                if raw == "":
                    feature_row.append(np.nan)
                    missing_counts[source] += 1
                else:
                    feature_row.append(float(raw))

            rows.append(feature_row)
            labels.append(int(record["Potability"]))

    if not rows:
        raise ValueError("Dataset is empty.")

    return np.array(rows, dtype=np.float32), np.array(labels, dtype=np.int32), missing_counts


def main() -> None:
    X, y, missing_counts = load_dataset()
    label_counts = Counter(y.tolist())

    print(f"Loaded dataset: {DATASET_PATH}")
    print(f"Rows: {len(X)}")
    print(f"Live feature mapping: {FEATURE_MAP}")
    print(f"Label counts: {dict(label_counts)}")
    print(f"Missing source values: {missing_counts}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()

    X_train_imputed = imputer.fit_transform(X_train)
    X_test_imputed = imputer.transform(X_test)

    X_train_scaled = scaler.fit_transform(X_train_imputed)
    X_test_scaled = scaler.transform(X_test_imputed)

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    predictions = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions)
    report = classification_report(y_test, predictions, output_dict=True)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_backup = backup_file(MODEL_PATH)
    scaler_backup = backup_file(SCALER_PATH)
    imputer_backup = backup_file(IMPUTER_PATH)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(imputer, IMPUTER_PATH)

    manifest = {
        "trained_at": datetime.now().isoformat(),
        "dataset": str(DATASET_PATH),
        "source_columns_used": list(FEATURE_MAP.keys()),
        "live_feature_names": list(FEATURE_MAP.values()),
        "rows_used": int(len(X)),
        "label_counts": {str(key): int(value) for key, value in label_counts.items()},
        "missing_source_values": {key: int(value) for key, value in missing_counts.items()},
        "artifacts_updated": [
            MODEL_PATH.name,
            SCALER_PATH.name,
            IMPUTER_PATH.name,
        ],
        "metrics": {
            "accuracy": float(accuracy),
            "f1": float(f1),
            "classification_report": report,
        },
        "notes": [
            "This potability model uses only features shared with the live monitoring system.",
            "Temperature is intentionally excluded because the uploaded labeled dataset does not contain it.",
            "Solids is mapped to live TDS for inference compatibility.",
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))

    print(f"Accuracy: {accuracy:.4f}")
    print(f"F1 score: {f1:.4f}")
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved scaler to {SCALER_PATH}")
    print(f"Saved imputer to {IMPUTER_PATH}")
    print(f"Saved retrain manifest to {MANIFEST_PATH}")
    if model_backup:
        print(f"Backed up previous model to {model_backup}")
    if scaler_backup:
        print(f"Backed up previous scaler to {scaler_backup}")
    if imputer_backup:
        print(f"Backed up previous imputer to {imputer_backup}")


if __name__ == "__main__":
    main()
