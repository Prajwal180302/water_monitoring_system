import bcrypt
import re
from flask import Blueprint, request, jsonify
from app.services.auth_service import create_user, login_user, reset_user_password
from app.services.user_service import get_all_users_display, update_user_profile
from app.models.user_model import User
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)

email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


def validate_phone(phone):
    if not phone:
        return True
    digits = ''.join(filter(str.isdigit, phone))
    return 10 <= len(digits) <= 15

# -------- SIGNUP --------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = (data.get("name") or "").strip()
    email = data.get("email")
    password = data.get("password")
    device_id = data.get("device_id")

    if not name or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    user = create_user(name, email, password, device_id)

    if not user:
        return jsonify({"error": "User already exists"}), 400

    return jsonify({
        "message": "User created successfully",
        "name": user.name,
        "email": user.email,
        "device_id": user.device_id
    })


# -------- LOGIN --------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    auth_result = login_user(email, password)

    if not auth_result:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "access_token": auth_result["access_token"],
        "user": auth_result["user"],
    })


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}

    identifier = (data.get("email") or data.get("device_id") or "").strip()
    new_password = data.get("new_password") or ""

    if not identifier or not new_password:
        return jsonify({"error": "Email or device ID and new password are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user = reset_user_password(identifier, new_password)
    if not user:
        return jsonify({"error": "No user found for that email or device ID"}), 404

    return jsonify({"message": "Password reset successfully"}), 200


# -------- PROFILE --------
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "message": "Access granted",
        "user": user.to_dict(),
    })


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip() or None
    language = (data.get("language") or user.language or "en").strip()
    password = data.get("password")

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    if len(name) < 2 or len(name) > 100:
        return jsonify({"error": "Name must be between 2 and 100 characters"}), 400

    if not re.match(email_pattern, email):
        return jsonify({"error": "Enter a valid email address"}), 400

    if phone and not validate_phone(phone):
        return jsonify({"error": "Phone number must contain 10 to 15 digits"}), 400

    if language not in {"en", "hi", "mr"}:
        return jsonify({"error": "Invalid language"}), 400

    hashed_password = None
    if password:
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    updated_user = update_user_profile(
        user,
        name=name,
        email=email,
        phone=phone,
        language=language,
        password=hashed_password,
    )

    if not updated_user:
        db.session.rollback()
        return jsonify({"error": "Name or email is already in use"}), 400

    return jsonify({
        "message": "Profile updated successfully",
        "user": updated_user.to_dict(),
    }), 200


@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    return jsonify({
        "users": get_all_users_display(),
    }), 200
