# ==========================================
# # Velocity BI - Visualization Routes
# File: backend/routes/visualization.py
# ==========================================

import os
import numpy as np
import pandas as pd

from flask import Blueprint, request, jsonify, current_app


# -------------------------------------------------
# Blueprint
# -------------------------------------------------

visualization_bp = Blueprint(
    "visualization",
    __name__,
    url_prefix="/api/visualization"
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
    """Check whether the dataset format is supported."""

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


def find_dataset(dataset_id):
    """Find dataset by dataset ID."""

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
    """Load CSV, Excel or JSON dataset."""

    extension = filepath.rsplit(".", 1)[1].lower()

    if extension == "csv":
        return pd.read_csv(filepath)

    if extension in ["xlsx", "xls"]:
        return pd.read_excel(filepath)

    if extension == "json":
        return pd.read_json(filepath)

    raise ValueError("Unsupported dataset format")


def clean_value(value):
    """Convert Pandas/NumPy values into JSON-safe values."""

    if pd.isna(value):
        return None

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    return value


def clean_records(records):
    """Clean a list of dictionaries for JSON response."""

    cleaned = []

    for record in records:

        cleaned_record = {}

        for key, value in record.items():

            cleaned_record[str(key)] = clean_value(
                value
            )

        cleaned.append(cleaned_record)

    return cleaned


# =================================================
# GET AVAILABLE COLUMNS
# =================================================

@visualization_bp.route(
    "/<dataset_id>/columns",
    methods=["GET"]
)
def get_columns(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        columns = []

        for column in df.columns:

            series = df[column]

            if pd.api.types.is_numeric_dtype(series):
                column_type = "numeric"

            elif pd.api.types.is_datetime64_any_dtype(series):
                column_type = "datetime"

            else:
                column_type = "categorical"

            columns.append({
                "name": str(column),
                "type": column_type,
                "null_count": int(
                    series.isnull().sum()
                ),
                "unique_count": int(
                    series.nunique()
                )
            })

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "columns": columns
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to retrieve columns",
            "error": str(e)
        }), 500


# =================================================
# BAR CHART
# =================================================

@visualization_bp.route(
    "/<dataset_id>/bar",
    methods=["GET"]
)
def bar_chart(dataset_id):

    try:

        category = request.args.get("category")
        value = request.args.get("value")
        aggregation = request.args.get(
            "aggregation",
            "sum"
        )

        if not category or not value:

            return jsonify({
                "success": False,
                "message": "category and value are required"
            }), 400

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        if category not in df.columns:
            return jsonify({
                "success": False,
                "message": f"Column '{category}' not found"
            }), 404

        if value not in df.columns:
            return jsonify({
                "success": False,
                "message": f"Column '{value}' not found"
            }), 404

        if not pd.api.types.is_numeric_dtype(
            df[value]
        ):
            return jsonify({
                "success": False,
                "message": "Value column must be numeric"
            }), 400

        if aggregation == "mean":

            result = (
                df.groupby(category)[value]
                .mean()
                .reset_index()
            )

        elif aggregation == "count":

            result = (
                df.groupby(category)[value]
                .count()
                .reset_index()
            )

        elif aggregation == "min":

            result = (
                df.groupby(category)[value]
                .min()
                .reset_index()
            )

        elif aggregation == "max":

            result = (
                df.groupby(category)[value]
                .max()
                .reset_index()
            )

        else:

            result = (
                df.groupby(category)[value]
                .sum()
                .reset_index()
            )

        result.columns = [
            "category",
            "value"
        ]

        return jsonify({
            "success": True,
            "chart_type": "bar",
            "dataset_id": dataset_id,
            "category_column": category,
            "value_column": value,
            "aggregation": aggregation,
            "data": clean_records(
                result.to_dict(
                    orient="records"
                )
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Bar chart generation failed",
            "error": str(e)
        }), 500


# =================================================
# LINE CHART
# =================================================

@visualization_bp.route(
    "/<dataset_id>/line",
    methods=["GET"]
)
def line_chart(dataset_id):

    try:

        x_column = request.args.get("x")
        y_column = request.args.get("y")

        if not x_column or not y_column:

            return jsonify({
                "success": False,
                "message": "x and y columns are required"
            }), 400

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

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

        if pd.api.types.is_numeric_dtype(
            df[y_column]
        ) is False:

            return jsonify({
                "success": False,
                "message": "Y-axis column must be numeric"
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

        return jsonify({
            "success": True,
            "chart_type": "line",
            "dataset_id": dataset_id,
            "x_column": x_column,
            "y_column": y_column,
            "data": clean_records(
                result.to_dict(
                    orient="records"
                )
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Line chart generation failed",
            "error": str(e)
        }), 500


# =================================================
# PIE CHART
# =================================================

@visualization_bp.route(
    "/<dataset_id>/pie",
    methods=["GET"]
)
def pie_chart(dataset_id):

    try:

        category = request.args.get("category")
        value = request.args.get("value")

        if not category or not value:

            return jsonify({
                "success": False,
                "message": "category and value are required"
            }), 400

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        if category not in df.columns:
            return jsonify({
                "success": False,
                "message": f"Column '{category}' not found"
            }), 404

        if value not in df.columns:
            return jsonify({
                "success": False,
                "message": f"Column '{value}' not found"
            }), 404

        if not pd.api.types.is_numeric_dtype(
            df[value]
        ):

            return jsonify({
                "success": False,
                "message": "Value column must be numeric"
            }), 400

        result = (
            df.groupby(category)[value]
            .sum()
            .reset_index()
        )

        result.columns = [
            "name",
            "value"
        ]

        result = result.sort_values(
            by="value",
            ascending=False
        )

        return jsonify({
            "success": True,
            "chart_type": "pie",
            "dataset_id": dataset_id,
            "category_column": category,
            "value_column": value,
            "data": clean_records(
                result.to_dict(
                    orient="records"
                )
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Pie chart generation failed",
            "error": str(e)
        }), 500


# =================================================
# SCATTER PLOT
# =================================================

@visualization_bp.route(
    "/<dataset_id>/scatter",
    methods=["GET"]
)
def scatter_chart(dataset_id):

    try:

        x_column = request.args.get("x")
        y_column = request.args.get("y")

        if not x_column or not y_column:

            return jsonify({
                "success": False,
                "message": "x and y columns are required"
            }), 400

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

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

        if not pd.api.types.is_numeric_dtype(
            df[x_column]
        ):

            return jsonify({
                "success": False,
                "message": "X column must be numeric"
            }), 400

        if not pd.api.types.is_numeric_dtype(
            df[y_column]
        ):

            return jsonify({
                "success": False,
                "message": "Y column must be numeric"
            }), 400

        result = df[
            [x_column, y_column]
        ].dropna()

        result.columns = [
            "x",
            "y"
        ]

        return jsonify({
            "success": True,
            "chart_type": "scatter",
            "dataset_id": dataset_id,
            "x_column": x_column,
            "y_column": y_column,
            "data": clean_records(
                result.to_dict(
                    orient="records"
                )
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Scatter plot generation failed",
            "error": str(e)
        }), 500


# =================================================
# HISTOGRAM
# =================================================

@visualization_bp.route(
    "/<dataset_id>/histogram",
    methods=["GET"]
)
def histogram(dataset_id):

    try:

        column_name = request.args.get("column")

        bins = request.args.get(
            "bins",
            default=10,
            type=int
        )

        bins = max(2, min(bins, 100))

        if not column_name:

            return jsonify({
                "success": False,
                "message": "column is required"
            }), 400

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

        if not pd.api.types.is_numeric_dtype(
            column
        ):

            return jsonify({
                "success": False,
                "message": "Histogram requires a numeric column"
            }), 400

        values = column.dropna()

        if values.empty:

            return jsonify({
                "success": True,
                "chart_type": "histogram",
                "data": []
            }), 200

        counts, edges = np.histogram(
            values,
            bins=bins
        )

        data = []

        for i in range(len(counts)):

            data.append({
                "bin_start": clean_value(
                    edges[i]
                ),
                "bin_end": clean_value(
                    edges[i + 1]
                ),
                "count": int(
                    counts[i]
                )
            })

        return jsonify({
            "success": True,
            "chart_type": "histogram",
            "dataset_id": dataset_id,
            "column": column_name,
            "bins": bins,
            "data": data
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Histogram generation failed",
            "error": str(e)
        }), 500


# =================================================
# TIME SERIES
# =================================================

@visualization_bp.route(
    "/<dataset_id>/time-series",
    methods=["GET"]
)
def time_series(dataset_id):

    try:

        date_column = request.args.get("date")
        value_column = request.args.get("value")

        if not date_column or not value_column:

            return jsonify({
                "success": False,
                "message": "date and value columns are required"
            }), 400

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        if date_column not in df.columns:

            return jsonify({
                "success": False,
                "message": f"Column '{date_column}' not found"
            }), 404

        if value_column not in df.columns:

            return jsonify({
                "success": False,
                "message": f"Column '{value_column}' not found"
            }), 404

        df[date_column] = pd.to_datetime(
            df[date_column],
            errors="coerce"
        )

        df[value_column] = pd.to_numeric(
            df[value_column],
            errors="coerce"
        )

        result = df[
            [date_column, value_column]
        ].dropna()

        result = result.sort_values(
            by=date_column
        )

        result[date_column] = (
            result[date_column]
            .dt.strftime("%Y-%m-%d")
        )

        result.columns = [
            "date",
            "value"
        ]

        return jsonify({
            "success": True,
            "chart_type": "line",
            "dataset_id": dataset_id,
            "date_column": date_column,
            "value_column": value_column,
            "data": clean_records(
                result.to_dict(
                    orient="records"
                )
            )
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Time-series generation failed",
            "error": str(e)
        }), 500


# =================================================
# AUTO VISUALIZATION
# =================================================

@visualization_bp.route(
    "/<dataset_id>/auto",
    methods=["GET"]
)
def auto_visualization(dataset_id):

    try:

        filepath = find_dataset(dataset_id)

        if not filepath:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        df = load_dataset(filepath)

        numeric_columns = [
            str(column)
            for column in df.select_dtypes(
                include=np.number
            ).columns
        ]

        categorical_columns = [
            str(column)
            for column in df.select_dtypes(
                include=[
                    "object",
                    "category",
                    "bool"
                ]
            ).columns
        ]

        datetime_columns = [
            str(column)
            for column in df.select_dtypes(
                include=["datetime"]
            ).columns
        ]

        recommendations = []

        # Categorical + numeric = bar chart
        if (
            categorical_columns
            and numeric_columns
        ):

            recommendations.append({
                "chart_type": "bar",
                "x_column": categorical_columns[0],
                "y_column": numeric_columns[0],
                "reason": (
                    "Useful for comparing "
                    "numeric values across categories."
                )
            })

        # Two numeric columns = scatter
        if len(numeric_columns) >= 2:

            recommendations.append({
                "chart_type": "scatter",
                "x_column": numeric_columns[0],
                "y_column": numeric_columns[1],
                "reason": (
                    "Useful for examining "
                    "relationships between numeric variables."
                )
            })

        # Numeric column = histogram
        if numeric_columns:

            recommendations.append({
                "chart_type": "histogram",
                "column": numeric_columns[0],
                "reason": (
                    "Useful for understanding "
                    "the distribution of numeric data."
                )
            })

        # Categorical + numeric = pie
        if (
            categorical_columns
            and numeric_columns
        ):

            recommendations.append({
                "chart_type": "pie",
                "category_column": categorical_columns[0],
                "value_column": numeric_columns[0],
                "reason": (
                    "Useful for showing "
                    "part-to-whole composition."
                )
            })

        # Datetime + numeric = line
        if (
            datetime_columns
            and numeric_columns
        ):

            recommendations.append({
                "chart_type": "line",
                "x_column": datetime_columns[0],
                "y_column": numeric_columns[0],
                "reason": (
                    "Useful for visualizing "
                    "changes over time."
                )
            })

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns,
            "datetime_columns": datetime_columns,
            "recommendations": recommendations
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Automatic visualization failed",
            "error": str(e)
        }), 500

