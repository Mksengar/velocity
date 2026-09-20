
# ==========================================
# Velocity BI - Dashboard Routes
# File: backend/routes/dashboard.py
# ==========================================

import os
import numpy as np
import pandas as pd

from flask import Blueprint, jsonify, current_app


# -------------------------------------------------
# Blueprint
# -------------------------------------------------

dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


# -------------------------------------------------
# Supported file formats
# -------------------------------------------------

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json"
}


# -------------------------------------------------
# Helper Functions
# -------------------------------------------------

def allowed_file(filename):
    """Check whether a file has a supported extension."""

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def get_upload_folder():
    """Return the dataset upload directory."""

    folder = os.path.join(
        current_app.root_path,
        "uploads",
        "datasets"
    )

    os.makedirs(folder, exist_ok=True)

    return folder


def load_dataset(filepath):
    """Load a dataset based on its extension."""

    extension = filepath.rsplit(".", 1)[1].lower()

    if extension == "csv":
        return pd.read_csv(filepath)

    if extension in ["xlsx", "xls"]:
        return pd.read_excel(filepath)

    if extension == "json":
        return pd.read_json(filepath)

    raise ValueError("Unsupported dataset format")


def clean_value(value):
    """Convert Pandas/NumPy values to JSON-safe values."""

    if pd.isna(value):
        return None

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    return value


def get_dataset_files():
    """Return all uploaded dataset files."""

    folder = get_upload_folder()

    if not os.path.exists(folder):
        return []

    files = []

    for filename in os.listdir(folder):

        if not allowed_file(filename):
            continue

        filepath = os.path.join(
            folder,
            filename
        )

        if os.path.isfile(filepath):
            files.append(filepath)

    return files


def get_dataset_id(filepath):
    """Get dataset ID from filename."""

    filename = os.path.basename(filepath)

    return filename.rsplit(".", 1)[0]


# =================================================
# DASHBOARD OVERVIEW
# =================================================

@dashboard_bp.route(
    "/overview",
    methods=["GET"]
)
def dashboard_overview():

    try:

        files = get_dataset_files()

        total_datasets = len(files)

        total_rows = 0
        total_columns = 0
        total_missing_values = 0
        total_duplicates = 0

        numeric_columns = 0
        categorical_columns = 0

        dataset_summaries = []

        for filepath in files:

            try:

                df = load_dataset(filepath)

                rows = int(df.shape[0])
                columns = int(df.shape[1])

                total_rows += rows
                total_columns += columns

                total_missing_values += int(
                    df.isnull().sum().sum()
                )

                total_duplicates += int(
                    df.duplicated().sum()
                )

                numeric_count = len(
                    df.select_dtypes(
                        include=np.number
                    ).columns
                )

                categorical_count = len(
                    df.select_dtypes(
                        include=[
                            "object",
                            "category",
                            "bool"
                        ]
                    ).columns
                )

                numeric_columns += numeric_count
                categorical_columns += categorical_count

                dataset_summaries.append({
                    "dataset_id": get_dataset_id(
                        filepath
                    ),
                    "filename": os.path.basename(
                        filepath
                    ),
                    "rows": rows,
                    "columns": columns,
                    "numeric_columns": numeric_count,
                    "categorical_columns": categorical_count,
                    "missing_values": int(
                        df.isnull().sum().sum()
                    ),
                    "duplicates": int(
                        df.duplicated().sum()
                    ),
                    "size_bytes": os.path.getsize(
                        filepath
                    )
                })

            except Exception:
                continue

        return jsonify({
            "success": True,

            "kpis": {
                "total_datasets": total_datasets,
                "total_rows": total_rows,
                "total_columns": total_columns,
                "total_missing_values": total_missing_values,
                "total_duplicates": total_duplicates,
                "numeric_columns": numeric_columns,
                "categorical_columns": categorical_columns
            },

            "datasets": dataset_summaries

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to load dashboard overview",
            "error": str(e)
        }), 500


# =================================================
# DASHBOARD DATASETS
# =================================================

@dashboard_bp.route(
    "/datasets",
    methods=["GET"]
)
def dashboard_datasets():

    try:

        files = get_dataset_files()

        datasets = []

        for filepath in files:

            try:

                df = load_dataset(filepath)

                datasets.append({
                    "dataset_id": get_dataset_id(
                        filepath
                    ),

                    "filename": os.path.basename(
                        filepath
                    ),

                    "file_type": filepath.rsplit(
                        ".",
                        1
                    )[1].lower(),

                    "rows": int(
                        df.shape[0]
                    ),

                    "columns": int(
                        df.shape[1]
                    ),

                    "size_bytes": os.path.getsize(
                        filepath
                    ),

                    "missing_values": int(
                        df.isnull().sum().sum()
                    ),

                    "updated_at": os.path.getmtime(
                        filepath
                    )
                })

            except Exception:
                continue

        # Newest files first
        datasets.sort(
            key=lambda item: item["updated_at"],
            reverse=True
        )

        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to retrieve dashboard datasets",
            "error": str(e)
        }), 500


# =================================================
# DATASET SUMMARY
# =================================================

@dashboard_bp.route(
    "/dataset/<dataset_id>",
    methods=["GET"]
)
def dataset_summary(dataset_id):

    try:

        files = get_dataset_files()

        target_file = None

        for filepath in files:

            if get_dataset_id(filepath) == dataset_id:
                target_file = filepath
                break

        if not target_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(target_file)

        numeric_df = df.select_dtypes(
            include=np.number
        )

        categorical_df = df.select_dtypes(
            include=[
                "object",
                "category",
                "bool"
            ]
        )

        numeric_summary = {}

        for column in numeric_df.columns:

            series = numeric_df[column]

            numeric_summary[str(column)] = {
                "mean": clean_value(
                    series.mean()
                ),
                "median": clean_value(
                    series.median()
                ),
                "minimum": clean_value(
                    series.min()
                ),
                "maximum": clean_value(
                    series.max()
                ),
                "standard_deviation": clean_value(
                    series.std()
                )
            }

        categorical_summary = {}

        for column in categorical_df.columns:

            value_counts = (
                categorical_df[column]
                .fillna("Missing")
                .astype(str)
                .value_counts()
                .head(10)
            )

            categorical_summary[str(column)] = {
                str(key): int(value)
                for key, value
                in value_counts.items()
            }

        return jsonify({
            "success": True,

            "dataset": {
                "dataset_id": dataset_id,
                "filename": os.path.basename(
                    target_file
                ),
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
                "size_bytes": os.path.getsize(
                    target_file
                )
            },

            "data_quality": {
                "missing_values": int(
                    df.isnull().sum().sum()
                ),
                "duplicate_rows": int(
                    df.duplicated().sum()
                ),
                "complete_rows": int(
                    len(df.dropna())
                )
            },

            "numeric_summary": numeric_summary,

            "categorical_summary": categorical_summary

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to generate dataset summary",
            "error": str(e)
        }), 500


# =================================================
# KPI DATA
# =================================================

@dashboard_bp.route(
    "/kpis/<dataset_id>",
    methods=["GET"]
)
def dataset_kpis(dataset_id):

    try:

        files = get_dataset_files()

        target_file = None

        for filepath in files:

            if get_dataset_id(filepath) == dataset_id:
                target_file = filepath
                break

        if not target_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(target_file)

        numeric_df = df.select_dtypes(
            include=np.number
        )

        kpis = {
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "missing_values": int(
                df.isnull().sum().sum()
            ),
            "duplicate_rows": int(
                df.duplicated().sum()
            ),
            "numeric_columns": int(
                len(numeric_df.columns)
            )
        }

        # Generate useful numeric KPIs
        for column in numeric_df.columns:

            series = numeric_df[column].dropna()

            if series.empty:
                continue

            safe_name = (
                str(column)
                .lower()
                .replace(" ", "_")
            )

            kpis[
                f"{safe_name}_sum"
            ] = clean_value(
                series.sum()
            )

            kpis[
                f"{safe_name}_average"
            ] = clean_value(
                series.mean()
            )

            kpis[
                f"{safe_name}_maximum"
            ] = clean_value(
                series.max()
            )

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "kpis": kpis
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to calculate KPIs",
            "error": str(e)
        }), 500


# =================================================
# DASHBOARD CHART DATA
# =================================================

@dashboard_bp.route(
    "/chart/<dataset_id>",
    methods=["GET"]
)
def dashboard_chart(dataset_id):

    try:

        chart_type = request.args.get(
            "type",
            "bar"
        )

        x_column = request.args.get("x")
        y_column = request.args.get("y")

        files = get_dataset_files()

        target_file = None

        for filepath in files:

            if get_dataset_id(filepath) == dataset_id:
                target_file = filepath
                break

        if not target_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(target_file)

        # -----------------------------------------
        # BAR CHART
        # -----------------------------------------

        if chart_type == "bar":

            if not x_column or not y_column:

                return jsonify({
                    "success": False,
                    "message": "x and y columns are required"
                }), 400

            if x_column not in df.columns:
                return jsonify({
                    "success": False,
                    "message": f"Column '{x_column}' not found"
                }), 404

            if y_column not in df.columns:
                return jsonify({
                    "success": False,
                    "message": f"Column '{y_column}' not found"
                }), 404

            result = (
                df.groupby(x_column)[y_column]
                .sum()
                .reset_index()
            )

            result.columns = [
                "x",
                "y"
            ]

        # -----------------------------------------
        # LINE CHART
        # -----------------------------------------

        elif chart_type == "line":

            if not x_column or not y_column:

                return jsonify({
                    "success": False,
                    "message": "x and y columns are required"
                }), 400

            result = df[
                [x_column, y_column]
            ].dropna()

            result = result.sort_values(
                by=x_column
            )

            result.columns = [
                "x",
                "y"
            ]

        # -----------------------------------------
        # SCATTER CHART
        # -----------------------------------------

        elif chart_type == "scatter":

            if not x_column or not y_column:

                return jsonify({
                    "success": False,
                    "message": "x and y columns are required"
                }), 400

            result = df[
                [x_column, y_column]
            ].dropna()

            result.columns = [
                "x",
                "y"
            ]

        # -----------------------------------------
        # PIE CHART
        # -----------------------------------------

        elif chart_type == "pie":

            if not x_column or not y_column:

                return jsonify({
                    "success": False,
                    "message": "x and y columns are required"
                }), 400

            result = (
                df.groupby(x_column)[y_column]
                .sum()
                .reset_index()
            )

            result.columns = [
                "name",
                "value"
            ]

        else:

            return jsonify({
                "success": False,
                "message": (
                    "Unsupported chart type. "
                    "Use bar, line, scatter or pie."
                )
            }), 400

        records = []

        for record in result.to_dict(
            orient="records"
        ):

            cleaned = {}

            for key, value in record.items():

                cleaned[key] = clean_value(value)

            records.append(cleaned)

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "chart_type": chart_type,
            "data": records
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to generate chart data",
            "error": str(e)
        }), 500


# =================================================
# DATA QUALITY
# =================================================

@dashboard_bp.route(
    "/quality/<dataset_id>",
    methods=["GET"]
)
def data_quality(dataset_id):

    try:

        files = get_dataset_files()

        target_file = None

        for filepath in files:

            if get_dataset_id(filepath) == dataset_id:
                target_file = filepath
                break

        if not target_file:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(target_file)

        total_cells = (
            df.shape[0] * df.shape[1]
        )

        missing_cells = int(
            df.isnull().sum().sum()
        )

        duplicate_rows = int(
            df.duplicated().sum()
        )

        if total_cells > 0:

            completeness = (
                (total_cells - missing_cells)
                / total_cells
            ) * 100

        else:

            completeness = 100

        if len(df) > 0:

            duplicate_percentage = (
                duplicate_rows /
                len(df)
            ) * 100

        else:

            duplicate_percentage = 0

        column_quality = []

        for column in df.columns:

            missing = int(
                df[column].isnull().sum()
            )

            unique = int(
                df[column].nunique()
            )

            if len(df) > 0:

                completeness_column = (
                    (len(df) - missing)
                    / len(df)
                ) * 100

            else:

                completeness_column = 100

            column_quality.append({
                "column": str(column),
                "missing_values": missing,
                "unique_values": unique,
                "completeness_percentage": round(
                    completeness_column,
                    2
                ),
                "data_type": str(
                    df[column].dtype
                )
            })

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,

            "quality": {
                "total_cells": int(
                    total_cells
                ),
                "missing_cells": missing_cells,
                "duplicate_rows": duplicate_rows,
                "completeness_percentage": round(
                    completeness,
                    2
                ),
                "duplicate_percentage": round(
                    duplicate_percentage,
                    2
                )
            },

            "columns": column_quality

        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to calculate data quality",
            "error": str(e)
        }), 500


# =================================================
# RECENT DATASETS
# =================================================

@dashboard_bp.route(
    "/recent",
    methods=["GET"]
)
def recent_datasets():

    try:

        files = get_dataset_files()

        datasets = []

        for filepath in files:

            try:

                df = load_dataset(filepath)

                datasets.append({
                    "dataset_id": get_dataset_id(
                        filepath
                    ),
                    "filename": os.path.basename(
                        filepath
                    ),
                    "rows": int(
                        len(df)
                    ),
                    "columns": int(
                        len(df.columns)
                    ),
                    "size_bytes": os.path.getsize(
                        filepath
                    ),
                    "modified_time": os.path.getmtime(
                        filepath
                    )
                })

            except Exception:
                continue

        datasets.sort(
            key=lambda item: item[
                "modified_time"
            ],
            reverse=True
        )

        # Return latest 10 datasets
        datasets = datasets[:10]

        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to retrieve recent datasets",
            "error": str(e)
        }), 500


# =================================================
# DASHBOARD HEALTH
# =================================================

@dashboard_bp.route(
    "/health",
    methods=["GET"]
)
def dashboard_health():

    try:

        files = get_dataset_files()

        valid_datasets = 0

        for filepath in files:

            try:

                load_dataset(filepath)
                valid_datasets += 1

            except Exception:
                pass

        return jsonify({
            "success": True,
            "status": "healthy",
            "dataset_storage": "available",
            "total_files": len(files),
            "valid_datasets": valid_datasets
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500

