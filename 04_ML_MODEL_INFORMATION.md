# Machine Learning Model Information

## Important note: this project does not use images

This is a **sensor time-series** project, not an image-classification project.
Therefore, the models were trained on rows of water-sensor values, not on
images. The correct training-unit name is **sensor readings**, not images.

## Models in this project

| Model | Purpose | Currently used by the application? |
|---|---|---|
| LSTM time-series model | Predicts the next water-sensor reading. | Yes |
| Random Forest potability model | Predicts potable/non-potable class. | No; its artifact files are not currently present/loaded by the API. |

## 1. Active model: LSTM next-reading prediction

### Purpose

The LSTM predicts the next values of five water-quality measurements. It is
used by the Prediction page and the Alerts page.

### Model files

| File | Purpose |
|---|---|
| `be/models/lstm_best_water_model.keras` | Saved trained LSTM model, about 421 KB. |
| `be/models/scaler.save` | MinMaxScaler used to scale sensor values before prediction. |
| `be/models/retrain_manifest.json` | Record of training data and validation results. |

### Training data

| Item | Value |
|---|---|
| Training date recorded | 20 April 2026 |
| Total sensor readings | 3,000 |
| Devices used | 3: `DEVICE_001`, `DEVICE_002`, `DEVICE_003` |
| Readings per device | 1,000 each |
| Images used | 0 |
| Input time window | Previous 10 readings |
| Input features | pH, TDS, turbidity, conductivity, temperature |
| Output | Next pH, TDS, turbidity, conductivity, temperature values |

Because each device has 1,000 readings and the model needs the previous 10
readings, it can create 990 sequences per device: **2,970 sequences total**.
The training script splits those sequences into 80% training and 20%
validation data: approximately **2,376 training sequences** and **594
validation sequences**.

### Model architecture

```text
Input: 10 time steps × 5 features
        ↓
LSTM layer: 64 units
        ↓
Dropout: 20%
        ↓
LSTM layer: 32 units
        ↓
Dropout: 20%
        ↓
Dense layer: 32 ReLU units
        ↓
Output layer: 5 predicted sensor values
```

### Training setup

| Setting | Value |
|---|---|
| Optimizer | Adam |
| Loss function | Mean Squared Error (MSE) |
| Additional metric | Mean Absolute Error (MAE) |
| Maximum epochs | 40 |
| Batch size | 32 |
| Early stopping | Yes, patience 8; restores best weights |
| Random seed | 42 |

### Recorded validation result

| Metric | Value | Meaning |
|---|---:|---|
| Validation loss (MSE) | 0.006277 | Error on scaled sensor values; lower is better. |
| Validation MAE | 0.041815 | Average absolute error on scaled values; lower is better. |
| Epochs run | 40 | Training completed the configured maximum epochs. |
| Accuracy | Not applicable | LSTM predicts numeric values, so classification accuracy is not the correct metric. |

### Input and output example

Input to model:

```text
Last 10 readings for one device
Each reading = [pH, TDS, turbidity, conductivity, temperature]
```

Output from model:

```json
{
  "pH": 7.2,
  "TDS": 286.4,
  "Turbidity": 1.1,
  "Conductivity": 511.8,
  "Temperature": 26.0
}
```

The sample values above are illustrative. Actual values come from the trained
model and the latest sensor history.

## 2. Random Forest potability experiment

This is a recorded training experiment. The manifest says the model used a
labelled water-potability CSV, but its `.pkl` model files are not currently in
`be/models/`, and the live API does not load this model.

### Training data

| Item | Value |
|---|---:|
| Total labelled rows | 3,276 |
| Non-potable label `0` | 1,998 |
| Potable label `1` | 1,278 |
| Train rows | 2,620 (80%) |
| Test rows | 656 (20%) |
| Images used | 0 |
| Features | pH, Solids mapped to TDS, conductivity, turbidity |
| Temperature used | No; it was not available in the labelled source dataset. |

### Random Forest settings

| Setting | Value |
|---|---:|
| Number of trees | 300 |
| Maximum depth | 12 |
| Minimum samples per split | 4 |
| Minimum samples per leaf | 2 |
| Class weighting | Balanced |
| Missing-value handling | Median imputation |
| Scaling | StandardScaler |
| Random seed | 42 |

### Recorded test result

| Metric | Value |
|---|---:|
| Accuracy | 53.51% |
| F1 score for potable class | 36.85% |
| Precision for potable class | 39.21% |
| Recall for potable class | 34.77% |

This result is not strong enough to use as the main safety decision for real
water. The app should keep using threshold rules and the LSTM prediction for
the current project demonstration. A larger, cleaner labelled dataset and
further evaluation are needed before using this classifier in a real water
safety product.

## How to explain the ML work to an examiner

> “Our main active model is an LSTM time-series model. It learns from the last
> 10 water-sensor readings and predicts the next five values: pH, TDS,
> turbidity, conductivity, and temperature. It was trained using 3,000 sensor
> readings from three devices. It achieved validation MSE 0.006277 and MAE
> 0.041815 on scaled data. This project does not use images because the input
> is numerical IoT sensor data.”

## Retraining commands

Run inside the backend container after enough historical data exists:

```bash
docker compose run --rm --no-deps -v "$PWD/be:/app" backend python scripts/retrain_lstm_model.py
```

The training script updates the LSTM model, scaler, and
`retrain_manifest.json`. Keep a backup of old model files before retraining.
