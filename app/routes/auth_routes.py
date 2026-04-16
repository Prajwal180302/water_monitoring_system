from flask import Blueprint, request, jsonify
from app.services.auth_service import create_user, login_user
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)

# -------- SIGNUP --------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    device_id = data.get("device_id")
    email = data.get("email")
    password = data.get("password")

    if not device_id or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    user = create_user(device_id, email, password)

    if not user:
        return jsonify({"error": "User already exists"}), 400

    return jsonify({
        "message": "User created successfully",
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

    token = login_user(email, password)

    if not token:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "access_token": token
    })


# -------- PROFILE --------
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()

    return jsonify({
        "message": "Access granted",
        "user_id": user_id
    })