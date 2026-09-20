# ==========================================
# Velocity BI - Time Series Service
# File: backend/services/time_series_service.py
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
# Load Dataset
# ==========================================

def load_dataset(file_path):
    """
    Load a dataset from CSV, Excel, or JSON.
    """

    if not file_path:
        raise ValueError("File path is required.")

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            "Dataset file not found."
        )

    extension = os.path.splitext(
        file_path
    )[1].lower()

    if extension == ".csv":
        return pd.read_csv(file_path)

    if extension in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)

    if extension == ".json":
        return pd.read_json(file_path)

    raise ValueError(
        "Unsupported file format. "
        "Use CSV, Excel, or JSON."
    )


# ==========================================
# Validate Columns
# ==========================================

def validate_columns(df, columns):
    """
    Check that required columns exist.
    """

    missing = [
        column
        for column in columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Columns not found: {missing}"
        )


# ==========================================
# Prepare Time Series
# ==========================================

def prepare_time_series(
    df,
    date_column,
    value_column
):
    """
    Convert date column to datetime and
    prepare a clean time-series DataFrame.
    """

    validate_columns(
        df,
        [date_column, value_column]
    )

    result = df[
        [date_column, value_column]
    ].copy()

    result[date_column] = pd.to_datetime(
        result[date_column],
        errors="coerce"
    )

    result[value_column] = pd.to_numeric(
        result[value_column],
        errors="coerce"
    )

    result = result.dropna(
        subset=[
            date_column,
            value_column
        ]
    )

    result = result.sort_values(
        date_column
    )

    return result


# ==========================================
# Aggregate Time Series
# ==========================================

def aggregate_time_series(
    df,
    date_column,
    value_column,
    frequency="D",
    aggregation="sum"
):
    """
    Aggregate time-series data.

    Frequencies:
        D  = Daily
        W  = Weekly
        M  = Monthly
        Q  = Quarterly
        Y  = Yearly
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    result = result.set_index(
        date_column
    )

    if aggregation == "sum":
        series = result[value_column].resample(
            frequency
        ).sum()

    elif aggregation == "mean":
        series = result[value_column].resample(
            frequency
        ).mean()

    elif aggregation == "min":
        series = result[value_column].resample(
            frequency
        ).min()

    elif aggregation == "max":
        series = result[value_column].resample(
            frequency
        ).max()

    elif aggregation == "count":
        series = result[value_column].resample(
            frequency
        ).count()

    elif aggregation == "median":
        series = result[value_column].resample(
            frequency
        ).median()

    else:
        raise ValueError(
            "Unsupported aggregation. "
            "Use sum, mean, min, max, count, "
            "or median."
        )

    output = series.reset_index()

    return output


# ==========================================
# Moving Average
# ==========================================

def calculate_moving_average(
    df,
    date_column,
    value_column,
    window=7
):
    """
    Calculate rolling/moving average.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    if window <= 0:
        raise ValueError(
            "Window must be greater than zero."
        )

    result["moving_average"] = (
        result[value_column]
        .rolling(
            window=window,
            min_periods=1
        )
        .mean()
    )

    return result


# ==========================================
# Exponential Moving Average
# ==========================================

def calculate_ema(
    df,
    date_column,
    value_column,
    span=7
):
    """
    Calculate Exponential Moving Average.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    if span <= 0:
        raise ValueError(
            "EMA span must be greater than zero."
        )

    result["ema"] = (
        result[value_column]
        .ewm(
            span=span,
            adjust=False
        )
        .mean()
    )

    return result


# ==========================================
# Growth Rate
# ==========================================

def calculate_growth_rate(
    df,
    date_column,
    value_column,
    periods=1
):
    """
    Calculate percentage growth between
    time-series observations.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    if periods <= 0:
        raise ValueError(
            "Periods must be greater than zero."
        )

    result["growth_rate"] = (
        result[value_column]
        .pct_change(periods=periods)
        * 100
    )

    return result


# ==========================================
# Cumulative Value
# ==========================================

def calculate_cumulative(
    df,
    date_column,
    value_column
):
    """
    Calculate cumulative total.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    result["cumulative"] = (
        result[value_column].cumsum()
    )

    return result


# ==========================================
# Trend Analysis
# ==========================================

def analyze_trend(
    df,
    date_column,
    value_column
):
    """
    Calculate a basic linear trend.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    if len(result) < 2:
        return {
            "trend": "insufficient_data",
            "slope": None,
            "r_squared": None
        }

    x = np.arange(
        len(result),
        dtype=float
    )

    y = result[value_column].values.astype(
        float
    )

    slope, intercept = np.polyfit(
        x,
        y,
        1
    )

    predicted = (
        slope * x
        + intercept
    )

    ss_res = np.sum(
        (y - predicted) ** 2
    )

    ss_tot = np.sum(
        (y - np.mean(y)) ** 2
    )

    if ss_tot == 0:
        r_squared = 0
    else:
        r_squared = 1 - (
            ss_res / ss_tot
        )

    if slope > 0:
        trend = "increasing"

    elif slope < 0:
        trend = "decreasing"

    else:
        trend = "stable"

    return {
        "trend": trend,
        "slope": safe_float(slope),
        "intercept": safe_float(intercept),
        "r_squared": safe_float(
            r_squared
        )
    }


# ==========================================
# Seasonal Statistics
# ==========================================

def calculate_seasonality(
    df,
    date_column,
    value_column
):
    """
    Calculate monthly and weekday patterns.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    result["month"] = (
        result[date_column].dt.month
    )

    result["month_name"] = (
        result[date_column]
        .dt.month_name()
    )

    result["weekday"] = (
        result[date_column].dt.dayofweek
    )

    result["weekday_name"] = (
        result[date_column]
        .dt.day_name()
    )

    monthly = (
        result
        .groupby(
            ["month", "month_name"]
        )[value_column]
        .mean()
        .reset_index()
    )

    weekday = (
        result
        .groupby(
            ["weekday", "weekday_name"]
        )[value_column]
        .mean()
        .reset_index()
    )

    return {
        "monthly": dataframe_to_records(
            monthly
        ),
        "weekday": dataframe_to_records(
            weekday
        )
    }


# ==========================================
# Time Series Statistics
# ==========================================

def get_time_series_statistics(
    df,
    date_column,
    value_column
):
    """
    Return basic time-series statistics.
    """

    result = prepare_time_series(
        df,
        date_column,
        value_column
    )

    if result.empty:
        return {
            "count": 0
        }

    values = result[value_column]

    return {
        "count": int(len(values)),
        "start_date": (
            result[date_column]
            .min()
            .isoformat()
        ),
        "end_date": (
            result[date_column]
            .max()
            .isoformat()
        ),
        "minimum": safe_float(
            values.min()
        ),
        "maximum": safe_float(
            values.max()
        ),
        "mean": safe_float(
            values.mean()
        ),
        "median": safe_float(
            values.median()
        ),
        "standard_deviation": safe_float(
            values.std()
        ),
        "total": safe_float(
            values.sum()
        )
    }


# ==========================================
# Detect Missing Dates
# ==========================================

def detect_missing_dates(
    df,
    date_column,
    frequency="D"
):
    """
    Detect missing dates in a time series.
    """

    validate_columns(
        df,
        [date_column]
    )

    dates = pd.to_datetime(
        df[date_column],
        errors="coerce"
    ).dropna()

    if dates.empty:
        return {
            "missing_dates": [],
            "count": 0
        }

    dates = dates.sort_values()

    expected = pd.date_range(
        start=dates.min(),
        end=dates.max(),
        freq=frequency
    )

    actual = pd.DatetimeIndex(
        dates.unique()
    )

    missing = expected.difference(
        actual
    )

    return {
        "missing_dates": [
            date.isoformat()
            for date in missing
        ],
        "count": int(len(missing))
    }


# ==========================================
# Time Series Chart Data
# ==========================================

def get_chart_data(
    df,
    date_column,
    value_column,
    frequency="D",
    aggregation="sum"
):
    """
    Generate frontend-ready line chart data.
    """

    result = aggregate_time_series(
        df,
        date_column,
        value_column,
        frequency,
        aggregation
    )

    data = []

    for _, row in result.iterrows():

        data.append({
            "date": make_json_safe(
                row[date_column]
            ),
            "value": safe_float(
                row[value_column]
            )
        })

    return {
        "chart_type": "line",
        "x_key": "date",
        "series": [
            {
                "data_key": "value",
                "label": value_column
            }
        ],
        "data": data
    }


# ==========================================
# Complete Time Series Analysis
# ==========================================

def analyze_time_series(
    file_path,
    date_column,
    value_column,
    frequency="D",
    aggregation="sum",
    moving_average_window=7
):
    """
    Main time-series service.

    Loads the dataset and performs:
    - aggregation
    - statistics
    - trend analysis
    - moving average
    - growth rate
    - cumulative values
    - seasonality
    - missing date detection
    - chart data generation
    """

    df = load_dataset(
        file_path
    )

    prepared = prepare_time_series(
        df,
        date_column,
        value_column
    )

    aggregated = aggregate_time_series(
        df,
        date_column,
        value_column,
        frequency,
        aggregation
    )

    moving_average = calculate_moving_average(
        prepared,
        date_column,
        value_column,
        moving_average_window
    )

    growth = calculate_growth_rate(
        prepared,
        date_column,
        value_column
    )

    cumulative = calculate_cumulative(
        prepared,
        date_column,
        value_column
    )

    return {
        "success": True,

        "statistics": get_time_series_statistics(
            df,
            date_column,
            value_column
        ),

        "trend": analyze_trend(
            df,
            date_column,
            value_column
        ),

        "seasonality": calculate_seasonality(
            df,
            date_column,
            value_column
        ),

        "missing_dates": detect_missing_dates(
            df,
            date_column,
            frequency
        ),

        "aggregated_data":
            dataframe_to_records(
                aggregated
            ),

        "moving_average":
            dataframe_to_records(
                moving_average
            ),

        "growth_rate":
            dataframe_to_records(
                growth
            ),

        "cumulative":
            dataframe_to_records(
                cumulative
            ),

        "chart":
            get_chart_data(
                df,
                date_column,
                value_column,
                frequency,
                aggregation
            )
    }


# ==========================================
# DataFrame -> JSON Records
# ==========================================

def dataframe_to_records(df):
    """
    Convert DataFrame to JSON-safe records.
    """

    records = []

    for row in df.to_dict(
        orient="records"
    ):

        clean_row = {}

        for key, value in row.items():

            clean_row[key] = make_json_safe(
                value
            )

        records.append(clean_row)

    return records


# ==========================================
# JSON Safe Conversion
# ==========================================

def make_json_safe(value):
    """
    Convert Pandas/NumPy values
    to JSON-compatible values.
    """

    if value is None:
        return None

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return safe_float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return value


# ==========================================
# Safe Float
# ==========================================

def safe_float(value):
    """
    Convert a numeric value safely.
    """

    try:

        value = float(value)

        if np.isnan(value):
            return None

        if np.isinf(value):
            return None

        return round(value, 6)

    except (
        TypeError,
        ValueError
    ):
        return None