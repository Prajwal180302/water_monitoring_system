import bcrypt
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user_model import User
from datetime import timedelta
from app.services.user_service import generate_device_id, generate_unique_name


def create_user(name, email, password, device_id=None):

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return None

    unique_name = generate_unique_name(name)
    resolved_device_id = device_id or generate_device_id(unique_name, email)

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(
        name=unique_name,
        device_id=resolved_device_id,
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

    return {
        "access_token": access_token,
        "user": user.to_dict(),
    }


def reset_user_password(identifier, new_password):
    user = User.query.filter(
        (User.email == identifier) |
        (User.device_id == identifier)
    ).first()

    if not user:
        return None

    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password = hashed
    db.session.commit()

    return user
