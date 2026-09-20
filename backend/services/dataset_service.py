```python
# ==========================================
# Velocity BI - Dataset Service
# File: backend/services/dataset_service.py
# ==========================================

import json
import os
import uuid
from datetime import datetime, timezone

import pandas as pd


# ==========================================
# Supported File Types
# ==========================================

ALLOWED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls",
    ".json"
}

MAX_FILE_SIZE_MB = 50


# ==========================================
# Dataset Service
# ==========================================

class DatasetService:
    """
    Handles dataset upload, validation, loading,
    preview, statistics, and dataset management.
    """

    # ------------------------------------------
    # File Validation
    # ------------------------------------------

    @staticmethod
    def allowed_file(filename):
        """
        Check whether a file extension is supported.

        Args:
            filename: Uploaded filename.

        Returns:
            True or False.
        """

        if not filename:
            return False

        extension = os.path.splitext(
            filename
        )[1].lower()

        return extension in ALLOWED_EXTENSIONS

    @staticmethod
    def get_extension(filename):
        """
        Get file extension.

        Args:
            filename: Filename.

        Returns:
            Extension including dot.
        """

        return os.path.splitext(
            filename
        )[1].lower()

    @staticmethod
    def validate_file(file):
        """
        Validate an uploaded Flask file.

        Args:
            file: Flask uploaded file object.

        Returns:
            Tuple: (is_valid, error_message)
        """

        if file is None:
            return False, "No file was provided."

        if not file.filename:
            return False, "Filename is missing."

        if not DatasetService.allowed_file(
            file.filename
        ):
            return (
                False,
                "Unsupported file type. "
                "Use CSV, XLSX, XLS, or JSON."
            )

        # Check file size when possible.
        try:
            file.seek(0, os.SEEK_END)
            size_bytes = file.tell()
            file.seek(0)

            max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024

            if size_bytes > max_bytes:
                return (
                    False,
                    f"File size cannot exceed "
                    f"{MAX_FILE_SIZE_MB} MB."
                )

        except (OSError, AttributeError):
            pass

        return True, None

    # ------------------------------------------
    # Generate Dataset ID
    # ------------------------------------------

    @staticmethod
    def generate_dataset_id():
        """
        Generate a unique dataset ID.
        """

        return str(uuid.uuid4())

    # ------------------------------------------
    # Load Dataset
    # ------------------------------------------

    @staticmethod
    def load_dataset(file_path):
        """
        Load a dataset using pandas.

        Args:
            file_path: Path to dataset file.

        Returns:
            pandas DataFrame.
        """

        extension = DatasetService.get_extension(
            file_path
        )

        if extension == ".csv":
            return pd.read_csv(file_path)

        if extension in [".xlsx", ".xls"]:
            return pd.read_excel(file_path)

        if extension == ".json":
            return pd.read_json(file_path)

        raise ValueError(
            "Unsupported dataset format."
        )

    # ------------------------------------------
    # Load Uploaded File
    # ------------------------------------------

    @staticmethod
    def load_uploaded_file(file):
        """
        Load a Flask uploaded file directly.

        Args:
            file: Flask uploaded file.

        Returns:
            pandas DataFrame.
        """

        is_valid, error = DatasetService.validate_file(
            file
        )

        if not is_valid:
            raise ValueError(error)

        extension = DatasetService.get_extension(
            file.filename
        )

        try:

            if extension == ".csv":
                return pd.read_csv(file)

            if extension in [".xlsx", ".xls"]:
                return pd.read_excel(file)

            if extension == ".json":
                return pd.read_json(file)

        except Exception as error:
            raise ValueError(
                f"Unable to read dataset: {error}"
            )

        raise ValueError(
            "Unsupported dataset format."
        )

    # ------------------------------------------
    # Save Uploaded File
    # ------------------------------------------

    @staticmethod
    def save_uploaded_file(
        file,
        upload_folder
    ):
        """
        Save uploaded dataset to disk.

        Args:
            file: Flask uploaded file.
            upload_folder: Dataset storage directory.

        Returns:
            Dictionary containing dataset information.
        """

        is_valid, error = DatasetService.validate_file(
            file
        )

        if not is_valid:
            raise ValueError(error)

        os.makedirs(
            upload_folder,
            exist_ok=True
        )

        dataset_id = DatasetService.generate_dataset_id()

        original_name = file.filename

        extension = DatasetService.get_extension(
            original_name
        )

        safe_filename = (
            f"{dataset_id}{extension}"
        )

        file_path = os.path.join(
            upload_folder,
            safe_filename
        )

        file.save(file_path)

        return {
            "dataset_id": dataset_id,
            "original_filename": original_name,
            "filename": safe_filename,
            "file_path": file_path,
            "file_type": extension.replace(".", ""),
            "uploaded_at": datetime.now(
                timezone.utc
            ).isoformat()
        }

    # ------------------------------------------
    # Dataset Preview
    # ------------------------------------------

    @staticmethod
    def preview_dataset(
        file_path,
        rows=10
    ):
        """
        Return the first rows of a dataset.

        Args:
            file_path: Dataset path.
            rows: Number of rows to return.

        Returns:
            Dictionary containing preview data.
        """

        if rows < 1:
            rows = 10

        rows = min(rows, 100)

        dataframe = DatasetService.load_dataset(
            file_path
        )

        preview = dataframe.head(rows)

        return {
            "columns": list(
                dataframe.columns
            ),
            "rows": preview.to_dict(
                orient="records"
            ),
            "total_rows": len(dataframe),
            "total_columns": len(
                dataframe.columns
            )
        }

    # ------------------------------------------
    # Dataset Information
    # ------------------------------------------

    @staticmethod
    def get_dataset_info(file_path):
        """
        Get basic information about a dataset.

        Args:
            file_path: Dataset path.

        Returns:
            Dataset metadata.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        columns = []

        for column in dataframe.columns:

            columns.append({
                "name": str(column),
                "data_type": str(
                    dataframe[column].dtype
                ),
                "missing_values": int(
                    dataframe[column].isna().sum()
                ),
                "unique_values": int(
                    dataframe[column].nunique(
                        dropna=True
                    )
                )
            })

        return {
            "rows": int(len(dataframe)),
            "columns": int(
                len(dataframe.columns)
            ),
            "column_details": columns,
            "memory_usage_bytes": int(
                dataframe.memory_usage(
                    deep=True
                ).sum()
            )
        }

    # ------------------------------------------
    # Dataset Statistics
    # ------------------------------------------

    @staticmethod
    def get_statistics(file_path):
        """
        Generate descriptive statistics.

        Args:
            file_path: Dataset path.

        Returns:
            Statistics dictionary.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        statistics = dataframe.describe(
            include="all"
        ).replace(
            {float("nan"): None}
        )

        return json.loads(
            statistics.to_json(
                orient="index"
            )
        )

    # ------------------------------------------
    # Missing Value Analysis
    # ------------------------------------------

    @staticmethod
    def get_missing_values(file_path):
        """
        Analyze missing values in the dataset.

        Args:
            file_path: Dataset path.

        Returns:
            Missing-value information.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        result = []

        total_rows = len(dataframe)

        for column in dataframe.columns:

            missing_count = int(
                dataframe[column].isna().sum()
            )

            percentage = (
                (missing_count / total_rows) * 100
                if total_rows > 0
                else 0
            )

            result.append({
                "column": str(column),
                "missing_count": missing_count,
                "missing_percentage": round(
                    percentage,
                    2
                )
            })

        return result

    # ------------------------------------------
    # Numeric Columns
    # ------------------------------------------

    @staticmethod
    def get_numeric_columns(file_path):
        """
        Get numeric columns from dataset.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        return list(
            dataframe.select_dtypes(
                include="number"
            ).columns
        )

    # ------------------------------------------
    # Categorical Columns
    # ------------------------------------------

    @staticmethod
    def get_categorical_columns(file_path):
        """
        Get categorical/text columns.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        return list(
            dataframe.select_dtypes(
                include=["object", "category"]
            ).columns
        )

    # ------------------------------------------
    # Delete Dataset
    # ------------------------------------------

    @staticmethod
    def delete_dataset(file_path):
        """
        Delete a dataset file.

        Args:
            file_path: Dataset path.

        Returns:
            True if deleted.
        """

        if not os.path.exists(file_path):
            return False

        os.remove(file_path)

        return True

    # ------------------------------------------
    # Dataset Summary
    # ------------------------------------------

    @staticmethod
    def get_summary(file_path):
        """
        Generate a complete dataset summary.

        Args:
            file_path: Dataset path.

        Returns:
            Complete summary.
        """

        dataframe = DatasetService.load_dataset(
            file_path
        )

        return {
            "rows": int(len(dataframe)),
            "columns": int(
                len(dataframe.columns)
            ),
            "columns_list": [
                str(column)
                for column in dataframe.columns
            ],
            "numeric_columns": [
                str(column)
                for column in dataframe.select_dtypes(
                    include="number"
                ).columns
            ],
            "categorical_columns": [
                str(column)
                for column in dataframe.select_dtypes(
                    include=["object", "category"]
                ).columns
            ],
            "missing_values": int(
                dataframe.isna().sum().sum()
            ),
            "duplicate_rows": int(
                dataframe.duplicated().sum()
            ),
            "memory_usage_bytes": int(
                dataframe.memory_usage(
                    deep=True
                ).sum()
            )
        }


# ==========================================
# Convenience Functions
# ==========================================

def validate_dataset_file(file):
    """
    Convenience wrapper for file validation.
    """

    return DatasetService.validate_file(file)


def load_dataset(file_path):
    """
    Convenience wrapper for loading a dataset.
    """

    return DatasetService.load_dataset(
        file_path
    )


def preview_dataset(file_path, rows=10):
    """
    Convenience wrapper for dataset preview.
    """

    return DatasetService.preview_dataset(
        file_path,
        rows
    )


def get_dataset_summary(file_path):
    """
    Convenience wrapper for dataset summary.
    """

    return DatasetService.get_summary(
        file_path
    )
```
