"""
==========================================
Velocity BI - File Handler Utilities
File: backend/utils/file_handler.py
==========================================

Handles:
- Dataset file validation
- Secure filenames
- File saving
- File deletion
- File information
- CSV / Excel / JSON reading
- File size validation
"""

import json
import os
import uuid
from pathlib import Path
from typing import Any, Optional

import pandas as pd
from werkzeug.utils import secure_filename


# ==========================================
# Configuration
# ==========================================

DEFAULT_UPLOAD_FOLDER = os.getenv(
    "UPLOAD_FOLDER",
    "uploads"
)

DEFAULT_MAX_FILE_SIZE_MB = int(
    os.getenv("MAX_FILE_SIZE_MB", "50")
)

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json",
}


# ==========================================
# Directory Helpers
# ==========================================

def ensure_upload_folder(
    upload_folder: str = DEFAULT_UPLOAD_FOLDER
) -> str:
    """
    Create the upload directory if it does not exist.

    Returns:
        str: Absolute upload directory path.
    """

    folder = Path(upload_folder)

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    return str(folder.resolve())


# ==========================================
# Extension Helpers
# ==========================================

def get_file_extension(filename: str) -> str:
    """
    Return file extension without dot.

    Example:
        sales.csv -> csv
    """

    if not filename:
        return ""

    return Path(filename).suffix.lower().lstrip(".")


def is_allowed_file(filename: str) -> bool:
    """
    Check whether a file extension is supported.
    """

    extension = get_file_extension(filename)

    return extension in ALLOWED_EXTENSIONS


# ==========================================
# Filename Helpers
# ==========================================

def sanitize_filename(filename: str) -> str:
    """
    Create a safe filename using Werkzeug.
    """

    if not filename:
        return ""

    return secure_filename(filename)


def generate_unique_filename(
    filename: str
) -> str:
    """
    Generate a unique safe filename.

    Example:
        sales.csv

    Result:
        7f9c..._sales.csv
    """

    safe_name = sanitize_filename(filename)

    if not safe_name:
        safe_name = "dataset"

    unique_id = uuid.uuid4().hex

    return f"{unique_id}_{safe_name}"


# ==========================================
# File Size Helpers
# ==========================================

def get_file_size(file_path: str) -> int:
    """
    Return file size in bytes.
    """

    path = Path(file_path)

    if not path.exists():
        return 0

    return path.stat().st_size


def get_file_size_mb(file_path: str) -> float:
    """
    Return file size in MB.
    """

    size_bytes = get_file_size(file_path)

    return round(
        size_bytes / (1024 * 1024),
        2
    )


def validate_file_size(
    file_path: str,
    max_size_mb: int = DEFAULT_MAX_FILE_SIZE_MB
) -> bool:
    """
    Check whether a file is within the allowed size.
    """

    size_bytes = get_file_size(file_path)

    max_size_bytes = (
        max_size_mb * 1024 * 1024
    )

    return size_bytes <= max_size_bytes


# ==========================================
# File Saving
# ==========================================

def save_uploaded_file(
    file,
    upload_folder: str = DEFAULT_UPLOAD_FOLDER,
    max_size_mb: int = DEFAULT_MAX_FILE_SIZE_MB
) -> dict:
    """
    Save an uploaded Flask file.

    Returns:
        Dictionary containing file information.
    """

    if file is None:
        raise ValueError("No file provided.")

    original_filename = file.filename

    if not original_filename:
        raise ValueError("Filename is empty.")

    if not is_allowed_file(original_filename):
        raise ValueError(
            "Unsupported file type. "
            "Allowed: CSV, XLSX, XLS, JSON."
        )

    upload_folder = ensure_upload_folder(
        upload_folder
    )

    unique_filename = generate_unique_filename(
        original_filename
    )

    file_path = os.path.join(
        upload_folder,
        unique_filename
    )

    file.save(file_path)

    if not validate_file_size(
        file_path,
        max_size_mb
    ):
        delete_file(file_path)

        raise ValueError(
            f"File size cannot exceed "
            f"{max_size_mb} MB."
        )

    return {
        "original_filename": original_filename,
        "filename": unique_filename,
        "path": file_path,
        "extension": get_file_extension(
            original_filename
        ),
        "size_bytes": get_file_size(
            file_path
        ),
        "size_mb": get_file_size_mb(
            file_path
        ),
    }


# ==========================================
# File Deletion
# ==========================================

def delete_file(file_path: str) -> bool:
    """
    Delete a file safely.

    Returns:
        bool: True if deleted, False otherwise.
    """

    try:
        path = Path(file_path)

        if path.exists() and path.is_file():
            path.unlink()
            return True

        return False

    except OSError:
        return False


# ==========================================
# File Existence
# ==========================================

def file_exists(file_path: str) -> bool:
    """
    Check whether a file exists.
    """

    path = Path(file_path)

    return path.exists() and path.is_file()


# ==========================================
# CSV Reader
# ==========================================

def read_csv_file(
    file_path: str
) -> pd.DataFrame:
    """
    Read a CSV dataset into a Pandas DataFrame.
    """

    if not file_exists(file_path):
        raise FileNotFoundError(
            "CSV file not found."
        )

    return pd.read_csv(file_path)


# ==========================================
# Excel Reader
# ==========================================

def read_excel_file(
    file_path: str
) -> pd.DataFrame:
    """
    Read Excel dataset into a DataFrame.
    """

    if not file_exists(file_path):
        raise FileNotFoundError(
            "Excel file not found."
        )

    return pd.read_excel(file_path)


# ==========================================
# JSON Reader
# ==========================================

def read_json_file(
    file_path: str
) -> Any:
    """
    Read a JSON file.

    Returns:
        Parsed JSON data.
    """

    if not file_exists(file_path):
        raise FileNotFoundError(
            "JSON file not found."
        )

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as json_file:
        return json.load(json_file)


# ==========================================
# Generic Dataset Reader
# ==========================================

def read_dataset(
    file_path: str
):
    """
    Automatically detect and read a dataset
    based on its extension.

    Supported:
        CSV
        XLSX
        XLS
        JSON
    """

    extension = get_file_extension(
        file_path
    )

    if extension == "csv":
        return read_csv_file(file_path)

    if extension in {"xlsx", "xls"}:
        return read_excel_file(file_path)

    if extension == "json":
        return read_json_file(file_path)

    raise ValueError(
        f"Unsupported dataset format: "
        f"{extension}"
    )


# ==========================================
# Dataset Information
# ==========================================

def get_dataset_info(
    file_path: str
) -> dict:
    """
    Return basic information about a dataset.
    """

    if not file_exists(file_path):
        raise FileNotFoundError(
            "Dataset file not found."
        )

    extension = get_file_extension(
        file_path
    )

    data = read_dataset(file_path)

    if isinstance(data, pd.DataFrame):
        return {
            "filename": os.path.basename(
                file_path
            ),
            "extension": extension,
            "size_bytes": get_file_size(
                file_path
            ),
            "size_mb": get_file_size_mb(
                file_path
            ),
            "rows": len(data),
            "columns": len(data.columns),
            "column_names": data.columns.tolist(),
        }

    if isinstance(data, list):
        return {
            "filename": os.path.basename(
                file_path
            ),
            "extension": extension,
            "size_bytes": get_file_size(
                file_path
            ),
            "size_mb": get_file_size_mb(
                file_path
            ),
            "records": len(data),
        }

    if isinstance(data, dict):
        return {
            "filename": os.path.basename(
                file_path
            ),
            "extension": extension,
            "size_bytes": get_file_size(
                file_path
            ),
            "size_mb": get_file_size_mb(
                file_path
            ),
            "keys": list(data.keys()),
        }

    return {
        "filename": os.path.basename(
            file_path
        ),
        "extension": extension,
        "size_bytes": get_file_size(
            file_path
        ),
        "size_mb": get_file_size_mb(
            file_path
        ),
    }


# ==========================================
# Dataset Preview
# ==========================================

def preview_dataset(
    file_path: str,
    rows: int = 10
) -> dict:
    """
    Return a preview of a dataset.

    Used by:
        dataset-preview.html
    """

    if rows < 1:
        rows = 10

    data = read_dataset(file_path)

    if not isinstance(data, pd.DataFrame):
        return {
            "columns": [],
            "rows": [],
            "total_rows": 0,
        }

    preview = data.head(rows)

    # Replace NaN values with None
    preview = preview.astype(
        object
    ).where(
        pd.notna(preview),
        None
    )

    return {
        "columns": preview.columns.tolist(),
        "rows": preview.to_dict(
            orient="records"
        ),
        "total_rows": len(data),
    }


# ==========================================
# Dataset Statistics
# ==========================================

def get_dataset_statistics(
    file_path: str
) -> dict:
    """
    Generate basic dataset statistics.
    """

    data = read_dataset(file_path)

    if not isinstance(data, pd.DataFrame):
        return {}

    numeric_data = data.select_dtypes(
        include="number"
    )

    statistics = {
        "rows": len(data),
        "columns": len(data.columns),
        "missing_values": int(
            data.isnull().sum().sum()
        ),
        "duplicate_rows": int(
            data.duplicated().sum()
        ),
        "numeric_columns": (
            numeric_data.columns.tolist()
        ),
        "categorical_columns": (
            data.select_dtypes(
                include=["object", "category"]
            ).columns.tolist()
        ),
    }

    return statistics


# ==========================================
# File Metadata
# ==========================================

def get_file_metadata(
    file_path: str
) -> dict:
    """
    Return basic file metadata.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            "File not found."
        )

    return {
        "filename": path.name,
        "extension": get_file_extension(
            path.name
        ),
        "absolute_path": str(
            path.resolve()
        ),
        "size_bytes": get_file_size(
            str(path)
        ),
        "size_mb": get_file_size_mb(
            str(path)
        ),
        "is_file": path.is_file(),
    }


# ==========================================
# Exported Functions
# ==========================================

__all__ = [
    "ensure_upload_folder",
    "get_file_extension",
    "is_allowed_file",
    "sanitize_filename",
    "generate_unique_filename",
    "get_file_size",
    "get_file_size_mb",
    "validate_file_size",
    "save_uploaded_file",
    "delete_file",
    "file_exists",
    "read_csv_file",
    "read_excel_file",
    "read_json_file",
    "read_dataset",
    "get_dataset_info",
    "preview_dataset",
    "get_dataset_statistics",
    "get_file_metadata",
]