from app import db
from datetime import datetime

class SensorReading(db.Model):
    __tablename__ = "sensor_readings"

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50))

    pH = db.Column(db.Float)
    tds = db.Column(db.Float)
    turbidity = db.Column(db.Float)
    conductivity = db.Column(db.Float)
    temperature = db.Column(db.Float)

    timestamp = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, device_id, temperature, pH, tds, turbidity, conductivity, 
                 timestamp=None, created_at=None):
        self.device_id = device_id
        self.temperature = temperature
        self.pH = pH
        self.tds = tds
        self.turbidity = turbidity
        self.conductivity = conductivity
        self.timestamp = timestamp or datetime.utcnow()
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "temperature": self.temperature,
            "pH": self.pH,
            "tds": self.tds,
            "turbidity": self.turbidity,
            "conductivity": self.conductivity,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f"<SensorReading {self.device_id} {self.timestamp}>"
