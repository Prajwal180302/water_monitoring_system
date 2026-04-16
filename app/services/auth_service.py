import bcrypt
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user_model import User
from datetime import timedelta


def create_user(device_id, email, password):

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return None

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(
        device_id=device_id,
        email=email,
        password=hashed.decode('utf-8')
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user

def login_user(email, password):

    user = User.query.filter(
        (User.email == email) |
        (User.device_id == email)
    ).first()

    if not user:
        return None

    # check password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return None

    # generate token
    access_token = create_access_token(identity=str(user.id),expires_delta=timedelta(hours=5))

    return access_token