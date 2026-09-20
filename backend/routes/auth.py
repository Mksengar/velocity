import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

try:
    from database import db
except ModuleNotFoundError:
    from backend.database import db

try:
    from models import User
except ModuleNotFoundError:
    from backend.models import User


auth_bp = Blueprint("auth", __name__)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/", methods=["GET"])
def auth_home():
    return jsonify({
        "success": True,
        "message": "Authentication service is running"
    })


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    if not EMAIL_PATTERN.match(email):
        return jsonify({"success": False, "error": "Invalid email format"}), 400
    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "User already exists"}), 409

    base_username = name.replace(" ", "_") or email.split("@")[0]
    username = base_username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1

    user = User(
        username=username,
        email=email,
        password=password,
        first_name=name.split()[0] if name.split() else None,
        last_name=" ".join(name.split()[1:]) if len(name.split()) > 1 else None,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role, "email": user.email})

    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "user": user.to_dict(),
        "access_token": token
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role, "email": user.email})

    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    })


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({
        "success": True,
        "message": "Logout successful"
    }), 200
