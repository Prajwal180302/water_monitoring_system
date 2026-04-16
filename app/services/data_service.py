import pandas as pd

def get_sensor_data(device_id):
    # read CSV
    df = pd.read_csv("/home/prajwalshingote/water_monitoring/data/sensor_data1.csv")
    # filter by device_id
    df_filtered = df[df["device_id"] == device_id]


    # convert to dictionary
    return df_filtered.to_dict(orient="records")