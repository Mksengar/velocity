// ==========================================
// Velocity BI - Dataset Preview JavaScript
// File: frontend/js/dataset-preview.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // Configuration
    // ==========================================

    const API_BASE_URL =
        "http://127.0.0.1:5000/api";

    const TOKEN_KEY =
        "velocity_bi_token";


    // ==========================================
    // State
    // ==========================================

    let dataset = null;
    let columns = [];
    let rows = [];

    let filteredRows = [];

    let currentPage = 1;

    const rowsPerPage = 10;


    // ==========================================
    // DOM Elements
    // ==========================================

    const datasetTitle =
        document.getElementById("datasetTitle");

    const datasetName =
        document.getElementById("datasetName");

    const datasetType =
        document.getElementById("datasetType");

    const datasetSize =
        document.getElementById("datasetSize");

    const datasetRows =
        document.getElementById("datasetRows");

    const datasetColumns =
        document.getElementById("datasetColumns");

    const datasetDescription =
        document.getElementById("datasetDescription");

    const previewTable =
        document.getElementById("previewTable");

    const tableHead =
        document.getElementById("tableHead");

    const tableBody =
        document.getElementById("tableBody");

    const searchInput =
        document.getElementById("searchInput");

    const previousButton =
        document.getElementById("previousPage");

    const nextButton =
        document.getElementById("nextPage");

    const pageNumber =
        document.getElementById("pageNumber");

    const pageInfo =
        document.getElementById("pageInfo");

    const loadingMessage =
        document.getElementById("loadingMessage");

    const errorMessage =
        document.getElementById("errorMessage");

    const emptyMessage =
        document.getElementById("emptyMessage");

    const cleanButton =
        document.getElementById("cleanDatasetButton");

    const edaButton =
        document.getElementById("edaButton");

    const visualizationButton =
        document.getElementById(
            "visualizationButton"
        );

    const downloadButton =
        document.getElementById(
            "downloadDatasetButton"
        );


    // ==========================================
    // Authentication
    // ==========================================

    function getToken() {

        try {

            return localStorage.getItem(
                TOKEN_KEY
            );

        } catch (error) {

            console.warn(
                "Unable to access localStorage."
            );

            return null;
        }
    }


    function checkAuthentication() {

        const token =
            getToken();

        if (!token) {

            window.location.href =
                "login.html";

            return false;
        }

        return true;
    }


    // ==========================================
    // Get Dataset ID
    // ==========================================

    function getDatasetId() {

        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        const id =
            urlParams.get("id") ||
            urlParams.get("dataset_id");

        return id;
    }


    // ==========================================
    // API Request
    // ==========================================

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const token =
            getToken();

        const headers = {
            "Content-Type":
                "application/json",
            ...(options.headers || {})
        };


        if (token) {

            headers[
                "Authorization"
            ] = `Bearer ${token}`;
        }


        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearAuthentication();

            window.location.href =
                "login.html";

            throw new Error(
                "Your session has expired."
            );
        }


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Request failed."
            );
        }


        return data;
    }


    // ==========================================
    // Clear Authentication
    // ==========================================

    function clearAuthentication() {

        try {

            localStorage.removeItem(
                "velocity_bi_token"
            );

            localStorage.removeItem(
                "velocity_bi_user"
            );

        } catch (error) {

            console.warn(error);
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


        if (loadingMessage) {

            loadingMessage.style.display =
                "none";
        }
    }


    function showLoading() {

        if (loadingMessage) {

            loadingMessage.style.display =
                "block";
        }

        if (errorMessage) {

            errorMessage.style.display =
                "none";
        }

        if (emptyMessage) {

            emptyMessage.style.display =
                "none";
        }
    }


    function hideLoading() {

        if (loadingMessage) {

            loadingMessage.style.display =
                "none";
        }
    }


    // ==========================================
    // Escape HTML
    // ==========================================

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ==========================================
    // Format File Size
    // ==========================================

    function formatFileSize(bytes) {

        if (
            bytes === null ||
            bytes === undefined
        ) {

            return "N/A";
        }


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


    // ==========================================
    // Load Dataset
    // ==========================================

    async function loadDataset() {

        const datasetId =
            getDatasetId();


        if (!datasetId) {

            showError(
                "Dataset ID is missing."
            );

            return;
        }


        showLoading();


        try {

            /*
             * Expected endpoint:
             *
             * GET /api/datasets/{id}
             */

            const data =
                await apiRequest(
                    `/datasets/${encodeURIComponent(
                        datasetId
                    )}`
                );


            dataset =
                data.dataset || data;


            processDataset(
                dataset
            );


        } catch (error) {

            console.error(
                "Dataset loading error:",
                error
            );


            showError(
                error.message ||
                "Unable to load dataset."
            );

        } finally {

            hideLoading();
        }
    }


    // ==========================================
    // Process Dataset
    // ==========================================

    function processDataset(data) {

        if (!data) {

            showError(
                "No dataset data found."
            );

            return;
        }


        // Dataset metadata

        columns =
            data.columns ||
            data.schema ||
            [];


        rows =
            data.rows ||
            data.data ||
            [];


        /*
         * Handle datasets where columns
         * are not separately provided.
         */

        if (
            columns.length === 0 &&
            rows.length > 0
        ) {

            columns =
                Object.keys(
                    rows[0]
                );
        }


        /*
         * Convert array columns into
         * column names.
         */

        columns =
            columns.map(
                (column) => {

                    if (
                        typeof column ===
                        "string"
                    ) {

                        return column;
                    }

                    return (
                        column.name ||
                        column.column_name ||
                        String(column)
                    );
                }
            );


        filteredRows =
            [...rows];


        displayMetadata();

        renderTable();

        updatePagination();
    }


    // ==========================================
    // Display Metadata
    // ==========================================

    function displayMetadata() {

        const name =
            dataset.name ||
            dataset.dataset_name ||
            dataset.filename ||
            "Dataset";


        const type =
            dataset.type ||
            dataset.file_type ||
            getExtension(
                dataset.filename
            ) ||
            "Unknown";


        const size =
            dataset.size ||
            dataset.file_size;


        const totalRows =
            dataset.row_count ??
            dataset.total_rows ??
            rows.length;


        const totalColumns =
            dataset.column_count ??
            dataset.total_columns ??
            columns.length;


        if (datasetTitle) {

            datasetTitle.textContent =
                name;
        }


        if (datasetName) {

            datasetName.textContent =
                name;
        }


        if (datasetType) {

            datasetType.textContent =
                String(type).toUpperCase();
        }


        if (datasetSize) {

            datasetSize.textContent =
                typeof size === "number"
                    ? formatFileSize(size)
                    : size || "N/A";
        }


        if (datasetRows) {

            datasetRows.textContent =
                Number(
                    totalRows
                ).toLocaleString();
        }


        if (datasetColumns) {

            datasetColumns.textContent =
                Number(
                    totalColumns
                ).toLocaleString();
        }


        if (datasetDescription) {

            datasetDescription.textContent =
                dataset.description ||
                "No description available.";
        }
    }


    // ==========================================
    // Get File Extension
    // ==========================================

    function getExtension(filename) {

        if (!filename) {
            return "";
        }


        const parts =
            filename.split(".");


        if (parts.length < 2) {
            return "";
        }


        return parts
            .pop()
            .toLowerCase();
    }


    // ==========================================
    // Render Table
    // ==========================================

    function renderTable() {

        if (!tableHead ||
            !tableBody) {

            return;
        }


        tableHead.innerHTML = "";

        tableBody.innerHTML = "";


        if (
            columns.length === 0 ||
            filteredRows.length === 0
        ) {

            if (emptyMessage) {

                emptyMessage.style.display =
                    "block";
            }

            return;
        }


        if (emptyMessage) {

            emptyMessage.style.display =
                "none";
        }


        // --------------------------------------
        // Table Header
        // --------------------------------------

        const headerRow =
            document.createElement(
                "tr"
            );


        columns.forEach(
            (column) => {

                const th =
                    document.createElement(
                        "th"
                    );


                th.textContent =
                    column;


                headerRow.appendChild(
                    th
                );
            }
        );


        tableHead.appendChild(
            headerRow
        );


        // --------------------------------------
        // Pagination
        // --------------------------------------

        const startIndex =
            (
                currentPage - 1
            ) *
            rowsPerPage;


        const endIndex =
            startIndex +
            rowsPerPage;


        const pageRows =
            filteredRows.slice(
                startIndex,
                endIndex
            );


        // --------------------------------------
        // Table Rows
        // --------------------------------------

        pageRows.forEach(
            (row) => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                columns.forEach(
                    (column) => {

                        const td =
                            document.createElement(
                                "td"
                            );


                        let value =
                            row[column];


                        /*
                         * Support array rows
                         */

                        if (
                            Array.isArray(row)
                        ) {

                            const index =
                                columns.indexOf(
                                    column
                                );

                            value =
                                row[index];
                        }


                        if (
                            value === null ||
                            value === undefined
                        ) {

                            value = "—";
                        }


                        if (
                            typeof value ===
                            "object"
                        ) {

                            try {

                                value =
                                    JSON.stringify(
                                        value
                                    );

                            } catch (error) {

                                value = String(
                                    value
                                );
                            }
                        }


                        td.textContent =
                            value;


                        tr.appendChild(
                            td
                        );
                    }
                );


                tableBody.appendChild(
                    tr
                );
            }
        );
    }


    // ==========================================
    // Search Dataset
    // ==========================================

    function searchDataset(
        searchTerm
    ) {

        const term =
            searchTerm
                .trim()
                .toLowerCase();


        if (!term) {

            filteredRows =
                [...rows];

        } else {

            filteredRows =
                rows.filter(
                    (row) => {

                        return columns.some(
                            (column) => {

                                let value =
                                    row[column];


                                if (
                                    Array.isArray(row)
                                ) {

                                    const index =
                                        columns.indexOf(
                                            column
                                        );

                                    value =
                                        row[index];
                                }


                                return String(
                                    value ?? ""
                                )
                                    .toLowerCase()
                                    .includes(
                                        term
                                    );
                            }
                        );
                    }
                );
        }


        currentPage = 1;

        renderTable();

        updatePagination();
    }


    // ==========================================
    // Search Input
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                searchDataset(
                    searchInput.value
                );
            }
        );
    }


    // ==========================================
    // Pagination
    // ==========================================

    function getTotalPages() {

        return Math.max(
            1,
            Math.ceil(
                filteredRows.length /
                rowsPerPage
            )
        );
    }


    function updatePagination() {

        const totalPages =
            getTotalPages();


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;
        }


        if (pageNumber) {

            pageNumber.textContent =
                currentPage;
        }


        if (pageInfo) {

            pageInfo.textContent =
                `Page ${currentPage} of ${totalPages}`;
        }


        if (previousButton) {

            previousButton.disabled =
                currentPage <= 1;
        }


        if (nextButton) {

            nextButton.disabled =
                currentPage >= totalPages;
        }
    }


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            () => {

                if (
                    currentPage > 1
                ) {

                    currentPage--;

                    renderTable();

                    updatePagination();
                }
            }
        );
    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                const totalPages =
                    getTotalPages();


                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderTable();

                    updatePagination();
                }
            }
        );
    }


    // ==========================================
    // Navigation
    // ==========================================

    function getDatasetQuery() {

        const id =
            getDatasetId();


        return id
            ? `?id=${encodeURIComponent(id)}`
            : "";
    }


    if (cleanButton) {

        cleanButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `data-cleaning.html${getDatasetQuery()}`;
            }
        );
    }


    if (edaButton) {

        edaButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `eda.html${getDatasetQuery()}`;
            }
        );
    }


    if (visualizationButton) {

        visualizationButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `visualization.html${getDatasetQuery()}`;
            }
        );
    }


    // ==========================================
    // Download Dataset
    // ==========================================

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            async () => {

                const datasetId =
                    getDatasetId();


                if (!datasetId) {

                    showError(
                        "Dataset ID is missing."
                    );

                    return;
                }


                try {

                    const token =
                        getToken();


                    const response =
                        await fetch(
                            `${API_BASE_URL}/datasets/${encodeURIComponent(
                                datasetId
                            )}/download`,
                            {
                                method: "GET",

                                headers: {
                                    "Authorization":
                                        `Bearer ${token}`
                                }
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Unable to download dataset."
                        );
                    }


                    const blob =
                        await response.blob();


                    const url =
                        window.URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href =
                        url;


                    link.download =
                        dataset?.filename ||
                        dataset?.name ||
                        "dataset";


                    document.body.appendChild(
                        link
                    );


                    link.click();

                    link.remove();


                    window.URL.revokeObjectURL(
                        url
                    );


                } catch (error) {

                    console.error(
                        "Download error:",
                        error
                    );


                    showError(
                        error.message ||
                        "Download failed."
                    );
                }
            }
        );
    }


    // ==========================================
    // Initialize
    // ==========================================

    async function initialize() {

        if (
            !checkAuthentication()
        ) {

            return;
        }


        await loadDataset();
    }


    initialize();

});