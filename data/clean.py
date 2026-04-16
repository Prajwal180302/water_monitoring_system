import pandas as pd

df = pd.read_csv("/home/prajwalshingote/water_monitoring/data/sensor_data.csv")

# convert numeric id → DEVICE format
df["device_id"] = df["device_id"].apply(lambda x: f"DEVICE_{int(x):03d}")

df.to_csv("/home/prajwalshingote/water_monitoring/data/sensor_data1.csv", index=False)

print("Updated successfully")