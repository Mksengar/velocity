# ==========================================
# Velocity BI - Reports API
# File: backend/routes/reports.py
# ==========================================

import os
import json
import uuid
from datetime import datetime

import pandas as pd
import numpy as np

from flask import (
    Blueprint,
    jsonify,
    request,
    current_app,
    send_file
)


# ==========================================
# Blueprint
# ==========================================

reports_bp = Blueprint(
    "reports",
    __name__,
    url_prefix="/api/reports"
)


# ==========================================
# Configuration
# ==========================================

ALLOWED_DATASET_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "json"
}


# ==========================================
# Helper Functions
# ==========================================

def clean_value(value):
    """
    Convert pandas/numpy values into JSON-safe values.
    """

    if value is None:
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        if np.isnan(value) or np.isinf(value):
            return None
        return float(value)

    if isinstance(value, (np.bool_,)):
        return bool(value)

    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return value


def clean_dataframe_records(df):
    """
    Convert DataFrame into JSON-safe records.
    """

    records = df.to_dict(orient="records")

    cleaned = []

    for record in records:
        cleaned_record = {}

        for key, value in record.items():
            cleaned_record[str(key)] = clean_value(value)

        cleaned.append(cleaned_record)

    return cleaned


def get_upload_folder():
    """
    Get dataset upload folder.
    """

    folder = current_app.config.get(
        "DATASET_UPLOAD_FOLDER"
    )

    if not folder:
        folder = os.path.join(
            current_app.root_path,
            "uploads",
            "datasets"
        )

    os.makedirs(folder, exist_ok=True)

    return folder


def get_reports_folder():
    """
    Get reports storage folder.
    """

    folder = current_app.config.get(
        "REPORTS_FOLDER"
    )

    if not folder:
        folder = os.path.join(
            current_app.root_path,
            "uploads",
            "reports"
        )

    os.makedirs(folder, exist_ok=True)

    return folder


def allowed_dataset_file(filename):
    """
    Check whether a dataset file extension is allowed.
    """

    if not filename:
        return False

    extension = filename.rsplit(".", 1)[-1].lower()

    return extension in ALLOWED_DATASET_EXTENSIONS


def load_dataset(dataset_id):
    """
    Find and load a dataset by its ID.

    Dataset ID is expected to match the filename
    without its extension.
    """

    folder = get_upload_folder()

    if not dataset_id:
        return None, None

    for filename in os.listdir(folder):

        filepath = os.path.join(folder, filename)

        if not os.path.isfile(filepath):
            continue

        extension = (
            filename.rsplit(".", 1)[-1].lower()
            if "." in filename
            else ""
        )

        if extension not in ALLOWED_DATASET_EXTENSIONS:
            continue

        file_id = os.path.splitext(filename)[0]

        if file_id != dataset_id:
            continue

        try:

            if extension == "csv":
                df = pd.read_csv(filepath)

            elif extension in {"xlsx", "xls"}:
                df = pd.read_excel(filepath)

            elif extension == "json":
                df = pd.read_json(filepath)

            else:
                return None, None

            return df, filepath

        except Exception as error:
            current_app.logger.error(
                f"Dataset loading error: {error}"
            )

            return None, None

    return None, None


def get_dataset_files():
    """
    Return all supported dataset files.
    """

    folder = get_upload_folder()

    if not os.path.exists(folder):
        return []

    files = []

    for filename in os.listdir(folder):

        filepath = os.path.join(folder, filename)

        if not os.path.isfile(filepath):
            continue

        if not allowed_dataset_file(filename):
            continue

        files.append({
            "dataset_id": os.path.splitext(filename)[0],
            "filename": filename,
            "filepath": filepath,
            "size": os.path.getsize(filepath),
            "modified_at": os.path.getmtime(filepath)
        })

    return files


def generate_dataset_summary(df):
    """
    Generate summary information for a dataset.
    """

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
        exclude=np.number
    ).columns.tolist()

    missing_values = int(
        df.isnull().sum().sum()
    )

    duplicate_rows = int(
        df.duplicated().sum()
    )

    numeric_summary = {}

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        numeric_summary[column] = {
            "sum": clean_value(series.sum()),
            "average": clean_value(series.mean()),
            "minimum": clean_value(series.min()),
            "maximum": clean_value(series.max()),
            "median": clean_value(series.median()),
            "standard_deviation": clean_value(
                series.std()
            )
        }

    categorical_summary = {}

    for column in categorical_columns:

        value_counts = (
            df[column]
            .astype(str)
            .value_counts()
            .head(10)
        )

        categorical_summary[column] = {
            str(key): int(value)
            for key, value in value_counts.items()
        }

    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": [
            str(column)
            for column in df.columns
        ],
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary
    }


def create_report_data(dataset_id):
    """
    Create complete report data from a dataset.
    """

    df, filepath = load_dataset(dataset_id)

    if df is None:
        return None

    summary = generate_dataset_summary(df)

    # --------------------------------------
    # Column Information
    # --------------------------------------

    column_information = []

    for column in df.columns:

        column_information.append({
            "name": str(column),
            "data_type": str(df[column].dtype),
            "missing_values": int(
                df[column].isnull().sum()
            ),
            "unique_values": int(
                df[column].nunique()
            )
        })

    # --------------------------------------
    # Correlation
    # --------------------------------------

    correlation = {}

    numeric_df = df.select_dtypes(
        include=np.number
    )

    if not numeric_df.empty:

        correlation_df = numeric_df.corr()

        correlation = {
            str(column): {
                str(other_column): clean_value(
                    correlation_df.loc[
                        column,
                        other_column
                    ]
                )
                for other_column in correlation_df.columns
            }
            for column in correlation_df.columns
        }

    # --------------------------------------
    # Top Rows
    # --------------------------------------

    preview = clean_dataframe_records(
        df.head(10)
    )

    # --------------------------------------
    # Report Object
    # --------------------------------------

    return {
        "dataset": {
            "dataset_id": dataset_id,
            "filename": os.path.basename(filepath)
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "summary": summary,
        "columns": column_information,
        "correlation": correlation,
        "preview": preview
    }


def save_report(report):
    """
    Save report JSON file.
    """

    reports_folder = get_reports_folder()

    report_id = report["report_id"]

    filepath = os.path.join(
        reports_folder,
        f"{report_id}.json"
    )

    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False,
            default=str
        )

    return filepath


def load_report(report_id):
    """
    Load a saved report.
    """

    reports_folder = get_reports_folder()

    filepath = os.path.join(
        reports_folder,
        f"{report_id}.json"
    )

    if not os.path.exists(filepath):
        return None

    try:

        with open(
            filepath,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except Exception as error:

        current_app.logger.error(
            f"Report loading error: {error}"
        )

        return None


# ==========================================
# CREATE REPORT
# ==========================================

@reports_bp.route(
    "/generate",
    methods=["POST"]
)
def generate_report():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        dataset_id = data.get(
            "dataset_id"
        )

        title = data.get(
            "title",
            "Velocity BI Report"
        )

        description = data.get(
            "description",
            ""
        )

        if not dataset_id:

            return jsonify({
                "success": False,
                "message": "dataset_id is required"
            }), 400

        report_data = create_report_data(
            dataset_id
        )

        if report_data is None:

            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        report_id = str(uuid.uuid4())

        report = {
            "report_id": report_id,
            "title": title,
            "description": description,
            "dataset_id": dataset_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "report": report_data
        }

        filepath = save_report(report)

        return jsonify({
            "success": True,
            "message": "Report generated successfully",
            "report_id": report_id,
            "report": report,
            "file": filepath
        }), 201

    except Exception as error:

        current_app.logger.exception(
            "Report generation failed"
        )

        return jsonify({
            "success": False,
            "message": "Failed to generate report",
            "error": str(error)
        }), 500


# ==========================================
# GET ALL REPORTS
# ==========================================

@reports_bp.route(
    "",
    methods=["GET"]
)
def get_reports():

    try:

        reports_folder = get_reports_folder()

        reports = []

        for filename in os.listdir(
            reports_folder
        ):

            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(
                reports_folder,
                filename
            )

            try:

                with open(
                    filepath,
                    "r",
                    encoding="utf-8"
                ) as file:

                    report = json.load(file)

                reports.append({
                    "report_id": report.get(
                        "report_id"
                    ),
                    "title": report.get(
                        "title"
                    ),
                    "description": report.get(
                        "description",
                        ""
                    ),
                    "dataset_id": report.get(
                        "dataset_id"
                    ),
                    "created_at": report.get(
                        "created_at"
                    ),
                    "updated_at": report.get(
                        "updated_at"
                    )
                })

            except Exception:
                continue

        reports.sort(
            key=lambda item: item.get(
                "created_at",
                ""
            ),
            reverse=True
        )

        return jsonify({
            "success": True,
            "count": len(reports),
            "reports": reports
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Failed to fetch reports",
            "error": str(error)
        }), 500


# ==========================================
# GET SINGLE REPORT
# ==========================================

@reports_bp.route(
    "/<report_id>",
    methods=["GET"]
)
def get_report(report_id):

    report = load_report(report_id)

    if report is None:

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    return jsonify({
        "success": True,
        "report": report
    })


# ==========================================
# UPDATE REPORT
# ==========================================

@reports_bp.route(
    "/<report_id>",
    methods=["PUT"]
)
def update_report(report_id):

    report = load_report(report_id)

    if report is None:

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    if "title" in data:
        report["title"] = data["title"]

    if "description" in data:
        report["description"] = data[
            "description"
        ]

    report["updated_at"] = (
        datetime.utcnow().isoformat() + "Z"
    )

    save_report(report)

    return jsonify({
        "success": True,
        "message": "Report updated successfully",
        "report": report
    })


# ==========================================
# REGENERATE REPORT
# ==========================================

@reports_bp.route(
    "/<report_id>/regenerate",
    methods=["POST"]
)
def regenerate_report(report_id):

    report = load_report(report_id)

    if report is None:

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    dataset_id = report.get(
        "dataset_id"
    )

    if not dataset_id:

        return jsonify({
            "success": False,
            "message": "Dataset information missing"
        }), 400

    new_report_data = create_report_data(
        dataset_id
    )

    if new_report_data is None:

        return jsonify({
            "success": False,
            "message": "Dataset not found"
        }), 404

    report["report"] = new_report_data

    report["updated_at"] = (
        datetime.utcnow().isoformat() + "Z"
    )

    save_report(report)

    return jsonify({
        "success": True,
        "message": "Report regenerated successfully",
        "report": report
    })


# ==========================================
# DELETE REPORT
# ==========================================

@reports_bp.route(
    "/<report_id>",
    methods=["DELETE"]
)
def delete_report(report_id):

    reports_folder = get_reports_folder()

    filepath = os.path.join(
        reports_folder,
        f"{report_id}.json"
    )

    if not os.path.exists(filepath):

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    try:

        os.remove(filepath)

        return jsonify({
            "success": True,
            "message": "Report deleted successfully",
            "report_id": report_id
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Failed to delete report",
            "error": str(error)
        }), 500


# ==========================================
# EXPORT REPORT AS JSON
# ==========================================

@reports_bp.route(
    "/<report_id>/export/json",
    methods=["GET"]
)
def export_json(report_id):

    report = load_report(report_id)

    if report is None:

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    reports_folder = get_reports_folder()

    filepath = os.path.join(
        reports_folder,
        f"{report_id}_export.json"
    )

    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False,
            default=str
        )

    return send_file(
        filepath,
        as_attachment=True,
        download_name=f"velocity_bi_report_{report_id}.json",
        mimetype="application/json"
    )


# ==========================================
# EXPORT REPORT AS CSV
# ==========================================

@reports_bp.route(
    "/<report_id>/export/csv",
    methods=["GET"]
)
def export_csv(report_id):

    report = load_report(report_id)

    if report is None:

        return jsonify({
            "success": False,
            "message": "Report not found"
        }), 404

    summary = report.get(
        "report",
        {}
    ).get(
        "summary",
        {}
    )

    rows = []

    rows.append({
        "Metric": "Rows",
        "Value": summary.get(
            "rows",
            0
        )
    })

    rows.append({
        "Metric": "Columns",
        "Value": summary.get(
            "columns",
            0
        )
    })

    rows.append({
        "Metric": "Missing Values",
        "Value": summary.get(
            "missing_values",
            0
        )
    })

    rows.append({
        "Metric": "Duplicate Rows",
        "Value": summary.get(
            "duplicate_rows",
            0
        )
    })

    rows.append({
        "Metric": "Numeric Columns",
        "Value": len(
            summary.get(
                "numeric_columns",
                []
            )
        )
    })

    rows.append({
        "Metric": "Categorical Columns",
        "Value": len(
            summary.get(
                "categorical_columns",
                []
            )
        )
    })

    csv_df = pd.DataFrame(rows)

    reports_folder = get_reports_folder()

    filepath = os.path.join(
        reports_folder,
        f"{report_id}_summary.csv"
    )

    csv_df.to_csv(
        filepath,
        index=False
    )

    return send_file(
        filepath,
        as_attachment=True,
        download_name=f"velocity_bi_report_{report_id}.csv",
        mimetype="text/csv"
    )


# ==========================================
# DATASET REPORT PREVIEW
# ==========================================

@reports_bp.route(
    "/dataset/<dataset_id>",
    methods=["GET"]
)
def dataset_report(dataset_id):

    report = create_report_data(
        dataset_id
    )

    if report is None:

        return jsonify({
            "success": False,
            "message": "Dataset not found"
        }), 404

    return jsonify({
        "success": True,
        "report": report
    })


# ==========================================
# REPORT HEALTH CHECK
# ==========================================

@reports_bp.route(
    "/health",
    methods=["GET"]
)
def reports_health():

    try:

        reports_folder = get_reports_folder()

        report_count = len([
            file
            for file in os.listdir(
                reports_folder
            )
            if file.endswith(".json")
        ])

        return jsonify({
            "success": True,
            "service": "Velocity BI Reports API",
            "status": "healthy",
            "report_count": report_count
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "service": "Velocity BI Reports API",
            "status": "unhealthy",
            "error": str(error)
        }), 500