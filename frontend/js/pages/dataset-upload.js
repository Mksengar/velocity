// ==========================================
// Velocity BI - Dataset Upload JavaScript
// File: frontend/js/dataset-upload.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // Configuration
    // ==========================================

    const API_BASE_URL = "http://127.0.0.1:5000/api";

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    const ALLOWED_EXTENSIONS = [
        "csv",
        "xlsx",
        "xls",
        "json",
        "sql"
    ];

    const ALLOWED_TYPES = [
        "text/csv",
        "application/json",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/sql",
        "text/plain"
    ];


    // ==========================================
    // DOM Elements
    // ==========================================

    const uploadForm =
        document.getElementById("uploadForm");

    const fileInput =
        document.getElementById("datasetFile");

    const fileDropZone =
        document.getElementById("fileDropZone");

    const browseButton =
        document.getElementById("browseButton");

    const uploadButton =
        document.getElementById("uploadButton");

    const fileName =
        document.getElementById("fileName");

    const fileSize =
        document.getElementById("fileSize");

    const fileType =
        document.getElementById("fileType");

    const filePreview =
        document.getElementById("filePreview");

    const progressContainer =
        document.getElementById("uploadProgressContainer");

    const progressBar =
        document.getElementById("uploadProgress");

    const progressText =
        document.getElementById("uploadProgressText");

    const errorMessage =
        document.getElementById("errorMessage");

    const successMessage =
        document.getElementById("successMessage");

    const removeFileButton =
        document.getElementById("removeFileButton");

    const datasetNameInput =
        document.getElementById("datasetName");

    const datasetDescriptionInput =
        document.getElementById("datasetDescription");


    // ==========================================
    // State
    // ==========================================

    let selectedFile = null;


    // ==========================================
    // Storage
    // ==========================================

    function getToken() {

        try {

            return localStorage.getItem(
                "velocity_bi_token"
            );

        } catch (error) {

            console.warn(
                "Unable to access localStorage."
            );

            return null;
        }
    }


    // ==========================================
    // Messages
    // ==========================================

    function showError(message) {

        if (errorMessage) {

            errorMessage.textContent =
                message;

            errorMessage.style.display =
                "block";
        }

        if (successMessage) {

            successMessage.style.display =
                "none";
        }
    }


    function showSuccess(message) {

        if (successMessage) {

            successMessage.textContent =
                message;

            successMessage.style.display =
                "block";
        }

        if (errorMessage) {

            errorMessage.style.display =
                "none";
        }
    }


    function clearMessages() {

        if (errorMessage) {

            errorMessage.textContent = "";

            errorMessage.style.display =
                "none";
        }

        if (successMessage) {

            successMessage.textContent = "";

            successMessage.style.display =
                "none";
        }
    }


    // ==========================================
    // File Helpers
    // ==========================================

    function getFileExtension(file) {

        if (!file || !file.name) {
            return "";
        }

        const parts =
            file.name.split(".");

        return parts.length > 1
            ? parts.pop().toLowerCase()
            : "";
    }


    function formatFileSize(bytes) {

        if (bytes === 0) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];

        const index =
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            );

        return (
            parseFloat(
                (
                    bytes /
                    Math.pow(
                        1024,
                        index
                    )
                ).toFixed(2)
            ) +
            " " +
            units[index]
        );
    }


    function getFileCategory(file) {

        const extension =
            getFileExtension(file);

        switch (extension) {

            case "csv":
                return "CSV Dataset";

            case "xlsx":
                return "Excel Workbook";

            case "xls":
                return "Excel File";

            case "json":
                return "JSON Dataset";

            case "sql":
                return "SQL File";

            default:
                return "Unknown File";
        }
    }


    // ==========================================
    // Validate File
    // ==========================================

    function validateFile(file) {

        if (!file) {

            showError(
                "Please select a dataset file."
            );

            return false;
        }


        const extension =
            getFileExtension(file);


        if (
            !ALLOWED_EXTENSIONS.includes(
                extension
            )
        ) {

            showError(
                "Unsupported file format. Please upload CSV, Excel, JSON, or SQL files."
            );

            return false;
        }


        if (
            file.size >
            MAX_FILE_SIZE
        ) {

            showError(
                "File size cannot exceed 50 MB."
            );

            return false;
        }


        return true;
    }


    // ==========================================
    // Display Selected File
    // ==========================================

    function displayFile(file) {

        if (!file) {
            return;
        }


        selectedFile = file;


        if (fileName) {

            fileName.textContent =
                file.name;
        }


        if (fileSize) {

            fileSize.textContent =
                formatFileSize(
                    file.size
                );
        }


        if (fileType) {

            fileType.textContent =
                getFileCategory(file);
        }


        if (filePreview) {

            filePreview.style.display =
                "block";
        }


        clearMessages();
    }


    // ==========================================
    // Remove Selected File
    // ==========================================

    function removeFile() {

        selectedFile = null;


        if (fileInput) {

            fileInput.value = "";
        }


        if (filePreview) {

            filePreview.style.display =
                "none";
        }


        if (fileName) {

            fileName.textContent = "";
        }


        if (fileSize) {

            fileSize.textContent = "";
        }


        if (fileType) {

            fileType.textContent = "";
        }


        resetProgress();
    }


    // ==========================================
    // File Input
    // ==========================================

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            (event) => {

                clearMessages();

                const file =
                    event.target.files[0];

                if (!file) {
                    return;
                }


                if (
                    validateFile(file)
                ) {

                    displayFile(file);

                } else {

                    fileInput.value =
                        "";
                }
            }
        );
    }


    // ==========================================
    // Browse Button
    // ==========================================

    if (browseButton) {

        browseButton.addEventListener(
            "click",
            () => {

                fileInput?.click();
            }
        );
    }


    // ==========================================
    // Drag & Drop
    // ==========================================

    if (fileDropZone) {

        fileDropZone.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                fileDropZone.classList.add(
                    "drag-over"
                );
            }
        );


        fileDropZone.addEventListener(
            "dragleave",
            () => {

                fileDropZone.classList.remove(
                    "drag-over"
                );
            }
        );


        fileDropZone.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                fileDropZone.classList.remove(
                    "drag-over"
                );


                const file =
                    event.dataTransfer
                        .files[0];


                if (!file) {
                    return;
                }


                if (
                    validateFile(file)
                ) {

                    displayFile(file);


                    /*
                     * Update the real file input
                     * when browser allows it.
                     */

                    try {

                        const dataTransfer =
                            new DataTransfer();

                        dataTransfer.items.add(
                            file
                        );

                        fileInput.files =
                            dataTransfer.files;

                    } catch (error) {

                        console.warn(
                            "Unable to update file input."
                        );
                    }
                }
            }
        );
    }


    // ==========================================
    // Remove File Button
    // ==========================================

    if (removeFileButton) {

        removeFileButton.addEventListener(
            "click",
            removeFile
        );
    }


    // ==========================================
    // Upload Progress
    // ==========================================

    function updateProgress(
        percentage
    ) {

        const value =
            Math.min(
                100,
                Math.max(
                    0,
                    percentage
                )
            );


        if (progressBar) {

            progressBar.style.width =
                `${value}%`;
        }


        if (progressText) {

            progressText.textContent =
                `${Math.round(value)}%`;
        }
    }


    function resetProgress() {

        if (progressContainer) {

            progressContainer.style.display =
                "none";
        }


        updateProgress(0);
    }


    // ==========================================
    // Upload Button State
    // ==========================================

    function setUploading(
        uploading
    ) {

        if (!uploadButton) {
            return;
        }


        uploadButton.disabled =
            uploading;


        if (uploading) {

            uploadButton.dataset
                .originalText =
                uploadButton.textContent;

            uploadButton.textContent =
                "Uploading...";

        } else {

            uploadButton.textContent =
                uploadButton.dataset
                    .originalText ||
                "Upload Dataset";
        }
    }


    // ==========================================
    // Upload File
    // ==========================================

    function uploadDataset(file) {

        return new Promise(
            (resolve, reject) => {

                const token =
                    getToken();


                if (!token) {

                    reject(
                        new Error(
                            "Your session has expired. Please login again."
                        )
                    );

                    return;
                }


                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                if (datasetNameInput) {

                    formData.append(
                        "dataset_name",
                        datasetNameInput.value.trim()
                    );
                }


                if (datasetDescriptionInput) {

                    formData.append(
                        "description",
                        datasetDescriptionInput.value.trim()
                    );
                }


                const xhr =
                    new XMLHttpRequest();


                xhr.open(
                    "POST",
                    `${API_BASE_URL}/datasets/upload`,
                    true
                );


                // JWT authentication

                xhr.setRequestHeader(
                    "Authorization",
                    `Bearer ${token}`
                );


                // Progress

                xhr.upload.addEventListener(
                    "progress",
                    (event) => {

                        if (
                            event.lengthComputable
                        ) {

                            const percentage =
                                (
                                    event.loaded /
                                    event.total
                                ) * 100;

                            updateProgress(
                                percentage
                            );
                        }
                    }
                );


                // Success

                xhr.addEventListener(
                    "load",
                    () => {

                        let responseData = {};

                        try {

                            responseData =
                                JSON.parse(
                                    xhr.responseText
                                );

                        } catch (error) {

                            responseData = {};
                        }


                        if (
                            xhr.status >= 200 &&
                            xhr.status < 300
                        ) {

                            resolve(
                                responseData
                            );

                        } else if (
                            xhr.status === 401 ||
                            xhr.status === 403
                        ) {

                            reject(
                                new Error(
                                    "Your session has expired. Please login again."
                                )
                            );

                        } else {

                            reject(
                                new Error(
                                    responseData.message ||
                                    responseData.error ||
                                    "Dataset upload failed."
                                )
                            );
                        }
                    }
                );


                // Network error

                xhr.addEventListener(
                    "error",
                    () => {

                        reject(
                            new Error(
                                "Unable to connect to the server."
                            )
                        );
                    }
                );


                // Request aborted

                xhr.addEventListener(
                    "abort",
                    () => {

                        reject(
                            new Error(
                                "Upload was cancelled."
                            )
                        );
                    }
                );


                xhr.send(
                    formData
                );
            }
        );
    }


    // ==========================================
    // Form Submit
    // ==========================================

    if (uploadForm) {

        uploadForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessages();


                // Check file

                if (!selectedFile) {

                    showError(
                        "Please select a dataset before uploading."
                    );

                    return;
                }


                // Validate file

                if (
                    !validateFile(
                        selectedFile
                    )
                ) {

                    return;
                }


                setUploading(true);


                if (progressContainer) {

                    progressContainer.style.display =
                        "block";
                }


                updateProgress(0);


                try {

                    const result =
                        await uploadDataset(
                            selectedFile
                        );


                    updateProgress(100);


                    showSuccess(
                        result.message ||
                        "Dataset uploaded successfully!"
                    );


                    /*
                     * Redirect to dataset preview
                     * after successful upload.
                     */

                    setTimeout(() => {

                        window.location.href =
                            "dataset-preview.html";

                    }, 1200);


                } catch (error) {

                    console.error(
                        "Dataset upload error:",
                        error
                    );


                    if (
                        error.message.includes(
                            "session has expired"
                        )
                    ) {

                        try {

                            localStorage.removeItem(
                                "velocity_bi_token"
                            );

                            localStorage.removeItem(
                                "velocity_bi_user"
                            );

                        } catch (storageError) {

                            console.warn(
                                storageError
                            );
                        }


                        showError(
                            error.message
                        );


                        setTimeout(() => {

                            window.location.href =
                                "login.html";

                        }, 1200);

                    } else {

                        showError(
                            error.message ||
                            "Unable to upload dataset."
                        );
                    }


                    resetProgress();

                } finally {

                    setUploading(false);
                }
            }
        );
    }


    // ==========================================
    // Prevent Default Drop Behavior
    // ==========================================

    [
        "dragenter",
        "dragover",
        "dragleave",
        "drop"
    ].forEach((eventName) => {

        document.addEventListener(
            eventName,
            (event) => {

                event.preventDefault();
                event.stopPropagation();

            },
            false
        );
    });


    // ==========================================
    // Initialize
    // ==========================================

    resetProgress();

});