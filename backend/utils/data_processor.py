"""
==========================================
Velocity BI - Data Processor
File: backend/utils/data_processor.py
==========================================

Provides reusable data-processing functions for:

- Dataset cleaning
- Missing-value handling
- Duplicate removal
- Data type detection
- Column operations
- Filtering
- Sorting
- Aggregation
- Encoding
- Outlier detection
- Statistical summaries
- Dataset preparation for analysis
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np
import pandas as pd


# ==========================================
# Basic Validation
# ==========================================

def validate_dataframe(data: Any) -> pd.DataFrame:
    """
    Validate that the input is a Pandas DataFrame.

    Raises:
        TypeError: If data is not a DataFrame.

    Returns:
        pd.DataFrame
    """

    if not isinstance(data, pd.DataFrame):
        raise TypeError(
            "Input must be a Pandas DataFrame."
        )

    return data.copy()


# ==========================================
# Dataset Information
# ==========================================

def get_shape(data: pd.DataFrame) -> dict:
    """
    Return number of rows and columns.
    """

    data = validate_dataframe(data)

    rows, columns = data.shape

    return {
        "rows": int(rows),
        "columns": int(columns),
    }


def get_column_names(
    data: pd.DataFrame
) -> list[str]:
    """
    Return dataset column names.
    """

    data = validate_dataframe(data)

    return data.columns.tolist()


def get_data_types(
    data: pd.DataFrame
) -> dict:
    """
    Return data types for each column.
    """

    data = validate_dataframe(data)

    return {
        column: str(dtype)
        for column, dtype in data.dtypes.items()
    }


# ==========================================
# Missing Values
# ==========================================

def get_missing_values(
    data: pd.DataFrame
) -> dict:
    """
    Count missing values in every column.
    """

    data = validate_dataframe(data)

    missing = data.isnull().sum()

    return {
        column: int(value)
        for column, value in missing.items()
        if value > 0
    }


def get_missing_percentage(
    data: pd.DataFrame
) -> dict:
    """
    Calculate missing-value percentage
    for every column.
    """

    data = validate_dataframe(data)

    if len(data) == 0:
        return {
            column: 0.0
            for column in data.columns
        }

    percentage = (
        data.isnull().sum()
        / len(data)
        * 100
    )

    return {
        column: round(float(value), 2)
        for column, value in percentage.items()
    }


def drop_missing_rows(
    data: pd.DataFrame
) -> pd.DataFrame:
    """
    Remove rows containing missing values.
    """

    data = validate_dataframe(data)

    return data.dropna().reset_index(
        drop=True
    )


def drop_missing_columns(
    data: pd.DataFrame,
    threshold: float = 0.5
) -> pd.DataFrame:
    """
    Remove columns where the percentage of
    missing values is greater than threshold.

    Example:
        threshold=0.5 means remove columns
        with more than 50% missing values.
    """

    data = validate_dataframe(data)

    if not 0 <= threshold <= 1:
        raise ValueError(
            "Threshold must be between 0 and 1."
        )

    return data.loc[
        :,
        data.isnull().mean() <= threshold
    ].copy()


# ==========================================
# Missing Value Filling
# ==========================================

def fill_missing_numeric(
    data: pd.DataFrame,
    method: str = "mean"
) -> pd.DataFrame:
    """
    Fill missing numeric values.

    Supported methods:
        mean
        median
        zero
    """

    data = validate_dataframe(data)

    numeric_columns = data.select_dtypes(
        include=np.number
    ).columns

    for column in numeric_columns:

        if method == "mean":
            value = data[column].mean()

        elif method == "median":
            value = data[column].median()

        elif method == "zero":
            value = 0

        else:
            raise ValueError(
                "Method must be mean, median, or zero."
            )

        data[column] = data[column].fillna(
            value
        )

    return data


def fill_missing_categorical(
    data: pd.DataFrame,
    value: str = "Unknown"
) -> pd.DataFrame:
    """
    Fill missing categorical/text values.
    """

    data = validate_dataframe(data)

    categorical_columns = data.select_dtypes(
        include=["object", "category"]
    ).columns

    for column in categorical_columns:
        data[column] = data[column].fillna(
            value
        )

    return data


# ==========================================
# Duplicate Handling
# ==========================================

def count_duplicates(
    data: pd.DataFrame
) -> int:
    """
    Count duplicate rows.
    """

    data = validate_dataframe(data)

    return int(data.duplicated().sum())


def remove_duplicates(
    data: pd.DataFrame
) -> pd.DataFrame:
    """
    Remove duplicate rows.
    """

    data = validate_dataframe(data)

    return data.drop_duplicates().reset_index(
        drop=True
    )


# ==========================================
# Column Operations
# ==========================================

def remove_columns(
    data: pd.DataFrame,
    columns: list[str]
) -> pd.DataFrame:
    """
    Remove specified columns.
    """

    data = validate_dataframe(data)

    existing_columns = [
        column
        for column in columns
        if column in data.columns
    ]

    return data.drop(
        columns=existing_columns
    )


def rename_columns(
    data: pd.DataFrame,
    mapping: dict[str, str]
) -> pd.DataFrame:
    """
    Rename columns using a mapping.
    """

    data = validate_dataframe(data)

    return data.rename(
        columns=mapping
    )


# ==========================================
# String Cleaning
# ==========================================

def clean_string_columns(
    data: pd.DataFrame
) -> pd.DataFrame:
    """
    Remove leading/trailing whitespace
    from text columns.
    """

    data = validate_dataframe(data)

    text_columns = data.select_dtypes(
        include=["object", "string"]
    ).columns

    for column in text_columns:
        data[column] = data[column].apply(
            lambda value:
            value.strip()
            if isinstance(value, str)
            else value
        )

    return data


def lowercase_columns(
    data: pd.DataFrame,
    columns: Optional[list[str]] = None
) -> pd.DataFrame:
    """
    Convert selected text columns to lowercase.
    """

    data = validate_dataframe(data)

    if columns is None:
        columns = data.select_dtypes(
            include=["object", "string"]
        ).columns.tolist()

    for column in columns:
        if column in data.columns:
            data[column] = data[column].apply(
                lambda value:
                value.lower()
                if isinstance(value, str)
                else value
            )

    return data


# ==========================================
# Data Type Conversion
# ==========================================

def convert_numeric_columns(
    data: pd.DataFrame,
    columns: list[str]
) -> pd.DataFrame:
    """
    Convert selected columns to numeric.
    Invalid values become NaN.
    """

    data = validate_dataframe(data)

    for column in columns:
        if column in data.columns:
            data[column] = pd.to_numeric(
                data[column],
                errors="coerce"
            )

    return data


def convert_date_columns(
    data: pd.DataFrame,
    columns: list[str]
) -> pd.DataFrame:
    """
    Convert selected columns to datetime.
    """

    data = validate_dataframe(data)

    for column in columns:
        if column in data.columns:
            data[column] = pd.to_datetime(
                data[column],
                errors="coerce"
            )

    return data


# ==========================================
# Automatic Data Type Detection
# ==========================================

def detect_column_types(
    data: pd.DataFrame
) -> dict:
    """
    Categorize columns into:

        numeric
        categorical
        datetime
        boolean
    """

    data = validate_dataframe(data)

    numeric = data.select_dtypes(
        include=np.number
    ).columns.tolist()

    categorical = data.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    datetime_columns = data.select_dtypes(
        include=["datetime", "datetimetz"]
    ).columns.tolist()

    boolean = data.select_dtypes(
        include="bool"
    ).columns.tolist()

    return {
        "numeric": numeric,
        "categorical": categorical,
        "datetime": datetime_columns,
        "boolean": boolean,
    }


# ==========================================
# Filtering
# ==========================================

def filter_rows(
    data: pd.DataFrame,
    column: str,
    operator: str,
    value: Any
) -> pd.DataFrame:
    """
    Filter rows using a comparison operator.

    Supported operators:

        ==
        !=
        >
        <
        >=
        <=
        contains
    """

    data = validate_dataframe(data)

    if column not in data.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    series = data[column]

    if operator == "==":
        mask = series == value

    elif operator == "!=":
        mask = series != value

    elif operator == ">":
        mask = series > value

    elif operator == "<":
        mask = series < value

    elif operator == ">=":
        mask = series >= value

    elif operator == "<=":
        mask = series <= value

    elif operator == "contains":
        mask = (
            series.astype(str)
            .str.contains(
                str(value),
                case=False,
                na=False
            )
        )

    else:
        raise ValueError(
            f"Unsupported operator: {operator}"
        )

    return data.loc[mask].reset_index(
        drop=True
    )


# ==========================================
# Sorting
# ==========================================

def sort_data(
    data: pd.DataFrame,
    column: str,
    ascending: bool = True
) -> pd.DataFrame:
    """
    Sort dataset by a column.
    """

    data = validate_dataframe(data)

    if column not in data.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    return data.sort_values(
        by=column,
        ascending=ascending
    ).reset_index(drop=True)


# ==========================================
# Sampling
# ==========================================

def sample_data(
    data: pd.DataFrame,
    n: int = 10,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Return a random sample.
    """

    data = validate_dataframe(data)

    if n <= 0:
        raise ValueError(
            "Sample size must be greater than zero."
        )

    n = min(n, len(data))

    return data.sample(
        n=n,
        random_state=random_state
    ).reset_index(drop=True)


# ==========================================
# Aggregation
# ==========================================

def aggregate_data(
    data: pd.DataFrame,
    group_by: str,
    value_column: str,
    operation: str = "sum"
) -> pd.DataFrame:
    """
    Group and aggregate data.

    Supported operations:

        sum
        mean
        median
        min
        max
        count
    """

    data = validate_dataframe(data)

    if group_by not in data.columns:
        raise ValueError(
            f"Column '{group_by}' does not exist."
        )

    if value_column not in data.columns:
        raise ValueError(
            f"Column '{value_column}' does not exist."
        )

    if operation not in {
        "sum",
        "mean",
        "median",
        "min",
        "max",
        "count",
    }:
        raise ValueError(
            "Unsupported aggregation operation."
        )

    grouped = data.groupby(
        group_by,
        dropna=False
    )[value_column]

    result = getattr(grouped, operation)()

    return result.reset_index(
        name=value_column
    )


# ==========================================
# Encoding
# ==========================================

def one_hot_encode(
    data: pd.DataFrame,
    columns: list[str]
) -> pd.DataFrame:
    """
    Perform one-hot encoding on categorical columns.
    """

    data = validate_dataframe(data)

    valid_columns = [
        column
        for column in columns
        if column in data.columns
    ]

    if not valid_columns:
        return data

    return pd.get_dummies(
        data,
        columns=valid_columns,
        dtype=int
    )


# ==========================================
# Outlier Detection
# ==========================================

def detect_outliers_iqr(
    data: pd.DataFrame,
    column: str
) -> pd.DataFrame:
    """
    Detect outliers using the IQR method.

    Returns only rows considered outliers.
    """

    data = validate_dataframe(data)

    if column not in data.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    series = pd.to_numeric(
        data[column],
        errors="coerce"
    )

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    mask = (
        (series < lower_bound)
        | (series > upper_bound)
    )

    return data.loc[mask].copy()


def remove_outliers_iqr(
    data: pd.DataFrame,
    column: str
) -> pd.DataFrame:
    """
    Remove IQR-based outliers.
    """

    data = validate_dataframe(data)

    if column not in data.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    series = pd.to_numeric(
        data[column],
        errors="coerce"
    )

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    mask = (
        (series >= lower_bound)
        & (series <= upper_bound)
    )

    return data.loc[mask].reset_index(
        drop=True
    )


# ==========================================
# Numeric Summary
# ==========================================

def get_numeric_summary(
    data: pd.DataFrame
) -> dict:
    """
    Generate summary statistics for
    numeric columns.
    """

    data = validate_dataframe(data)

    numeric = data.select_dtypes(
        include=np.number
    )

    if numeric.empty:
        return {}

    summary = numeric.describe().transpose()

    summary = summary.replace(
        [np.inf, -np.inf],
        np.nan
    )

    summary = summary.astype(
        object
    ).where(
        pd.notna(summary),
        None
    )

    return summary.to_dict(
        orient="index"
    )


# ==========================================
# Categorical Summary
# ==========================================

def get_categorical_summary(
    data: pd.DataFrame
) -> dict:
    """
    Generate summary information for
    categorical columns.
    """

    data = validate_dataframe(data)

    categorical = data.select_dtypes(
        include=["object", "category"]
    )

    result = {}

    for column in categorical.columns:

        value_counts = (
            categorical[column]
            .value_counts(dropna=False)
            .head(20)
        )

        result[column] = {
            str(key): int(value)
            for key, value
            in value_counts.items()
        }

    return result


# ==========================================
# Correlation
# ==========================================

def calculate_correlation(
    data: pd.DataFrame,
    method: str = "pearson"
) -> pd.DataFrame:
    """
    Calculate correlation matrix.

    Supported:
        pearson
        spearman
        kendall
    """

    data = validate_dataframe(data)

    numeric = data.select_dtypes(
        include=np.number
    )

    if numeric.empty:
        return pd.DataFrame()

    if method not in {
        "pearson",
        "spearman",
        "kendall",
    }:
        raise ValueError(
            "Unsupported correlation method."
        )

    return numeric.corr(
        method=method
    )


# ==========================================
# Data Quality Report
# ==========================================

def generate_data_quality_report(
    data: pd.DataFrame
) -> dict:
    """
    Generate a complete data-quality report.
    """

    data = validate_dataframe(data)

    rows, columns = data.shape

    missing_count = int(
        data.isnull().sum().sum()
    )

    duplicate_count = int(
        data.duplicated().sum()
    )

    return {
        "rows": int(rows),
        "columns": int(columns),
        "missing_values": missing_count,
        "duplicate_rows": duplicate_count,
        "missing_percentage": (
            round(
                missing_count
                / (rows * columns)
                * 100,
                2
            )
            if rows > 0 and columns > 0
            else 0
        ),
        "column_types": detect_column_types(
            data
        ),
        "columns": [
            {
                "name": column,
                "type": str(
                    data[column].dtype
                ),
                "missing": int(
                    data[column].isnull().sum()
                ),
                "unique": int(
                    data[column].nunique(
                        dropna=True
                    )
                ),
            }
            for column in data.columns
        ],
    }


# ==========================================
# Automatic Cleaning
# ==========================================

def clean_dataset(
    data: pd.DataFrame,
    remove_duplicates: bool = True,
    fill_numeric: bool = True,
    fill_categorical: bool = True,
    strip_strings: bool = True
) -> pd.DataFrame:
    """
    Perform common dataset-cleaning operations.

    This function does not modify the original
    DataFrame.
    """

    data = validate_dataframe(data)

    if remove_duplicates:
        data = data.drop_duplicates()

    if strip_strings:
        data = clean_string_columns(data)

    if fill_numeric:
        data = fill_missing_numeric(
            data,
            method="median"
        )

    if fill_categorical:
        data = fill_missing_categorical(
            data,
            value="Unknown"
        )

    return data.reset_index(drop=True)


# ==========================================
# Prepare Dataset for Analysis
# ==========================================

def prepare_for_analysis(
    data: pd.DataFrame
) -> dict:
    """
    Prepare a dataset for the Velocity BI
    analysis pipeline.

    Returns:
        Cleaned dataset
        Quality report
        Column types
        Numeric summary
        Categorical summary
    """

    data = validate_dataframe(data)

    original_shape = data.shape

    cleaned_data = clean_dataset(data)

    return {
        "data": cleaned_data,
        "original_rows": int(
            original_shape[0]
        ),
        "original_columns": int(
            original_shape[1]
        ),
        "cleaned_rows": int(
            cleaned_data.shape[0]
        ),
        "cleaned_columns": int(
            cleaned_data.shape[1]
        ),
        "quality_report":
            generate_data_quality_report(
                cleaned_data
            ),
        "column_types":
            detect_column_types(
                cleaned_data
            ),
        "numeric_summary":
            get_numeric_summary(
                cleaned_data
            ),
        "categorical_summary":
            get_categorical_summary(
                cleaned_data
            ),
    }


# ==========================================
# Convert DataFrame to JSON-Compatible Data
# ==========================================

def dataframe_to_records(
    data: pd.DataFrame,
    limit: Optional[int] = None
) -> list[dict]:
    """
    Convert DataFrame into JSON-compatible
    records for Flask API responses.
    """

    data = validate_dataframe(data)

    if limit is not None:
        data = data.head(limit)

    data = data.replace(
        [np.inf, -np.inf],
        np.nan
    )

    data = data.astype(
        object
    ).where(
        pd.notna(data),
        None
    )

    return data.to_dict(
        orient="records"
    )


# ==========================================
# Exported Functions
# ==========================================

__all__ = [
    "validate_dataframe",
    "get_shape",
    "get_column_names",
    "get_data_types",
    "get_missing_values",
    "get_missing_percentage",
    "drop_missing_rows",
    "drop_missing_columns",
    "fill_missing_numeric",
    "fill_missing_categorical",
    "count_duplicates",
    "remove_duplicates",
    "remove_columns",
    "rename_columns",
    "clean_string_columns",
    "lowercase_columns",
    "convert_numeric_columns",
    "convert_date_columns",
    "detect_column_types",
    "filter_rows",
    "sort_data",
    "sample_data",
    "aggregate_data",
    "one_hot_encode",
    "detect_outliers_iqr",
    "remove_outliers_iqr",
    "get_numeric_summary",
    "get_categorical_summary",
    "calculate_correlation",
    "generate_data_quality_report",
    "clean_dataset",
    "prepare_for_analysis",
    "dataframe_to_records",
]