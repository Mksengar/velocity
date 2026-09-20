# ==========================================
# Velocity BI - Analysis Service
# File: backend/services/analysis_service.py
# ==========================================

import os
import pandas as pd
import numpy as np


# ==========================================
# Supported File Types
# ==========================================

SUPPORTED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls",
    ".json"
}


# ==========================================
# Dataset Loader
# ==========================================

def load_dataset(file_path):
    """
    Load a dataset from CSV, Excel, or JSON file.

    Args:
        file_path (str): Path to dataset file.

    Returns:
        pandas.DataFrame
    """

    if not file_path:
        raise ValueError("File path is required.")

    if not os.path.exists(file_path):
        raise FileNotFoundError("Dataset file not found.")

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension}. "
            f"Supported types: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    if extension == ".csv":
        return pd.read_csv(file_path)

    if extension in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)

    if extension == ".json":
        return pd.read_json(file_path)

    raise ValueError("Unable to load dataset.")


# ==========================================
# Basic Dataset Information
# ==========================================

def get_dataset_info(df):
    """
    Return basic information about a dataset.
    """

    if df is None or df.empty:
        return {
            "rows": 0,
            "columns": 0,
            "memory_usage": 0,
            "column_names": []
        }

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "memory_usage": int(df.memory_usage(deep=True).sum()),
        "column_names": df.columns.tolist()
    }


# ==========================================
# Column Information
# ==========================================

def get_column_info(df):
    """
    Return detailed information about every column.
    """

    columns = []

    for column in df.columns:
        series = df[column]

        columns.append({
            "name": column,
            "dtype": str(series.dtype),
            "non_null": int(series.notna().sum()),
            "null_count": int(series.isna().sum()),
            "unique_values": int(series.nunique(dropna=True))
        })

    return columns


# ==========================================
# Missing Value Analysis
# ==========================================

def get_missing_values(df):
    """
    Analyze missing values in each column.
    """

    result = []

    total_rows = len(df)

    for column in df.columns:
        missing_count = int(df[column].isna().sum())

        percentage = (
            (missing_count / total_rows) * 100
            if total_rows > 0
            else 0
        )

        result.append({
            "column": column,
            "missing_count": missing_count,
            "missing_percentage": round(percentage, 2)
        })

    return result


# ==========================================
# Descriptive Statistics
# ==========================================

def get_statistics(df):
    """
    Return descriptive statistics for numeric columns.
    """

    numeric_df = df.select_dtypes(include=np.number)

    if numeric_df.empty:
        return {}

    statistics = {}

    for column in numeric_df.columns:

        series = numeric_df[column].dropna()

        if series.empty:
            continue

        statistics[column] = {
            "count": int(series.count()),
            "mean": safe_float(series.mean()),
            "median": safe_float(series.median()),
            "std": safe_float(series.std()),
            "min": safe_float(series.min()),
            "max": safe_float(series.max()),
            "q1": safe_float(series.quantile(0.25)),
            "q3": safe_float(series.quantile(0.75))
        }

    return statistics


# ==========================================
# Correlation Analysis
# ==========================================

def get_correlation(df):
    """
    Calculate correlation matrix for numeric columns.
    """

    numeric_df = df.select_dtypes(include=np.number)

    if numeric_df.empty:
        return {}

    correlation = numeric_df.corr()

    correlation = correlation.replace(
        [np.inf, -np.inf],
        np.nan
    ).fillna(0)

    return correlation.round(4).to_dict()


# ==========================================
# Strong Correlations
# ==========================================

def get_strong_correlations(df, threshold=0.7):
    """
    Find strongly correlated numeric columns.

    Args:
        df: pandas DataFrame
        threshold: correlation threshold

    Returns:
        List of correlation pairs.
    """

    numeric_df = df.select_dtypes(include=np.number)

    if numeric_df.shape[1] < 2:
        return []

    correlation = numeric_df.corr()

    results = []

    columns = correlation.columns

    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):

            value = correlation.iloc[i, j]

            if pd.isna(value):
                continue

            if abs(value) >= threshold:

                results.append({
                    "column_1": columns[i],
                    "column_2": columns[j],
                    "correlation": round(float(value), 4),
                    "strength": get_correlation_strength(value)
                })

    results.sort(
        key=lambda x: abs(x["correlation"]),
        reverse=True
    )

    return results


# ==========================================
# Correlation Strength
# ==========================================

def get_correlation_strength(value):
    """
    Convert correlation value into a readable category.
    """

    value = abs(float(value))

    if value >= 0.9:
        return "Very Strong"

    if value >= 0.7:
        return "Strong"

    if value >= 0.5:
        return "Moderate"

    if value >= 0.3:
        return "Weak"

    return "Very Weak"


# ==========================================
# Numeric Column Detection
# ==========================================

def get_numeric_columns(df):
    """
    Return all numeric columns.
    """

    return df.select_dtypes(
        include=np.number
    ).columns.tolist()


# ==========================================
# Categorical Column Detection
# ==========================================

def get_categorical_columns(df):
    """
    Return all categorical/object columns.
    """

    return df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()


# ==========================================
# Date Column Detection
# ==========================================

def get_date_columns(df):
    """
    Try to identify date/time columns.
    """

    date_columns = []

    for column in df.columns:

        if pd.api.types.is_datetime64_any_dtype(df[column]):
            date_columns.append(column)
            continue

        if df[column].dtype == "object":

            sample = df[column].dropna().head(100)

            if sample.empty:
                continue

            converted = pd.to_datetime(
                sample,
                errors="coerce"
            )

            valid_ratio = converted.notna().mean()

            if valid_ratio >= 0.8:
                date_columns.append(column)

    return date_columns


# ==========================================
# Unique Value Analysis
# ==========================================

def get_unique_values(df, column):
    """
    Return unique values for a specific column.
    """

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    values = df[column].dropna().unique()

    return [
        make_json_safe(value)
        for value in values
    ]


# ==========================================
# Frequency Analysis
# ==========================================

def get_frequency(df, column, limit=20):
    """
    Return the most frequent values of a column.
    """

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    frequency = (
        df[column]
        .value_counts(dropna=False)
        .head(limit)
    )

    result = []

    for value, count in frequency.items():

        result.append({
            "value": make_json_safe(value),
            "count": int(count)
        })

    return result


# ==========================================
# Outlier Detection
# ==========================================

def detect_outliers(df):
    """
    Detect outliers using the IQR method.
    """

    numeric_df = df.select_dtypes(
        include=np.number
    )

    result = {}

    for column in numeric_df.columns:

        series = numeric_df[column].dropna()

        if series.empty:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outliers = series[
            (series < lower_bound) |
            (series > upper_bound)
        ]

        result[column] = {
            "outlier_count": int(len(outliers)),
            "lower_bound": safe_float(lower_bound),
            "upper_bound": safe_float(upper_bound),
            "percentage": round(
                (len(outliers) / len(series)) * 100,
                2
            )
        }

    return result


# ==========================================
# Dataset Quality Score
# ==========================================

def get_quality_score(df):
    """
    Calculate a simple dataset quality score.

    Factors:
    - Missing values
    - Duplicate rows
    - Empty dataset
    """

    if df is None or df.empty:
        return 0

    total_cells = df.shape[0] * df.shape[1]

    if total_cells == 0:
        return 0

    missing_cells = int(df.isna().sum().sum())

    missing_percentage = (
        missing_cells / total_cells
    ) * 100

    duplicate_percentage = (
        df.duplicated().sum() / len(df)
    ) * 100

    score = 100

    score -= min(missing_percentage * 0.6, 60)
    score -= min(duplicate_percentage * 0.4, 30)

    return round(max(score, 0), 2)


# ==========================================
# Duplicate Analysis
# ==========================================

def get_duplicate_info(df):
    """
    Analyze duplicate rows.
    """

    duplicate_count = int(
        df.duplicated().sum()
    )

    total_rows = len(df)

    percentage = (
        (duplicate_count / total_rows) * 100
        if total_rows > 0
        else 0
    )

    return {
        "duplicate_rows": duplicate_count,
        "duplicate_percentage": round(
            percentage,
            2
        )
    }


# ==========================================
# Complete Dataset Analysis
# ==========================================

def analyze_dataset(file_path):
    """
    Perform complete analysis of a dataset.

    This function can be called from Flask routes.
    """

    df = load_dataset(file_path)

    return {
        "success": True,

        "dataset": get_dataset_info(df),

        "columns": get_column_info(df),

        "numeric_columns": get_numeric_columns(df),

        "categorical_columns": get_categorical_columns(df),

        "date_columns": get_date_columns(df),

        "missing_values": get_missing_values(df),

        "statistics": get_statistics(df),

        "correlation": get_correlation(df),

        "strong_correlations": get_strong_correlations(df),

        "outliers": detect_outliers(df),

        "duplicates": get_duplicate_info(df),

        "quality_score": get_quality_score(df)
    }


# ==========================================
# Safe Float Conversion
# ==========================================

def safe_float(value):
    """
    Convert NumPy/Pandas numeric values
    into JSON-compatible Python floats.
    """

    if value is None:
        return None

    try:
        value = float(value)

        if np.isnan(value) or np.isinf(value):
            return None

        return round(value, 6)

    except (TypeError, ValueError):
        return None


# ==========================================
# JSON Safe Conversion
# ==========================================

def make_json_safe(value):
    """
    Convert Pandas/NumPy values into
    JSON-compatible Python values.
    """

    if pd.isna(value):
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        return safe_float(value)

    if isinstance(value, (np.bool_,)):
        return bool(value)

    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()

    return value