from app import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    device_id = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    language = db.Column(db.String(10), nullable=True, default="en")
    settings = db.relationship('UserSettings', backref='user', uselist=False, cascade='all, delete-orphan')

    def __init__(self, email, password, device_id, phone=None, name=None, language="en"):
        self.name = name
        self.email = email
        self.password = password
        self.device_id = device_id
        self.phone = phone
        self.language = language

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "device_id": self.device_id,
            "phone": self.phone,
            "language": self.language or "en"
        }
