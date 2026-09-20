# ==========================================
# Velocity BI - Visualization Service
# File: backend/services/visualization_service.py
# ==========================================

import os
import pandas as pd
import numpy as np


# ==========================================
# Supported Visualization Types
# ==========================================

SUPPORTED_CHARTS = {
    "bar",
    "line",
    "pie",
    "scatter",
    "histogram",
    "area",
    "box",
    "heatmap"
}


# ==========================================
# Load Dataset
# ==========================================

def load_dataset(file_path):
    """
    Load CSV, Excel, or JSON dataset.
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
    Check whether requested columns exist.
    """

    if not columns:
        raise ValueError(
            "At least one column is required."
        )

    missing = [
        column
        for column in columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Columns not found: {missing}"
        )

    return True


# ==========================================
# Get Available Columns
# ==========================================

def get_available_columns(df):
    """
    Return columns grouped by data type.
    """

    numeric = df.select_dtypes(
        include=np.number
    ).columns.tolist()

    categorical = df.select_dtypes(
        include=[
            "object",
            "category",
            "bool"
        ]
    ).columns.tolist()

    datetime_columns = []

    for column in df.columns:

        if pd.api.types.is_datetime64_any_dtype(
            df[column]
        ):
            datetime_columns.append(column)

    return {
        "all": df.columns.tolist(),
        "numeric": numeric,
        "categorical": categorical,
        "datetime": datetime_columns
    }


# ==========================================
# Bar Chart
# ==========================================

def create_bar_chart(
    df,
    category_column,
    value_column,
    aggregation="sum",
    limit=None
):
    """
    Prepare data for a bar chart.

    Example:
        category_column = "product"
        value_column = "sales"
        aggregation = "sum"
    """

    validate_columns(
        df,
        [category_column, value_column]
    )

    if aggregation not in {
        "sum",
        "mean",
        "count",
        "min",
        "max",
        "median"
    }:
        raise ValueError(
            "Invalid aggregation."
        )

    grouped = (
        df.groupby(
            category_column,
            dropna=False
        )[value_column]
    )

    if aggregation == "sum":
        result = grouped.sum()

    elif aggregation == "mean":
        result = grouped.mean()

    elif aggregation == "count":
        result = grouped.count()

    elif aggregation == "min":
        result = grouped.min()

    elif aggregation == "max":
        result = grouped.max()

    elif aggregation == "median":
        result = grouped.median()

    result = (
        result
        .reset_index()
        .rename(
            columns={
                category_column: "category",
                value_column: "value"
            }
        )
    )

    result["value"] = result["value"].apply(
        safe_value
    )

    if limit:
        result = result.nlargest(
            limit,
            "value"
        )

    return {
        "chart_type": "bar",
        "x_key": "category",
        "series": [
            {
                "data_key": "value",
                "label": value_column
            }
        ],
        "data": dataframe_to_records(result)
    }


# ==========================================
# Line Chart
# ==========================================

def create_line_chart(
    df,
    x_column,
    y_column,
    aggregation="sum"
):
    """
    Prepare data for line chart.
    """

    validate_columns(
        df,
        [x_column, y_column]
    )

    working_df = df.copy()

    # Try converting x-axis into datetime
    converted = pd.to_datetime(
        working_df[x_column],
        errors="coerce"
    )

    if converted.notna().mean() >= 0.8:
        working_df[x_column] = converted
        working_df = working_df.sort_values(
            x_column
        )

    grouped = (
        working_df
        .groupby(
            x_column,
            dropna=False
        )[y_column]
    )

    if aggregation == "sum":
        result = grouped.sum()

    elif aggregation == "mean":
        result = grouped.mean()

    elif aggregation == "count":
        result = grouped.count()

    elif aggregation == "min":
        result = grouped.min()

    elif aggregation == "max":
        result = grouped.max()

    elif aggregation == "median":
        result = grouped.median()

    else:
        raise ValueError(
            "Invalid aggregation."
        )

    result = (
        result
        .reset_index()
        .rename(
            columns={
                x_column: "x",
                y_column: "y"
            }
        )
    )

    return {
        "chart_type": "line",
        "x_key": "x",
        "series": [
            {
                "data_key": "y",
                "label": y_column
            }
        ],
        "data": dataframe_to_records(result)
    }


# ==========================================
# Pie Chart
# ==========================================

def create_pie_chart(
    df,
    category_column,
    value_column,
    aggregation="sum",
    limit=10
):
    """
    Prepare data for pie chart.
    """

    validate_columns(
        df,
        [category_column, value_column]
    )

    grouped = (
        df.groupby(
            category_column,
            dropna=False
        )[value_column]
    )

    if aggregation == "sum":
        result = grouped.sum()

    elif aggregation == "count":
        result = grouped.count()

    elif aggregation == "mean":
        result = grouped.mean()

    else:
        raise ValueError(
            "Invalid pie chart aggregation."
        )

    result = (
        result
        .reset_index()
        .rename(
            columns={
                category_column: "name",
                value_column: "value"
            }
        )
    )

    result = result.nlargest(
        limit,
        "value"
    )

    return {
        "chart_type": "pie",
        "name_key": "name",
        "value_key": "value",
        "data": dataframe_to_records(result)
    }


# ==========================================
# Scatter Chart
# ==========================================

def create_scatter_chart(
    df,
    x_column,
    y_column
):
    """
    Prepare numeric x/y data for scatter plot.
    """

    validate_columns(
        df,
        [x_column, y_column]
    )

    if not pd.api.types.is_numeric_dtype(
        df[x_column]
    ):
        raise ValueError(
            f"{x_column} must be numeric."
        )

    if not pd.api.types.is_numeric_dtype(
        df[y_column]
    ):
        raise ValueError(
            f"{y_column} must be numeric."
        )

    result = df[
        [x_column, y_column]
    ].dropna()

    result = result.rename(
        columns={
            x_column: "x",
            y_column: "y"
        }
    )

    return {
        "chart_type": "scatter",
        "x_key": "x",
        "series": [
            {
                "data_key": "y",
                "label": y_column
            }
        ],
        "data": dataframe_to_records(result)
    }


# ==========================================
# Histogram
# ==========================================

def create_histogram(
    df,
    column,
    bins=10
):
    """
    Prepare histogram data.
    """

    validate_columns(
        df,
        [column]
    )

    if not pd.api.types.is_numeric_dtype(
        df[column]
    ):
        raise ValueError(
            f"{column} must be numeric."
        )

    values = df[column].dropna()

    if values.empty:
        return {
            "chart_type": "histogram",
            "data": []
        }

    counts, edges = np.histogram(
        values,
        bins=bins
    )

    data = []

    for index, count in enumerate(counts):

        data.append({
            "bin_start": safe_value(
                edges[index]
            ),
            "bin_end": safe_value(
                edges[index + 1]
            ),
            "count": int(count)
        })

    return {
        "chart_type": "histogram",
        "x_key": "bin_start",
        "series": [
            {
                "data_key": "count",
                "label": "Frequency"
            }
        ],
        "data": data
    }


# ==========================================
# Area Chart
# ==========================================

def create_area_chart(
    df,
    x_column,
    y_column,
    aggregation="sum"
):
    """
    Prepare area chart data.

    Area charts use the same aggregated
    structure as line charts.
    """

    result = create_line_chart(
        df,
        x_column,
        y_column,
        aggregation
    )

    result["chart_type"] = "area"

    return result


# ==========================================
# Box Plot Statistics
# ==========================================

def create_box_plot(
    df,
    column
):
    """
    Calculate box plot statistics.
    """

    validate_columns(
        df,
        [column]
    )

    if not pd.api.types.is_numeric_dtype(
        df[column]
    ):
        raise ValueError(
            f"{column} must be numeric."
        )

    values = df[column].dropna()

    if values.empty:
        return {
            "chart_type": "box",
            "data": []
        }

    q1 = values.quantile(0.25)
    median = values.quantile(0.50)
    q3 = values.quantile(0.75)

    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    return {
        "chart_type": "box",
        "column": column,
        "statistics": {
            "minimum": safe_value(
                values.min()
            ),
            "q1": safe_value(q1),
            "median": safe_value(median),
            "q3": safe_value(q3),
            "maximum": safe_value(
                values.max()
            ),
            "lower_bound": safe_value(lower),
            "upper_bound": safe_value(upper)
        }
    }


# ==========================================
# Heatmap / Correlation Matrix
# ==========================================

def create_heatmap(df):
    """
    Create correlation matrix for
    numeric columns.
    """

    numeric_df = df.select_dtypes(
        include=np.number
    )

    if numeric_df.empty:
        return {
            "chart_type": "heatmap",
            "columns": [],
            "data": []
        }

    correlation = (
        numeric_df
        .corr()
        .replace(
            [np.inf, -np.inf],
            np.nan
        )
        .fillna(0)
    )

    data = []

    for row_name in correlation.index:

        for column_name in correlation.columns:

            data.append({
                "x": column_name,
                "y": row_name,
                "value": safe_value(
                    correlation.loc[
                        row_name,
                        column_name
                    ]
                )
            })

    return {
        "chart_type": "heatmap",
        "columns": correlation.columns.tolist(),
        "data": data
    }


# ==========================================
# Automatic Visualization
# ==========================================

def auto_visualize(
    df,
    chart_type,
    x_column=None,
    y_column=None,
    category_column=None,
    value_column=None
):
    """
    Automatically select the appropriate
    visualization method.
    """

    if chart_type not in SUPPORTED_CHARTS:
        raise ValueError(
            f"Unsupported chart type: {chart_type}"
        )

    if chart_type == "bar":

        return create_bar_chart(
            df,
            category_column or x_column,
            value_column or y_column
        )

    if chart_type == "line":

        return create_line_chart(
            df,
            x_column,
            y_column
        )

    if chart_type == "pie":

        return create_pie_chart(
            df,
            category_column or x_column,
            value_column or y_column
        )

    if chart_type == "scatter":

        return create_scatter_chart(
            df,
            x_column,
            y_column
        )

    if chart_type == "histogram":

        return create_histogram(
            df,
            x_column
        )

    if chart_type == "area":

        return create_area_chart(
            df,
            x_column,
            y_column
        )

    if chart_type == "box":

        return create_box_plot(
            df,
            x_column
        )

    if chart_type == "heatmap":

        return create_heatmap(df)

    raise ValueError(
        "Unable to create visualization."
    )


# ==========================================
# Complete Visualization Service
# ==========================================

def generate_visualization(
    file_path,
    chart_type,
    x_column=None,
    y_column=None,
    category_column=None,
    value_column=None
):
    """
    Main service function.

    Loads the dataset and generates
    visualization-ready JSON data.
    """

    df = load_dataset(file_path)

    result = auto_visualize(
        df=df,
        chart_type=chart_type,
        x_column=x_column,
        y_column=y_column,
        category_column=category_column,
        value_column=value_column
    )

    result["success"] = True
    result["dataset_rows"] = int(
        len(df)
    )

    return result


# ==========================================
# DataFrame -> JSON Records
# ==========================================

def dataframe_to_records(df):
    """
    Convert DataFrame into JSON-safe records.
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
# JSON Safe Value
# ==========================================

def make_json_safe(value):
    """
    Convert NumPy/Pandas values to
    standard Python values.
    """

    if value is None:
        return None

    try:

        if pd.isna(value):
            return None

    except (TypeError, ValueError):
        pass

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return safe_value(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    return value


# ==========================================
# Safe Numeric Conversion
# ==========================================

def safe_value(value):
    """
    Convert numeric values safely.
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