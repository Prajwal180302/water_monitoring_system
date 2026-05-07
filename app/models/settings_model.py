from app import db


class UserSettings(db.Model):
    __tablename__ = "user_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # pH thresholds
    pH_min = db.Column(db.Float, default=6.5)
    pH_max = db.Column(db.Float, default=8.5)
    
    # TDS threshold (Total Dissolved Solids)
    tds = db.Column(db.Float, default=500.0)
    
    # Turbidity threshold (NTU - Nephelometric Turbidity Units)
    turbidity = db.Column(db.Float, default=1.0)
    
    # Temperature thresholds
    temperature_min = db.Column(db.Float, default=10.0)
    temperature_max = db.Column(db.Float, default=25.0)
    
    # Conductivity threshold
    conductivity = db.Column(db.Float, default=1000.0)

    # Calibration and device controls
    calibration_ph = db.Column(db.Float, default=0.0)
    calibration_tds = db.Column(db.Float, default=0.0)
    calibration_turbidity = db.Column(db.Float, default=0.0)
    calibration_conductivity = db.Column(db.Float, default=0.0)
    sampling_interval = db.Column(db.Integer, default=1800)
    device_status = db.Column(db.String(20), default="active")
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __init__(self, user_id, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "pH_min": self.pH_min,
            "pH_max": self.pH_max,
            "tds": self.tds,
            "turbidity": self.turbidity,
            "temperature_min": self.temperature_min,
            "temperature_max": self.temperature_max,
            "conductivity": self.conductivity,
            "calibration": {
                "ph": self.calibration_ph,
                "tds": self.calibration_tds,
                "turbidity": self.calibration_turbidity,
                "conductivity": self.calibration_conductivity,
            },
            "samplingInterval": self.sampling_interval,
            "deviceStatus": self.device_status,
        }
