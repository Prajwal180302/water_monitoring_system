import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense
import joblib

print("Loading dataset...")

# ---- Load dataset ----
df = pd.read_csv("synthetic_timeseries_dataset.csv")

# ---- Rename columns (IMPORTANT) ----
df.rename(columns={
    "temperature": "Temperature",
    "tds": "TDS",
    "turbidity": "Turbidity",
    "conductivity": "Conductivity"
}, inplace=True)

# ---- Select features ----
FEATURES = ["pH", "TDS", "Turbidity", "Conductivity", "Temperature"]

# ---- Sort by time (if exists) ----
if "timestamp" in df.columns:
    df = df.sort_values("timestamp")

# ---- Remove missing values ----
df = df.dropna()

print("Dataset shape:", df.shape)

# ---- Scaling ----
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df[FEATURES])

# ---- Create sequences ----
WINDOW_SIZE = 10

X = []
y = []

for i in range(len(scaled_data) - WINDOW_SIZE):
    X.append(scaled_data[i:i+WINDOW_SIZE])
    y.append(scaled_data[i+WINDOW_SIZE])

X = np.array(X)
y = np.array(y)

print("X shape:", X.shape)
print("y shape:", y.shape)

# ---- Build LSTM Model ----
model = Sequential()
model.add(LSTM(64, input_shape=(WINDOW_SIZE, len(FEATURES))))
model.add(Dense(32, activation='relu'))
model.add(Dense(len(FEATURES)))

model.compile(optimizer='adam', loss='mse')

print("Training model...")

early_stop = EarlyStopping(
    monitor='loss',
    patience=5,
    restore_best_weights=True
)

model.fit(
    X, y,
    epochs=50,
    batch_size=32,
    callbacks=[early_stop])

# ---- Save model ----
model.save("lstm_best_water_model.h5")
joblib.dump(scaler, "scaler.save")

print("✅ LSTM Training Complete!")