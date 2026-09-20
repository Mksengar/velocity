# ==========================================
# Velocity BI - Admin API
# File: backend/routes/admin.py
# ==========================================

import os
import json
import uuid
from datetime import datetime

from flask import (
    Blueprint,
    jsonify,
    request,
    current_app
)

try:
    import bcrypt
except ImportError:
    bcrypt = None


# ==========================================
# Blueprint
# ==========================================

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ==========================================
# Storage
# ==========================================

def get_storage_folder():
    folder = current_app.config.get("ADMIN_STORAGE_FOLDER")

    if not folder:
        folder = os.path.join(
            current_app.root_path,
            "storage",
            "admin"
        )

    os.makedirs(folder, exist_ok=True)

    return folder


def get_users_file():
    return os.path.join(
        get_storage_folder(),
        "users.json"
    )


def get_activity_file():
    return os.path.join(
        get_storage_folder(),
        "activity.json"
    )


# ==========================================
# JSON Storage Helpers
# ==========================================

def load_json(filepath, default=None):

    if default is None:
        default = []

    if not os.path.exists(filepath):
        return default

    try:
        with open(
            filepath,
            "r",
            encoding="utf-8"
        ) as file:
            return json.load(file)

    except Exception:
        return default


def save_json(filepath, data):

    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False,
            default=str
        )


# ==========================================
# Activity Logging
# ==========================================

def log_activity(
    action,
    description,
    user_id=None,
    admin_id="admin"
):

    activities = load_json(
        get_activity_file(),
        []
    )

    activity = {
        "activity_id": str(uuid.uuid4()),
        "action": action,
        "description": description,
        "user_id": user_id,
        "admin_id": admin_id,
        "timestamp": (
            datetime.utcnow().isoformat() + "Z"
        )
    }

    activities.insert(
        0,
        activity
    )

    # Keep latest 1000 activities
    activities = activities[:1000]

    save_json(
        get_activity_file(),
        activities
    )

    return activity


# ==========================================
# Password Helpers
# ==========================================

def hash_password(password):

    if bcrypt is None:
        return password

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    password,
    stored_password
):

    if bcrypt is None:
        return password == stored_password

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            stored_password.encode("utf-8")
        )
    except Exception:
        return False


# ==========================================
# User Helpers
# ==========================================

def sanitize_user(user):

    safe_user = dict(user)

    safe_user.pop(
        "password",
        None
    )

    safe_user.pop(
        "password_hash",
        None
    )

    return safe_user


def find_user(
    users,
    user_id
):

    for user in users:

        if str(
            user.get("user_id")
        ) == str(user_id):

            return user

    return None


# ==========================================
# Dataset Helpers
# ==========================================

ALLOWED_DATASET_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json"
}


def get_dataset_folder():

    folder = current_app.config.get(
        "DATASET_UPLOAD_FOLDER"
    )

    if not folder:

        folder = os.path.join(
            current_app.root_path,
            "uploads",
            "datasets"
        )

    os.makedirs(
        folder,
        exist_ok=True
    )

    return folder


def get_dataset_list():

    folder = get_dataset_folder()

    datasets = []

    if not os.path.exists(folder):
        return datasets

    for filename in os.listdir(folder):

        filepath = os.path.join(
            folder,
            filename
        )

        if not os.path.isfile(filepath):
            continue

        if "." not in filename:
            continue

        extension = (
            filename.rsplit(
                ".",
                1
            )[1]
            .lower()
        )

        if extension not in ALLOWED_DATASET_EXTENSIONS:
            continue

        datasets.append({
            "dataset_id": os.path.splitext(
                filename
            )[0],
            "filename": filename,
            "extension": extension,
            "size": os.path.getsize(
                filepath
            ),
            "modified_at": os.path.getmtime(
                filepath
            )
        })

    datasets.sort(
        key=lambda item: item["modified_at"],
        reverse=True
    )

    return datasets


# ==========================================
# ADMIN LOGIN
# ==========================================

@admin_bp.route(
    "/login",
    methods=["POST"]
)
def admin_login():

    data = request.get_json(
        silent=True
    ) or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:

        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    # --------------------------------------
    # Configure admin credentials
    # --------------------------------------

    admin_email = current_app.config.get(
        "ADMIN_EMAIL",
        "admin@velocitybi.com"
    )

    admin_password = current_app.config.get(
        "ADMIN_PASSWORD",
        "admin123"
    )

    if (
        email != admin_email.lower()
        or password != admin_password
    ):

        log_activity(
            "ADMIN_LOGIN_FAILED",
            f"Failed admin login attempt for {email}"
        )

        return jsonify({
            "success": False,
            "message": "Invalid admin credentials"
        }), 401

    log_activity(
        "ADMIN_LOGIN",
        "Administrator logged in"
    )

    return jsonify({
        "success": True,
        "message": "Admin login successful",
        "admin": {
            "id": "admin",
            "name": "Administrator",
            "email": admin_email,
            "role": "admin"
        }
    })


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@admin_bp.route(
    "/dashboard",
    methods=["GET"]
)
def admin_dashboard():

    users = load_json(
        get_users_file(),
        []
    )

    activities = load_json(
        get_activity_file(),
        []
    )

    datasets = get_dataset_list()

    total_users = len(users)

    active_users = len([
        user
        for user in users
        if user.get(
            "status",
            "active"
        ) == "active"
    ])

    blocked_users = len([
        user
        for user in users
        if user.get(
            "status"
        ) == "blocked"
    ])

    admin_users = len([
        user
        for user in users
        if user.get(
            "role"
        ) == "admin"
    ])

    return jsonify({
        "success": True,
        "dashboard": {
            "total_users": total_users,
            "active_users": active_users,
            "blocked_users": blocked_users,
            "admin_users": admin_users,
            "total_datasets": len(datasets),
            "total_activities": len(activities),
            "recent_users": [
                sanitize_user(user)
                for user in users[:5]
            ],
            "recent_activity": activities[:10],
            "recent_datasets": datasets[:10]
        }
    })


# ==========================================
# GET ALL USERS
# ==========================================

@admin_bp.route(
    "/users",
    methods=["GET"]
)
def get_users():

    users = load_json(
        get_users_file(),
        []
    )

    # Search
    search = request.args.get(
        "search",
        ""
    ).strip().lower()

    # Status filter
    status = request.args.get(
        "status",
        ""
    ).strip().lower()

    # Role filter
    role = request.args.get(
        "role",
        ""
    ).strip().lower()

    filtered_users = []

    for user in users:

        if search:

            searchable = " ".join([
                str(user.get("name", "")),
                str(user.get("email", "")),
                str(user.get("user_id", ""))
            ]).lower()

            if search not in searchable:
                continue

        if status:

            if user.get(
                "status",
                "active"
            ).lower() != status:

                continue

        if role:

            if user.get(
                "role",
                "user"
            ).lower() != role:

                continue

        filtered_users.append(
            sanitize_user(user)
        )

    return jsonify({
        "success": True,
        "count": len(filtered_users),
        "users": filtered_users
    })


# ==========================================
# GET SINGLE USER
# ==========================================

@admin_bp.route(
    "/users/<user_id>",
    methods=["GET"]
)
def get_user(user_id):

    users = load_json(
        get_users_file(),
        []
    )

    user = find_user(
        users,
        user_id
    )

    if user is None:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    return jsonify({
        "success": True,
        "user": sanitize_user(user)
    })


# ==========================================
# CREATE USER
# ==========================================

@admin_bp.route(
    "/users",
    methods=["POST"]
)
def create_user():

    data = request.get_json(
        silent=True
    ) or {}

    name = data.get(
        "name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    role = data.get(
        "role",
        "user"
    )

    if not name or not email or not password:

        return jsonify({
            "success": False,
            "message": (
                "Name, email and password "
                "are required"
            )
        }), 400

    users = load_json(
        get_users_file(),
        []
    )

    # Check duplicate email
    for user in users:

        if user.get(
            "email",
            ""
        ).lower() == email:

            return jsonify({
                "success": False,
                "message": "Email already exists"
            }), 409

    user_id = str(uuid.uuid4())

    new_user = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "password": hash_password(
            password
        ),
        "role": role,
        "status": "active",
        "created_at": (
            datetime.utcnow().isoformat()
            + "Z"
        ),
        "updated_at": (
            datetime.utcnow().isoformat()
            + "Z"
        )
    }

    users.append(
        new_user
    )

    save_json(
        get_users_file(),
        users
    )

    log_activity(
        "USER_CREATED",
        f"Created user {email}",
        user_id
    )

    return jsonify({
        "success": True,
        "message": "User created successfully",
        "user": sanitize_user(
            new_user
        )
    }), 201


# ==========================================
# UPDATE USER
# ==========================================

@admin_bp.route(
    "/users/<user_id>",
    methods=["PUT"]
)
def update_user(user_id):

    users = load_json(
        get_users_file(),
        []
    )

    user = find_user(
        users,
        user_id
    )

    if user is None:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    if "name" in data:
        user["name"] = str(
            data["name"]
        ).strip()

    if "email" in data:

        new_email = str(
            data["email"]
        ).strip().lower()

        # Check email duplication
        for existing in users:

            if (
                existing is not user
                and existing.get(
                    "email",
                    ""
                ).lower() == new_email
            ):

                return jsonify({
                    "success": False,
                    "message": "Email already exists"
                }), 409

        user["email"] = new_email

    if "role" in data:

        allowed_roles = {
            "user",
            "admin"
        }

        if data["role"] not in allowed_roles:

            return jsonify({
                "success": False,
                "message": "Invalid role"
            }), 400

        user["role"] = data["role"]

    if "status" in data:

        allowed_statuses = {
            "active",
            "blocked",
            "inactive"
        }

        if data["status"] not in allowed_statuses:

            return jsonify({
                "success": False,
                "message": "Invalid status"
            }), 400

        user["status"] = data["status"]

    if "password" in data:

        password = str(
            data["password"]
        )

        if len(password) < 6:

            return jsonify({
                "success": False,
                "message": (
                    "Password must contain "
                    "at least 6 characters"
                )
            }), 400

        user["password"] = hash_password(
            password
        )

    user["updated_at"] = (
        datetime.utcnow().isoformat()
        + "Z"
    )

    save_json(
        get_users_file(),
        users
    )

    log_activity(
        "USER_UPDATED",
        f"Updated user {user.get('email')}",
        user_id
    )

    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "user": sanitize_user(user)
    })


# ==========================================
# BLOCK USER
# ==========================================

@admin_bp.route(
    "/users/<user_id>/block",
    methods=["POST"]
)
def block_user(user_id):

    users = load_json(
        get_users_file(),
        []
    )

    user = find_user(
        users,
        user_id
    )

    if user is None:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    user["status"] = "blocked"

    user["updated_at"] = (
        datetime.utcnow().isoformat()
        + "Z"
    )

    save_json(
        get_users_file(),
        users
    )

    log_activity(
        "USER_BLOCKED",
        f"Blocked user {user.get('email')}",
        user_id
    )

    return jsonify({
        "success": True,
        "message": "User blocked successfully",
        "user": sanitize_user(user)
    })


# ==========================================
# UNBLOCK USER
# ==========================================

@admin_bp.route(
    "/users/<user_id>/unblock",
    methods=["POST"]
)
def unblock_user(user_id):

    users = load_json(
        get_users_file(),
        []
    )

    user = find_user(
        users,
        user_id
    )

    if user is None:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    user["status"] = "active"

    user["updated_at"] = (
        datetime.utcnow().isoformat()
        + "Z"
    )

    save_json(
        get_users_file(),
        users
    )

    log_activity(
        "USER_UNBLOCKED",
        f"Unblocked user {user.get('email')}",
        user_id
    )

    return jsonify({
        "success": True,
        "message": "User unblocked successfully",
        "user": sanitize_user(user)
    })


# ==========================================
# DELETE USER
# ==========================================

@admin_bp.route(
    "/users/<user_id>",
    methods=["DELETE"]
)
def delete_user(user_id):

    users = load_json(
        get_users_file(),
        []
    )

    user = find_user(
        users,
        user_id
    )

    if user is None:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    users = [
        item
        for item in users
        if str(
            item.get("user_id")
        ) != str(user_id)
    ]

    save_json(
        get_users_file(),
        users
    )

    log_activity(
        "USER_DELETED",
        f"Deleted user {user.get('email')}",
        user_id
    )

    return jsonify({
        "success": True,
        "message": "User deleted successfully",
        "user_id": user_id
    })


# ==========================================
# GET DATASETS
# ==========================================

@admin_bp.route(
    "/datasets",
    methods=["GET"]
)
def admin_datasets():

    datasets = get_dataset_list()

    return jsonify({
        "success": True,
        "count": len(datasets),
        "datasets": datasets
    })


# ==========================================
# DELETE DATASET
# ==========================================

@admin_bp.route(
    "/datasets/<dataset_id>",
    methods=["DELETE"]
)
def delete_dataset(dataset_id):

    folder = get_dataset_folder()

    deleted = False
    deleted_filename = None

    for filename in os.listdir(folder):

        filepath = os.path.join(
            folder,
            filename
        )

        if not os.path.isfile(filepath):
            continue

        file_id = os.path.splitext(
            filename
        )[0]

        if file_id != dataset_id:
            continue

        extension = filename.rsplit(
            ".",
            1
        )[-1].lower()

        if extension not in ALLOWED_DATASET_EXTENSIONS:
            continue

        try:

            os.remove(filepath)

            deleted = True
            deleted_filename = filename

            break

        except Exception as error:

            return jsonify({
                "success": False,
                "message": (
                    "Failed to delete dataset"
                ),
                "error": str(error)
            }), 500

    if not deleted:

        return jsonify({
            "success": False,
            "message": "Dataset not found"
        }), 404

    log_activity(
        "DATASET_DELETED",
        f"Deleted dataset {deleted_filename}"
    )

    return jsonify({
        "success": True,
        "message": "Dataset deleted successfully",
        "dataset_id": dataset_id,
        "filename": deleted_filename
    })


# ==========================================
# ACTIVITY LOG
# ==========================================

@admin_bp.route(
    "/activity",
    methods=["GET"]
)
def get_activity():

    activities = load_json(
        get_activity_file(),
        []
    )

    try:

        limit = int(
            request.args.get(
                "limit",
                50
            )
        )

    except ValueError:

        limit = 50

    limit = max(
        1,
        min(limit, 500)
    )

    action = request.args.get(
        "action",
        ""
    ).strip().lower()

    if action:

        activities = [
            activity
            for activity in activities
            if activity.get(
                "action",
                ""
            ).lower() == action
        ]

    return jsonify({
        "success": True,
        "count": len(activities[:limit]),
        "activities": activities[:limit]
    })


# ==========================================
# DELETE ACTIVITY LOG
# ==========================================

@admin_bp.route(
    "/activity",
    methods=["DELETE"]
)
def clear_activity():

    save_json(
        get_activity_file(),
        []
    )

    log_activity(
        "ACTIVITY_CLEARED",
        "Activity log was cleared"
    )

    return jsonify({
        "success": True,
        "message": "Activity log cleared successfully"
    })


# ==========================================
# SYSTEM STATISTICS
# ==========================================

@admin_bp.route(
    "/statistics",
    methods=["GET"]
)
def system_statistics():

    users = load_json(
        get_users_file(),
        []
    )

    activities = load_json(
        get_activity_file(),
        []
    )

    datasets = get_dataset_list()

    total_dataset_size = sum(
        dataset.get(
            "size",
            0
        )
        for dataset in datasets
    )

    return jsonify({
        "success": True,
        "statistics": {
            "users": {
                "total": len(users),
                "active": len([
                    user
                    for user in users
                    if user.get(
                        "status",
                        "active"
                    ) == "active"
                ]),
                "blocked": len([
                    user
                    for user in users
                    if user.get(
                        "status"
                    ) == "blocked"
                ])
            },
            "datasets": {
                "total": len(datasets),
                "total_size_bytes": total_dataset_size
            },
            "activity": {
                "total": len(activities)
            }
        }
    })


# ==========================================
# SYSTEM HEALTH
# ==========================================

@admin_bp.route(
    "/health",
    methods=["GET"]
)
def admin_health():

    try:

        storage_folder = get_storage_folder()
        dataset_folder = get_dataset_folder()

        storage_exists = os.path.exists(
            storage_folder
        )

        dataset_exists = os.path.exists(
            dataset_folder
        )

        return jsonify({
            "success": True,
            "status": "healthy",
            "service": "Velocity BI Admin API",
            "storage": {
                "admin_storage": storage_exists,
                "dataset_storage": dataset_exists
            },
            "timestamp": (
                datetime.utcnow().isoformat()
                + "Z"
            )
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "status": "unhealthy",
            "service": "Velocity BI Admin API",
            "error": str(error)
        }), 500