"""
==========================================
Velocity BI - Validation Utilities
File: backend/utils/validators.py
==========================================

Reusable validation functions for:
- User registration/login
- Dataset uploads
- Dashboard data
- Reports
- API request data
"""

import re
from typing import Any, Optional


# ==========================================
# Email Validation
# ==========================================

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)


def validate_email(email: Any) -> bool:
    """
    Validate an email address.

    Returns:
        bool: True if valid, otherwise False.
    """
    if not isinstance(email, str):
        return False

    email = email.strip()

    if not email:
        return False

    return bool(EMAIL_REGEX.fullmatch(email))


# ==========================================
# Password Validation
# ==========================================

def validate_password(
    password: Any,
    min_length: int = 8,
    require_uppercase: bool = True,
    require_lowercase: bool = True,
    require_digit: bool = True,
) -> bool:
    """
    Validate password strength.

    Requirements by default:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit

    Returns:
        bool: True if valid, otherwise False.
    """

    if not isinstance(password, str):
        return False

    if len(password) < min_length:
        return False

    if require_uppercase and not re.search(r"[A-Z]", password):
        return False

    if require_lowercase and not re.search(r"[a-z]", password):
        return False

    if require_digit and not re.search(r"\d", password):
        return False

    return True


# ==========================================
# Username Validation
# ==========================================

def validate_username(
    username: Any,
    min_length: int = 3,
    max_length: int = 30,
) -> bool:
    """
    Validate username.

    Allowed:
        - Letters
        - Numbers
        - Underscore

    Example:
        velocity_user
        vikash123
    """

    if not isinstance(username, str):
        return False

    username = username.strip()

    if not (min_length <= len(username) <= max_length):
        return False

    return bool(re.fullmatch(r"[A-Za-z0-9_]+", username))


# ==========================================
# Name Validation
# ==========================================

def validate_name(
    name: Any,
    min_length: int = 2,
    max_length: int = 100,
) -> bool:
    """
    Validate a person's name.
    """

    if not isinstance(name, str):
        return False

    name = name.strip()

    if not (min_length <= len(name) <= max_length):
        return False

    return bool(re.fullmatch(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*", name))


# ==========================================
# Phone Number Validation
# ==========================================

def validate_phone(phone: Any) -> bool:
    """
    Validate an Indian-style 10-digit mobile number.

    Examples:
        9876543210
        +919876543210
        919876543210
    """

    if not isinstance(phone, str):
        return False

    phone = phone.strip()

    # Remove spaces and hyphens
    phone = re.sub(r"[\s-]", "", phone)

    pattern = r"^(?:\+91|91)?[6-9]\d{9}$"

    return bool(re.fullmatch(pattern, phone))


# ==========================================
# Required Field Validation
# ==========================================

def validate_required(
    data: Any,
    fields: list[str],
) -> tuple[bool, list[str]]:
    """
    Check whether required fields are present.

    Args:
        data: Dictionary containing request data.
        fields: List of required field names.

    Returns:
        (is_valid, missing_fields)
    """

    if not isinstance(data, dict):
        return False, fields

    missing_fields = []

    for field in fields:
        value = data.get(field)

        if value is None:
            missing_fields.append(field)
        elif isinstance(value, str) and not value.strip():
            missing_fields.append(field)

    return len(missing_fields) == 0, missing_fields


# ==========================================
# Integer Validation
# ==========================================

def validate_integer(
    value: Any,
    minimum: Optional[int] = None,
    maximum: Optional[int] = None,
) -> bool:
    """
    Validate an integer value.
    """

    if isinstance(value, bool):
        return False

    if not isinstance(value, int):
        return False

    if minimum is not None and value < minimum:
        return False

    if maximum is not None and value > maximum:
        return False

    return True


# ==========================================
# Float / Number Validation
# ==========================================

def validate_number(
    value: Any,
    minimum: Optional[float] = None,
    maximum: Optional[float] = None,
) -> bool:
    """
    Validate an integer or floating-point number.
    """

    if isinstance(value, bool):
        return False

    if not isinstance(value, (int, float)):
        return False

    if minimum is not None and value < minimum:
        return False

    if maximum is not None and value > maximum:
        return False

    return True


# ==========================================
# Dataset File Validation
# ==========================================

ALLOWED_DATASET_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls",
    ".json",
}


def validate_dataset_extension(filename: Any) -> bool:
    """
    Validate dataset file extension.

    Supported:
        CSV
        Excel
        JSON
    """

    if not isinstance(filename, str):
        return False

    filename = filename.strip().lower()

    if "." not in filename:
        return False

    extension = "." + filename.rsplit(".", 1)[1]

    return extension in ALLOWED_DATASET_EXTENSIONS


# ==========================================
# File Size Validation
# ==========================================

def validate_file_size(
    file_size: Any,
    max_size_mb: int = 50,
) -> bool:
    """
    Validate file size.

    Args:
        file_size: File size in bytes.
        max_size_mb: Maximum allowed size in MB.
    """

    if not isinstance(file_size, (int, float)):
        return False

    if file_size < 0:
        return False

    max_size_bytes = max_size_mb * 1024 * 1024

    return file_size <= max_size_bytes


# ==========================================
# Date Validation
# ==========================================

def validate_date_format(
    date_string: Any,
    date_format: str = "%Y-%m-%d",
) -> bool:
    """
    Validate date format.

    Default:
        YYYY-MM-DD

    Example:
        2026-09-20
    """

    if not isinstance(date_string, str):
        return False

    from datetime import datetime

    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False


# ==========================================
# ID Validation
# ==========================================

def validate_id(value: Any) -> bool:
    """
    Validate a positive integer ID.
    """

    return validate_integer(value, minimum=1)


# ==========================================
# URL Validation
# ==========================================

URL_REGEX = re.compile(
    r"^https?://"
    r"(?:[A-Za-z0-9-]+\.)+"
    r"[A-Za-z]{2,}"
    r"(?::\d+)?"
    r"(?:/.*)?$"
)


def validate_url(url: Any) -> bool:
    """
    Validate HTTP/HTTPS URL.
    """

    if not isinstance(url, str):
        return False

    url = url.strip()

    return bool(URL_REGEX.fullmatch(url))


# ==========================================
# Choice Validation
# ==========================================

def validate_choice(
    value: Any,
    choices: list[Any],
) -> bool:
    """
    Check whether a value exists in an allowed list.

    Example:
        validate_choice("admin", ["admin", "user"])
    """

    return value in choices


# ==========================================
# String Length Validation
# ==========================================

def validate_string_length(
    value: Any,
    min_length: int = 1,
    max_length: int = 255,
) -> bool:
    """
    Validate string length.
    """

    if not isinstance(value, str):
        return False

    length = len(value.strip())

    return min_length <= length <= max_length


# ==========================================
# Registration Validation
# ==========================================

def validate_registration_data(data: dict) -> tuple[bool, list[str]]:
    """
    Validate user registration data.

    Expected fields:
        name
        email
        password
    """

    errors = []

    # Required fields
    valid, missing = validate_required(
        data,
        ["name", "email", "password"],
    )

    if not valid:
        errors.extend(
            [f"{field} is required" for field in missing]
        )

    # Name
    if "name" in data and not validate_name(data["name"]):
        errors.append("Invalid name")

    # Email
    if "email" in data and not validate_email(data["email"]):
        errors.append("Invalid email address")

    # Password
    if "password" in data and not validate_password(data["password"]):
        errors.append(
            "Password must contain at least 8 characters, "
            "one uppercase letter, one lowercase letter, "
            "and one digit"
        )

    return len(errors) == 0, errors


# ==========================================
# Login Validation
# ==========================================

def validate_login_data(data: dict) -> tuple[bool, list[str]]:
    """
    Validate login request data.
    """

    errors = []

    valid, missing = validate_required(
        data,
        ["email", "password"],
    )

    if not valid:
        errors.extend(
            [f"{field} is required" for field in missing]
        )

    if "email" in data and not validate_email(data["email"]):
        errors.append("Invalid email address")

    if "password" in data:
        if not isinstance(data["password"], str):
            errors.append("Invalid password")

    return len(errors) == 0, errors


# ==========================================
# Dataset Validation
# ==========================================

def validate_dataset_data(data: dict) -> tuple[bool, list[str]]:
    """
    Validate dataset metadata.
    """

    errors = []

    valid, missing = validate_required(
        data,
        ["name"],
    )

    if not valid:
        errors.extend(
            [f"{field} is required" for field in missing]
        )

    if "name" in data:
        if not validate_string_length(
            data["name"],
            min_length=2,
            max_length=150,
        ):
            errors.append(
                "Dataset name must contain between "
                "2 and 150 characters"
            )

    return len(errors) == 0, errors


# ==========================================
# Sanitize String
# ==========================================

def sanitize_string(value: Any) -> str:
    """
    Basic string cleanup.

    Removes:
        - Leading/trailing spaces
        - Repeated whitespace
    """

    if not isinstance(value, str):
        return ""

    return " ".join(value.strip().split())


# ==========================================
# Exported Functions
# ==========================================

__all__ = [
    "validate_email",
    "validate_password",
    "validate_username",
    "validate_name",
    "validate_phone",
    "validate_required",
    "validate_integer",
    "validate_number",
    "validate_dataset_extension",
    "validate_file_size",
    "validate_date_format",
    "validate_id",
    "validate_url",
    "validate_choice",
    "validate_string_length",
    "validate_registration_data",
    "validate_login_data",
    "validate_dataset_data",
    "sanitize_string",
]