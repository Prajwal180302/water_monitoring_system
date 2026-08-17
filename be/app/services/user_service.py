from __future__ import annotations

import random
import re
from typing import Iterable

from sqlalchemy import inspect, text

from app.extensions import db
from app.models.user_model import User

RANDOM_NAME_POOL = [
    "Aarav Sharma",
    "Riya Patel",
    "Karan Mehta",
    "Neha Verma",
    "Rahul Singh",
    "Priya Nair",
    "Ankit Gupta",
    "Sneha Iyer",
    "Vikram Joshi",
    "Pooja Desai",
    "Arjun Reddy",
    "Meera Nair",
]


def ensure_user_profile_columns() -> None:
    inspector = inspect(db.engine)
    if not inspector.has_table(User.__tablename__):
        db.create_all()
        return

    columns = {column["name"] for column in inspector.get_columns(User.__tablename__)}
    changed = False

    if "name" not in columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(100)"))
        changed = True

    if "phone" not in columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
        changed = True

    if "language" not in columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'"))
        changed = True

    if changed:
        db.session.commit()


def ensure_user_settings_columns() -> None:
    from app.models.settings_model import UserSettings

    inspector = inspect(db.engine)
    if not inspector.has_table(UserSettings.__tablename__):
        db.create_all()
        return

    columns = {column["name"] for column in inspector.get_columns(UserSettings.__tablename__)}
    missing_columns = {
        "calibration_ph": "ALTER TABLE user_settings ADD COLUMN calibration_ph FLOAT DEFAULT 0.0",
        "calibration_tds": "ALTER TABLE user_settings ADD COLUMN calibration_tds FLOAT DEFAULT 0.0",
        "calibration_turbidity": "ALTER TABLE user_settings ADD COLUMN calibration_turbidity FLOAT DEFAULT 0.0",
        "calibration_conductivity": "ALTER TABLE user_settings ADD COLUMN calibration_conductivity FLOAT DEFAULT 0.0",
        "sampling_interval": "ALTER TABLE user_settings ADD COLUMN sampling_interval INTEGER DEFAULT 1800",
        "device_status": "ALTER TABLE user_settings ADD COLUMN device_status VARCHAR(20) DEFAULT 'active'",
    }
    changed = False

    for column_name, statement in missing_columns.items():
        if column_name not in columns:
            db.session.execute(text(statement))
            changed = True

    if "sampling_interval" in columns:
        db.session.execute(text("UPDATE user_settings SET sampling_interval = 1800 WHERE sampling_interval IS NULL OR sampling_interval = 3"))
        changed = True

    if changed:
        db.session.commit()


def ensure_application_columns() -> None:
    ensure_user_profile_columns()
    ensure_user_settings_columns()


def ensure_user_name_column() -> None:
    ensure_application_columns()


def _slugify_device_id(source: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "_", source).strip("_").upper()
    return cleaned or f"DEVICE_{random.randint(1000, 9999)}"


def generate_device_id(name: str, email: str) -> str:
    base = _slugify_device_id(name or email.split("@")[0])
    candidate = base
    counter = 1

    while User.query.filter_by(device_id=candidate).first():
        counter += 1
        candidate = f"{base}_{counter}"

    return candidate


def generate_unique_name(base_name: str) -> str:
    cleaned = " ".join((base_name or "").split()).strip()
    if not cleaned:
        cleaned = random.choice(RANDOM_NAME_POOL)

    if not User.query.filter_by(name=cleaned).first():
        return cleaned

    counter = 1
    while True:
        candidate = f"{cleaned} {counter}"
        if not User.query.filter_by(name=candidate).first():
            return candidate
        counter += 1


def assign_names_to_existing_users() -> list[dict[str, str]]:
    updated_users: list[dict[str, str]] = []
    users_without_names = User.query.filter((User.name.is_(None)) | (User.name == "")).all()

    for counter, user in enumerate(users_without_names, start=1):
        random_name = random.choice(RANDOM_NAME_POOL)
        unique_name = generate_unique_name(f"{random_name} {counter}")
        user.name = unique_name
        updated_users.append({"name": user.name, "email": user.email})

    if updated_users:
        db.session.commit()

    return updated_users


def get_all_users_display() -> list[str]:
    users: Iterable[User] = User.query.order_by(User.name.asc(), User.email.asc()).all()
    return [f"{user.name} - {user.email}" for user in users if user.email]


def update_user_profile(
    user: User,
    *,
    name: str,
    email: str,
    phone: str | None = None,
    language: str | None = None,
    password: str | None = None,
) -> User | None:
    existing_email_user = User.query.filter(User.email == email, User.id != user.id).first()
    if existing_email_user:
        return None

    existing_name_user = User.query.filter(User.name == name, User.id != user.id).first()
    if existing_name_user:
        return None

    user.name = name
    user.email = email
    user.phone = phone
    if language:
        user.language = language
    if password:
        user.password = password

    db.session.commit()
    return user
