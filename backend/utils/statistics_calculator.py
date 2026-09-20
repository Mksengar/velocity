"""
==========================================
Velocity BI - Statistics Calculator
File: backend/utils/statistics_calculator.py
==========================================

Provides statistical calculations for:

- Descriptive statistics
- Mean, median, mode
- Variance and standard deviation
- Quartiles and percentiles
- Range
- Skewness and kurtosis
- Correlation
- Covariance
- Z-score
- IQR and outlier detection
- Frequency distribution
- Confidence intervals
- Dataset summary
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np
import pandas as pd


# ==========================================
# Helpers
# ==========================================

def _validate_numeric_series(
    data: Any
) -> pd.Series:
    """
    Convert input into a numeric Pandas Series.

    Invalid values are converted to NaN and removed.
    """

    if isinstance(data, pd.Series):
        series = data.copy()

    elif isinstance(data, (list, tuple, np.ndarray)):
        series = pd.Series(data)

    else:
        raise TypeError(
            "Input must be a Pandas Series, list, "
            "tuple, or NumPy array."
        )

    series = pd.to_numeric(
        series,
        errors="coerce"
    )

    series = series.replace(
        [np.inf, -np.inf],
        np.nan
    ).dropna()

    return series


def _safe_float(value: Any) -> Optional[float]:
    """
    Convert numeric values to JSON-friendly floats.
    """

    if value is None:
        return None

    try:
        value = float(value)

        if not np.isfinite(value):
            return None

        return value

    except (TypeError, ValueError):
        return None


# ==========================================
# Basic Statistics
# ==========================================

def calculate_mean(
    data: Any
) -> Optional[float]:
    """
    Calculate arithmetic mean.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(series.mean())


def calculate_median(
    data: Any
) -> Optional[float]:
    """
    Calculate median.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(series.median())


def calculate_mode(
    data: Any
) -> list:
    """
    Calculate mode.

    Returns a list because a dataset can have
    multiple modes.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return []

    modes = series.mode()

    return [
        _safe_float(value)
        for value in modes.tolist()
    ]


def calculate_min(
    data: Any
) -> Optional[float]:
    """
    Calculate minimum value.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(series.min())


def calculate_max(
    data: Any
) -> Optional[float]:
    """
    Calculate maximum value.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(series.max())


def calculate_range(
    data: Any
) -> Optional[float]:
    """
    Calculate range:

        maximum - minimum
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(
        series.max() - series.min()
    )


# ==========================================
# Variance and Standard Deviation
# ==========================================

def calculate_variance(
    data: Any,
    sample: bool = True
) -> Optional[float]:
    """
    Calculate variance.

    Args:
        sample=True:
            Sample variance.

        sample=False:
            Population variance.
    """

    series = _validate_numeric_series(data)

    if len(series) < 1:
        return None

    ddof = 1 if sample else 0

    if sample and len(series) < 2:
        return None

    return _safe_float(
        series.var(ddof=ddof)
    )


def calculate_standard_deviation(
    data: Any,
    sample: bool = True
) -> Optional[float]:
    """
    Calculate standard deviation.
    """

    series = _validate_numeric_series(data)

    if len(series) < 1:
        return None

    ddof = 1 if sample else 0

    if sample and len(series) < 2:
        return None

    return _safe_float(
        series.std(ddof=ddof)
    )


# ==========================================
# Quartiles and Percentiles
# ==========================================

def calculate_percentile(
    data: Any,
    percentile: float
) -> Optional[float]:
    """
    Calculate a percentile.

    percentile must be between 0 and 100.
    """

    if not 0 <= percentile <= 100:
        raise ValueError(
            "Percentile must be between 0 and 100."
        )

    series = _validate_numeric_series(data)

    if series.empty:
        return None

    return _safe_float(
        np.percentile(
            series,
            percentile
        )
    )


def calculate_quartiles(
    data: Any
) -> dict:
    """
    Calculate Q1, Q2, and Q3.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return {
            "q1": None,
            "q2": None,
            "q3": None,
        }

    return {
        "q1": _safe_float(
            series.quantile(0.25)
        ),
        "q2": _safe_float(
            series.quantile(0.50)
        ),
        "q3": _safe_float(
            series.quantile(0.75)
        ),
    }


def calculate_iqr(
    data: Any
) -> Optional[float]:
    """
    Calculate Interquartile Range:

        IQR = Q3 - Q1
    """

    quartiles = calculate_quartiles(data)

    if (
        quartiles["q1"] is None
        or quartiles["q3"] is None
    ):
        return None

    return _safe_float(
        quartiles["q3"]
        - quartiles["q1"]
    )


# ==========================================
# Skewness and Kurtosis
# ==========================================

def calculate_skewness(
    data: Any
) -> Optional[float]:
    """
    Calculate sample skewness.
    """

    series = _validate_numeric_series(data)

    if len(series) < 3:
        return None

    return _safe_float(
        series.skew()
    )


def calculate_kurtosis(
    data: Any
) -> Optional[float]:
    """
    Calculate excess kurtosis.
    """

    series = _validate_numeric_series(data)

    if len(series) < 4:
        return None

    return _safe_float(
        series.kurt()
    )


# ==========================================
# Correlation
# ==========================================

def calculate_correlation(
    x: Any,
    y: Any,
    method: str = "pearson"
) -> Optional[float]:
    """
    Calculate correlation between two variables.

    Supported:
        pearson
        spearman
        kendall
    """

    x_series = _validate_numeric_series(x)
    y_series = _validate_numeric_series(y)

    if method not in {
        "pearson",
        "spearman",
        "kendall",
    }:
        raise ValueError(
            "Method must be pearson, spearman, "
            "or kendall."
        )

    if len(x_series) != len(y_series):
        min_length = min(
            len(x_series),
            len(y_series)
        )

        x_series = x_series.iloc[
            :min_length
        ]

        y_series = y_series.iloc[
            :min_length
        ]

    if len(x_series) < 2:
        return None

    correlation = x_series.corr(
        y_series,
        method=method
    )

    return _safe_float(correlation)


# ==========================================
# Covariance
# ==========================================

def calculate_covariance(
    x: Any,
    y: Any,
    sample: bool = True
) -> Optional[float]:
    """
    Calculate covariance between two variables.
    """

    x_series = _validate_numeric_series(x)
    y_series = _validate_numeric_series(y)

    if len(x_series) != len(y_series):
        min_length = min(
            len(x_series),
            len(y_series)
        )

        x_series = x_series.iloc[
            :min_length
        ]

        y_series = y_series.iloc[
            :min_length
        ]

    if len(x_series) < 2:
        return None

    ddof = 1 if sample else 0

    covariance = np.cov(
        x_series,
        y_series,
        ddof=ddof
    )[0, 1]

    return _safe_float(covariance)


# ==========================================
# Z-Score
# ==========================================

def calculate_z_scores(
    data: Any
) -> list[Optional[float]]:
    """
    Calculate z-score for every value.

        z = (x - mean) / standard deviation
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return []

    mean = series.mean()
    std = series.std(ddof=0)

    if std == 0:
        return [0.0] * len(series)

    z_scores = (
        (series - mean) / std
    )

    return [
        _safe_float(value)
        for value in z_scores
    ]


# ==========================================
# Outlier Detection
# ==========================================

def detect_iqr_outliers(
    data: Any
) -> dict:
    """
    Detect outliers using the IQR method.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return {
            "lower_bound": None,
            "upper_bound": None,
            "outlier_count": 0,
            "outliers": [],
        }

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    outliers = series[
        (series < lower_bound)
        | (series > upper_bound)
    ]

    return {
        "lower_bound": _safe_float(
            lower_bound
        ),
        "upper_bound": _safe_float(
            upper_bound
        ),
        "outlier_count": int(
            len(outliers)
        ),
        "outliers": [
            _safe_float(value)
            for value in outliers.tolist()
        ],
    }


# ==========================================
# Frequency Distribution
# ==========================================

def calculate_frequency(
    data: Any,
    normalize: bool = False
) -> dict:
    """
    Calculate frequency of values.
    """

    if isinstance(data, pd.Series):
        series = data.copy()
    else:
        series = pd.Series(data)

    if normalize:
        frequencies = (
            series.value_counts(
                normalize=True,
                dropna=False
            )
        )
    else:
        frequencies = (
            series.value_counts(
                dropna=False
            )
        )

    result = {}

    for key, value in frequencies.items():

        if pd.isna(key):
            key = "NaN"
        else:
            key = str(key)

        if normalize:
            result[key] = round(
                float(value),
                6
            )
        else:
            result[key] = int(value)

    return result


# ==========================================
# Five Number Summary
# ==========================================

def five_number_summary(
    data: Any
) -> dict:
    """
    Calculate:

        Minimum
        Q1
        Median
        Q3
        Maximum
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return {
            "minimum": None,
            "q1": None,
            "median": None,
            "q3": None,
            "maximum": None,
        }

    return {
        "minimum": _safe_float(
            series.min()
        ),
        "q1": _safe_float(
            series.quantile(0.25)
        ),
        "median": _safe_float(
            series.median()
        ),
        "q3": _safe_float(
            series.quantile(0.75)
        ),
        "maximum": _safe_float(
            series.max()
        ),
    }


# ==========================================
# Descriptive Statistics
# ==========================================

def descriptive_statistics(
    data: Any
) -> dict:
    """
    Calculate a complete descriptive
    statistical summary.
    """

    series = _validate_numeric_series(data)

    if series.empty:
        return {
            "count": 0,
            "mean": None,
            "median": None,
            "mode": [],
            "minimum": None,
            "maximum": None,
            "range": None,
            "variance": None,
            "standard_deviation": None,
            "q1": None,
            "q2": None,
            "q3": None,
            "iqr": None,
            "skewness": None,
            "kurtosis": None,
        }

    quartiles = calculate_quartiles(
        series
    )

    return {
        "count": int(len(series)),
        "mean": calculate_mean(series),
        "median": calculate_median(series),
        "mode": calculate_mode(series),
        "minimum": calculate_min(series),
        "maximum": calculate_max(series),
        "range": calculate_range(series),
        "variance": calculate_variance(series),
        "standard_deviation":
            calculate_standard_deviation(series),
        "q1": quartiles["q1"],
        "q2": quartiles["q2"],
        "q3": quartiles["q3"],
        "iqr": calculate_iqr(series),
        "skewness": calculate_skewness(series),
        "kurtosis": calculate_kurtosis(series),
    }


# ==========================================
# Confidence Interval
# ==========================================

def calculate_confidence_interval(
    data: Any,
    confidence: float = 0.95
) -> dict:
    """
    Calculate confidence interval for the mean.

    Uses the t-distribution.
    """

    if not 0 < confidence < 1:
        raise ValueError(
            "Confidence must be between 0 and 1."
        )

    series = _validate_numeric_series(data)

    n = len(series)

    if n < 2:
        return {
            "mean": None,
            "lower": None,
            "upper": None,
            "confidence": confidence,
        }

    mean = series.mean()
    std = series.std(ddof=1)

    try:
        from scipy import stats

        standard_error = (
            std / np.sqrt(n)
        )

        margin = (
            stats.t.ppf(
                (1 + confidence) / 2,
                df=n - 1
            )
            * standard_error
        )

    except ImportError:
        # Normal approximation if SciPy
        # is not installed.
        z_values = {
            0.90: 1.645,
            0.95: 1.960,
            0.99: 2.576,
        }

        z = z_values.get(
            round(confidence, 2),
            1.960
        )

        margin = (
            z * std / np.sqrt(n)
        )

    return {
        "mean": _safe_float(mean),
        "lower": _safe_float(
            mean - margin
        ),
        "upper": _safe_float(
            mean + margin
        ),
        "confidence": confidence,
    }


# ==========================================
# Dataset Statistics
# ==========================================

def calculate_column_statistics(
    data: pd.DataFrame
) -> dict:
    """
    Calculate descriptive statistics for
    every numeric column.
    """

    if not isinstance(
        data,
        pd.DataFrame
    ):
        raise TypeError(
            "Input must be a Pandas DataFrame."
        )

    numeric_columns = data.select_dtypes(
        include=np.number
    ).columns

    result = {}

    for column in numeric_columns:
        result[column] = descriptive_statistics(
            data[column]
        )

    return result


def calculate_dataset_statistics(
    data: pd.DataFrame
) -> dict:
    """
    Generate a complete statistical report
    for a dataset.
    """

    if not isinstance(
        data,
        pd.DataFrame
    ):
        raise TypeError(
            "Input must be a Pandas DataFrame."
        )

    numeric_columns = data.select_dtypes(
        include=np.number
    ).columns.tolist()

    categorical_columns = data.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    return {
        "rows": int(data.shape[0]),
        "columns": int(data.shape[1]),
        "numeric_columns": numeric_columns,
        "categorical_columns":
            categorical_columns,
        "statistics":
            calculate_column_statistics(data),
        "missing_values": {
            column: int(value)
            for column, value
            in data.isnull().sum().items()
        },
        "duplicate_rows": int(
            data.duplicated().sum()
        ),
    }


# ==========================================
# Exported Functions
# ==========================================

__all__ = [
    "calculate_mean",
    "calculate_median",
    "calculate_mode",
    "calculate_min",
    "calculate_max",
    "calculate_range",
    "calculate_variance",
    "calculate_standard_deviation",
    "calculate_percentile",
    "calculate_quartiles",
    "calculate_iqr",
    "calculate_skewness",
    "calculate_kurtosis",
    "calculate_correlation",
    "calculate_covariance",
    "calculate_z_scores",
    "detect_iqr_outliers",
    "calculate_frequency",
    "five_number_summary",
    "descriptive_statistics",
    "calculate_confidence_interval",
    "calculate_column_statistics",
    "calculate_dataset_statistics",
]