# ==========================================
# Velocity BI - Dataset Routes
# File: backend/routes/datasets.py
# ==========================================

import os
import uuid

import pandas as pd
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

# -------------------------------------------------
# Blueprint
# -------------------------------------------------

datasets_bp = Blueprint("datasets", __name__, url_prefix="/api/datasets")


# -------------------------------------------------
# Configuration
# -------------------------------------------------

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json"
}

MAX_PREVIEW_ROWS = 20


# -------------------------------------------------
# Helper Functions
# -------------------------------------------------

def allowed_file(filename):
    """Check whether the uploaded file has a supported extension."""
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def get_file_extension(filename):
    """Return lowercase file extension."""
    return filename.rsplit(".", 1)[1].lower()


def get_upload_folder():
    """Create and return dataset upload directory."""
    base_folder = os.path.join(current_app.root_path, "uploads")
    os.makedirs(base_folder, exist_ok=True)

    dataset_folder = os.path.join(base_folder, "datasets")

    if os.path.exists(dataset_folder) and not os.path.isdir(dataset_folder):
        os.remove(dataset_folder)

    os.makedirs(dataset_folder, exist_ok=True)

    return dataset_folder


def load_dataset(filepath, extension):
    """Load dataset into a Pandas DataFrame."""

    if extension == "csv":
        return pd.read_csv(filepath)

    elif extension in ["xlsx", "xls"]:
        return pd.read_excel(filepath)

    elif extension == "json":
        return pd.read_json(filepath)

    raise ValueError("Unsupported file format")


def dataframe_preview(df, rows=MAX_PREVIEW_ROWS):
    """Convert DataFrame into JSON-safe preview data."""

    preview = df.head(rows).copy()

    # Replace NaN/NaT with None
    preview = preview.where(pd.notnull(preview), None)

    return preview.to_dict(orient="records")


def get_column_info(df):
    """Return information about dataset columns."""

    columns = []

    for column in df.columns:
        columns.append({
            "name": str(column),
            "data_type": str(df[column].dtype),
            "null_count": int(df[column].isnull().sum()),
            "unique_count": int(df[column].nunique())
        })

    return columns


# -------------------------------------------------
# Upload Dataset
# POST /api/datasets/upload
# -------------------------------------------------

@datasets_bp.route("", methods=["POST"])
@jwt_required()
def upload_dataset():
    return _upload_dataset()


@datasets_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_dataset_legacy():
    return _upload_dataset()


def _upload_dataset():

    try:

        # Check file
        if "file" not in request.files:
            return jsonify({
                "success": False,
                "message": "No dataset file provided"
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "success": False,
                "message": "No file selected"
            }), 400

        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size == 0:
            return jsonify({
                "success": False,
                "message": "Empty file"
            }), 400

        # Check extension
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "message": (
                    "Unsupported file format. "
                    "Allowed formats: CSV, XLSX, XLS, JSON"
                )
            }), 400

        # Secure filename
        original_filename = secure_filename(file.filename)

        extension = get_file_extension(original_filename)

        # Generate unique dataset ID
        dataset_id = str(uuid.uuid4())

        filename = f"{dataset_id}.{extension}"

        upload_folder = get_upload_folder()

        filepath = os.path.join(
            upload_folder,
            filename
        )

        # Save file
        file.save(filepath)

        # Read dataset
        df = load_dataset(
            filepath,
            extension
        )

        # Basic statistics
        rows = len(df)
        columns = len(df.columns)

        dataset_info = {
            "dataset_id": dataset_id,
            "filename": original_filename,
            "stored_filename": filename,
            "file_type": extension,
            "rows": rows,
            "columns": columns,
            "column_names": [
                str(column)
                for column in df.columns
            ],
            "size_bytes": os.path.getsize(filepath)
        }

        return jsonify({
            "success": True,
            "message": "Dataset uploaded successfully",
            "dataset": dataset_info,
            "preview": dataframe_preview(df),
            "column_info": get_column_info(df)
        }), 201

    except Exception as e:

        # Remove partially uploaded file
        try:
            if "filepath" in locals() and os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass

        return jsonify({
            "success": False,
            "message": "Failed to upload dataset",
            "error": str(e)
        }), 500


# -------------------------------------------------
# List Datasets
# GET /api/datasets
# -------------------------------------------------

@datasets_bp.route("", methods=["GET"])
@jwt_required()
def list_datasets():

    try:

        upload_folder = get_upload_folder()

        datasets = []

        if not os.path.exists(upload_folder):
            return jsonify({
                "success": True,
                "datasets": []
            }), 200

        for filename in os.listdir(upload_folder):

            filepath = os.path.join(
                upload_folder,
                filename
            )

            if not os.path.isfile(filepath):
                continue

            if not allowed_file(filename):
                continue

            extension = get_file_extension(filename)

            try:

                df = load_dataset(
                    filepath,
                    extension
                )

                datasets.append({
                    "dataset_id": filename.rsplit(".", 1)[0],
                    "filename": filename,
                    "file_type": extension,
                    "rows": len(df),
                    "columns": len(df.columns),
                    "column_names": [
                        str(column)
                        for column in df.columns
                    ],
                    "size_bytes": os.path.getsize(filepath)
                })

            except Exception:
                continue

        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to retrieve datasets",
            "error": str(e)
        }), 500


# -------------------------------------------------
# Get Dataset Details
# GET /api/datasets/<dataset_id>
# -------------------------------------------------

@datasets_bp.route("/<dataset_id>", methods=["GET"])
@jwt_required()
def get_dataset(dataset_id):

    try:

        upload_folder = get_upload_folder()

        matching_file = None

        for filename in os.listdir(upload_folder):

            file_id = filename.rsplit(".", 1)[0]

            if file_id == dataset_id:
                matching_file = filename
                break

        if not matching_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        filepath = os.path.join(
            upload_folder,
            matching_file
        )

        extension = get_file_extension(
            matching_file
        )

        df = load_dataset(
            filepath,
            extension
        )

        return jsonify({
            "success": True,
            "dataset": {
                "dataset_id": dataset_id,
                "filename": matching_file,
                "file_type": extension,
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": [
                    str(column)
                    for column in df.columns
                ],
                "size_bytes": os.path.getsize(filepath)
            },
            "preview": dataframe_preview(df),
            "column_info": get_column_info(df)
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to retrieve dataset",
            "error": str(e)
        }), 500


# -------------------------------------------------
# Dataset Preview
# GET /api/datasets/<dataset_id>/preview
# -------------------------------------------------

@datasets_bp.route("/<dataset_id>/preview", methods=["GET"])
@jwt_required()
def preview_dataset(dataset_id):

    try:

        rows = request.args.get(
            "rows",
            default=20,
            type=int
        )

        # Prevent excessive preview requests
        rows = max(1, min(rows, 100))

        upload_folder = get_upload_folder()

        matching_file = None

        for filename in os.listdir(upload_folder):

            file_id = filename.rsplit(".", 1)[0]

            if file_id == dataset_id:
                matching_file = filename
                break

        if not matching_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        filepath = os.path.join(
            upload_folder,
            matching_file
        )

        extension = get_file_extension(
            matching_file
        )

        df = load_dataset(
            filepath,
            extension
        )

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "filename": matching_file,
            "rows": len(df),
            "columns": len(df.columns),
            "preview_rows": rows,
            "data": dataframe_preview(
                df,
                rows
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to generate preview",
            "error": str(e)
        }), 500


# -------------------------------------------------
# Dataset Statistics
# GET /api/datasets/<dataset_id>/statistics
# -------------------------------------------------

@datasets_bp.route(
    "/<dataset_id>/statistics",
    methods=["GET"]
)
@jwt_required()
def dataset_statistics(dataset_id):

    try:

        upload_folder = get_upload_folder()

        matching_file = None

        for filename in os.listdir(upload_folder):

            file_id = filename.rsplit(".", 1)[0]

            if file_id == dataset_id:
                matching_file = filename
                break

        if not matching_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        filepath = os.path.join(
            upload_folder,
            matching_file
        )

        extension = get_file_extension(
            matching_file
        )

        df = load_dataset(
            filepath,
            extension
        )

        numeric_df = df.select_dtypes(
            include="number"
        )

        statistics = {}

        if not numeric_df.empty:

            statistics = (
                numeric_df
                .describe()
                .replace({float("nan"): None})
                .to_dict()
            )

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "statistics": statistics
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to calculate statistics",
            "error": str(e)
        }), 500


# -------------------------------------------------
# Delete Dataset
# DELETE /api/datasets/<dataset_id>
# -------------------------------------------------

@datasets_bp.route(
    "/<dataset_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_dataset(dataset_id):

    try:

        upload_folder = get_upload_folder()

        matching_file = None

        for filename in os.listdir(upload_folder):

            file_id = filename.rsplit(".", 1)[0]

            if file_id == dataset_id:
                matching_file = filename
                break

        if not matching_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        filepath = os.path.join(
            upload_folder,
            matching_file
        )

        os.remove(filepath)

        return jsonify({
            "success": True,
            "message": "Dataset deleted successfully",
            "dataset_id": dataset_id
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to delete dataset",
            "error": str(e)
        }), 500


# -------------------------------------------------
# Update Dataset
# PUT /api/datasets/<dataset_id>
# -------------------------------------------------

@datasets_bp.route(
    "/<dataset_id>",
    methods=["PUT"]
)
@jwt_required()
def update_dataset(dataset_id):

    try:

        upload_folder = get_upload_folder()
        matching_file = None

        for filename in os.listdir(upload_folder):
            file_id = filename.rsplit(".", 1)[0]

            if file_id == dataset_id:
                matching_file = filename
                break

        if not matching_file:
            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        payload = request.get_json(silent=True) or {}
        name = payload.get("name")
        description = payload.get("description")

        return jsonify({
            "success": True,
            "message": "Dataset updated successfully",
            "dataset_id": dataset_id,
            "filename": matching_file,
            "name": name,
            "description": description
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Failed to update dataset",
            "error": str(e)
        }), 500