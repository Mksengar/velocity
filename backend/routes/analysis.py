# ==========================================
# Velocity BI - Analysis Routes
# File: backend/routes/analysis.py
# ==========================================

import os
import numpy as np
import pandas as pd

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request


# -------------------------------------------------
# Blueprint
# -------------------------------------------------

analysis_bp = Blueprint(
    "analysis",
    __name__,
    url_prefix="/api/analysis"
)


@analysis_bp.before_request
def require_analysis_authentication():
    verify_jwt_in_request()


# -------------------------------------------------
# Helper Functions
# -------------------------------------------------

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json"
}


def allowed_file(filename):
    """Check supported dataset format."""

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def get_upload_folder():
    """Return dataset upload folder."""

    folder = os.path.join(
        current_app.root_path,
        "uploads",
        "datasets"
    )

    os.makedirs(folder, exist_ok=True)

    return folder


def find_dataset(dataset_id):
    """Find uploaded dataset by ID."""

    folder = get_upload_folder()

    if not os.path.exists(folder):
        return None

    for filename in os.listdir(folder):

        if not allowed_file(filename):
            continue

        file_id = filename.rsplit(".", 1)[0]

        if file_id == dataset_id:

            return os.path.join(
                folder,
                filename
            )

    return None


def load_dataset(filepath):
    """Load dataset using its extension."""

    extension = filepath.rsplit(".", 1)[1].lower()

    if extension == "csv":
        return pd.read_csv(filepath)

    if extension in ["xlsx", "xls"]:
        return pd.read_excel(filepath)

    if extension == "json":
        return pd.read_json(filepath)

    raise ValueError("Unsupported dataset format")


def clean_value(value):
    """Convert NumPy/Pandas values into JSON-safe values."""

    if pd.isna(value):
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        return float(value)

    if isinstance(value, (np.bool_,)):
        return bool(value)

    return value


def dataframe_to_dict(df):
    """Convert DataFrame to JSON-safe dictionary."""

    result = {}

    for column in df.columns:

        result[str(column)] = [
            clean_value(value)
            for value in df[column].tolist()
        ]

    return result


# =================================================
# BASIC DATASET ANALYSIS
# =================================================

@analysis_bp.route(
    "/<dataset_id>",
    methods=["GET"]
)
def analyze_dataset(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        numeric_columns = df.select_dtypes(
            include=np.number
        ).columns.tolist()

        categorical_columns = df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()

        missing_values = {}

        for column in df.columns:

            missing_values[str(column)] = int(
                df[column].isnull().sum()
            )

        duplicate_rows = int(
            df.duplicated().sum()
        )

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,

            "overview": {
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
                "numeric_columns": len(numeric_columns),
                "categorical_columns": len(categorical_columns),
                "duplicate_rows": duplicate_rows,
                "total_missing_values": int(
                    df.isnull().sum().sum()
                )
            },

            "numeric_columns": [
                str(column)
                for column in numeric_columns
            ],

            "categorical_columns": [
                str(column)
                for column in categorical_columns
            ],

            "missing_values": missing_values

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Dataset analysis failed",
            "error": str(e)
        }), 500


# =================================================
# DESCRIPTIVE STATISTICS
# =================================================

@analysis_bp.route(
    "/<dataset_id>/descriptive",
    methods=["GET"]
)
def descriptive_statistics(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        numeric_df = df.select_dtypes(
            include=np.number
        )

        if numeric_df.empty:

            return jsonify({
                "success": True,
                "dataset_id": dataset_id,
                "statistics": {}
            }), 200

        statistics = (
            numeric_df
            .describe()
            .transpose()
        )

        result = {}

        for column, row in statistics.iterrows():

            result[str(column)] = {
                "count": clean_value(row.get("count")),
                "mean": clean_value(row.get("mean")),
                "std": clean_value(row.get("std")),
                "min": clean_value(row.get("min")),
                "25%": clean_value(row.get("25%")),
                "50%": clean_value(row.get("50%")),
                "75%": clean_value(row.get("75%")),
                "max": clean_value(row.get("max"))
            }

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "statistics": result
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to calculate descriptive statistics",
            "error": str(e)
        }), 500


# =================================================
# CORRELATION ANALYSIS
# =================================================

@analysis_bp.route(
    "/<dataset_id>/correlation",
    methods=["GET"]
)
def correlation_analysis(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        numeric_df = df.select_dtypes(
            include=np.number
        )

        if numeric_df.shape[1] < 2:

            return jsonify({
                "success": True,
                "dataset_id": dataset_id,
                "message": "At least two numeric columns are required",
                "correlation": {}
            }), 200

        correlation = numeric_df.corr(
            method="pearson"
        )

        correlation_data = dataframe_to_dict(
            correlation
        )

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "method": "pearson",
            "columns": [
                str(column)
                for column in numeric_df.columns
            ],
            "correlation": correlation_data
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Correlation analysis failed",
            "error": str(e)
        }), 500


# =================================================
# MISSING VALUE ANALYSIS
# =================================================

@analysis_bp.route(
    "/<dataset_id>/missing-values",
    methods=["GET"]
)
def missing_value_analysis(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        result = {}

        total_rows = len(df)

        for column in df.columns:

            missing_count = int(
                df[column].isnull().sum()
            )

            percentage = 0

            if total_rows > 0:
                percentage = (
                    missing_count /
                    total_rows
                ) * 100

            result[str(column)] = {
                "missing_count": missing_count,
                "missing_percentage": round(
                    percentage,
                    2
                ),
                "available_count": int(
                    total_rows - missing_count
                )
            }

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "total_rows": total_rows,
            "missing_values": result
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Missing value analysis failed",
            "error": str(e)
        }), 500


# =================================================
# UNIQUE VALUE ANALYSIS
# =================================================

@analysis_bp.route(
    "/<dataset_id>/unique-values",
    methods=["GET"]
)
def unique_value_analysis(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        result = {}

        for column in df.columns:

            result[str(column)] = {
                "unique_count": int(
                    df[column].nunique()
                ),
                "null_count": int(
                    df[column].isnull().sum()
                )
            }

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "columns": result
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unique value analysis failed",
            "error": str(e)
        }), 500


# =================================================
# COLUMN DISTRIBUTION
# =================================================

@analysis_bp.route(
    "/<dataset_id>/distribution/<column_name>",
    methods=["GET"]
)
def column_distribution(
    dataset_id,
    column_name
):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        if column_name not in df.columns:

            return jsonify({
                "success": False,
                "message": f"Column '{column_name}' not found"
            }), 404

        column = df[column_name]

        # Numeric distribution
        if pd.api.types.is_numeric_dtype(column):

            values = column.dropna()

            histogram, bin_edges = np.histogram(
                values,
                bins=10
            )

            distribution = []

            for index in range(len(histogram)):

                distribution.append({
                    "bin_start": clean_value(
                        bin_edges[index]
                    ),
                    "bin_end": clean_value(
                        bin_edges[index + 1]
                    ),
                    "count": int(
                        histogram[index]
                    )
                })

            return jsonify({
                "success": True,
                "dataset_id": dataset_id,
                "column": column_name,
                "type": "numeric",
                "distribution": distribution
            }), 200

        # Categorical distribution
        value_counts = (
            column
            .fillna("Missing")
            .astype(str)
            .value_counts()
            .head(50)
        )

        distribution = []

        for value, count in value_counts.items():

            distribution.append({
                "value": value,
                "count": int(count)
            })

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "column": column_name,
            "type": "categorical",
            "distribution": distribution
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Distribution analysis failed",
            "error": str(e)
        }), 500


# =================================================
# OUTLIER ANALYSIS
# =================================================

@analysis_bp.route(
    "/<dataset_id>/outliers/<column_name>",
    methods=["GET"]
)
def outlier_analysis(
    dataset_id,
    column_name
):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        if column_name not in df.columns:

            return jsonify({
                "success": False,
                "message": f"Column '{column_name}' not found"
            }), 404

        column = df[column_name]

        if not pd.api.types.is_numeric_dtype(column):

            return jsonify({
                "success": False,
                "message": "Outlier analysis requires a numeric column"
            }), 400

        values = column.dropna()

        if values.empty:

            return jsonify({
                "success": True,
                "dataset_id": dataset_id,
                "column": column_name,
                "outlier_count": 0,
                "outliers": []
            }), 200

        q1 = values.quantile(0.25)
        q3 = values.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outliers = values[
            (values < lower_bound) |
            (values > upper_bound)
        ]

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "column": column_name,

            "q1": clean_value(q1),
            "q3": clean_value(q3),
            "iqr": clean_value(iqr),

            "lower_bound": clean_value(
                lower_bound
            ),

            "upper_bound": clean_value(
                upper_bound
            ),

            "outlier_count": int(
                len(outliers)
            ),

            "outliers": [
                clean_value(value)
                for value in outliers.tolist()
            ]
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Outlier analysis failed",
            "error": str(e)
        }), 500


# =================================================
# EDA SUMMARY
# =================================================

@analysis_bp.route(
    "/<dataset_id>/eda",
    methods=["GET"]
)
def eda_summary(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        numeric_df = df.select_dtypes(
            include=np.number
        )

        categorical_df = df.select_dtypes(
            include=["object", "category", "bool"]
        )

        missing_total = int(
            df.isnull().sum().sum()
        )

        duplicate_total = int(
            df.duplicated().sum()
        )

        numeric_summary = {}

        for column in numeric_df.columns:

            series = numeric_df[column]

            numeric_summary[str(column)] = {
                "mean": clean_value(series.mean()),
                "median": clean_value(series.median()),
                "min": clean_value(series.min()),
                "max": clean_value(series.max()),
                "std": clean_value(series.std())
            }

        categorical_summary = {}

        for column in categorical_df.columns:

            counts = (
                categorical_df[column]
                .fillna("Missing")
                .astype(str)
                .value_counts()
                .head(10)
            )

            categorical_summary[str(column)] = {
                str(key): int(value)
                for key, value in counts.items()
            }

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,

            "overview": {
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
                "missing_values": missing_total,
                "duplicate_rows": duplicate_total,
                "numeric_columns": int(
                    len(numeric_df.columns)
                ),
                "categorical_columns": int(
                    len(categorical_df.columns)
                )
            },

            "numeric_summary": numeric_summary,

            "categorical_summary": categorical_summary,

            "columns": [
                {
                    "name": str(column),
                    "data_type": str(df[column].dtype),
                    "missing": int(
                        df[column].isnull().sum()
                    ),
                    "unique": int(
                        df[column].nunique()
                    )
                }
                for column in df.columns
            ]

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "EDA analysis failed",
            "error": str(e)
        }), 500
