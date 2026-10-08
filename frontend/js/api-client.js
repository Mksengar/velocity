// ==========================================
// Velocity BI - API Client
// File: frontend/js/api-client.js
// ==========================================

class APIClient {

    constructor() {
        this.baseURL =
            typeof CONFIG !== "undefined"
                ? CONFIG.API_BASE_URL
                : (window.location.port === "5500"
                    ? "http://127.0.0.1:5000/api"
                    : window.location.origin + "/api");

        this.timeout = 30000;
    }


    // ==========================================
    // Get Authentication Token
    // ==========================================

    getToken() {

        return localStorage.getItem(
            "velocity_bi_token"
        );
    }


    // ==========================================
    // Create Headers
    // ==========================================

    getHeaders(customHeaders = {}) {

        const headers = {
            "Content-Type": "application/json",
            ...customHeaders
        };

        const token = this.getToken();

        if (token) {

            headers["Authorization"] =
                `Bearer ${token}`;
        }

        return headers;
    }


    // ==========================================
    // Request Handler
    // ==========================================

    async request(
        endpoint,
        options = {}
    ) {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                this.timeout
            );

        try {

            const response =
                await fetch(
                    `${this.baseURL}${endpoint}`,
                    {
                        ...options,
                        headers: this.getHeaders(
                            options.headers || {}
                        ),
                        signal: controller.signal
                    }
                );

            clearTimeout(timeout);


            // ----------------------------------
            // Unauthorized
            // ----------------------------------

            if (response.status === 401) {

                localStorage.removeItem(
                    "velocity_bi_token"
                );

                localStorage.removeItem(
                    "velocity_bi_user"
                );

                if (
                    !window.location.pathname.includes(
                        "login.html"
                    )
                ) {

                    window.location.href =
                        "login.html";
                }

                throw new Error(
                    "Session expired. Please login again."
                );
            }


            // ----------------------------------
            // Response Data
            // ----------------------------------

            const contentType =
                response.headers.get(
                    "content-type"
                );

            let data;

            if (
                contentType &&
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                data =
                    await response.text();
            }


            // ----------------------------------
            // Error Response
            // ----------------------------------

            if (!response.ok) {

                const message =
                    data?.message ||
                    data?.error ||
                    `Request failed with status ${response.status}`;

                throw new Error(message);
            }


            return data;

        } catch (error) {

            clearTimeout(timeout);

            if (
                error.name === "AbortError"
            ) {

                throw new Error(
                    "Request timed out. Please try again."
                );
            }

            console.error(
                "Velocity BI API Error:",
                error
            );

            throw error;
        }
    }


    // ==========================================
    // GET Request
    // ==========================================

    async get(
        endpoint,
        params = {}
    ) {

        let url =
            endpoint;

        const query =
            new URLSearchParams();

        Object.entries(params)
            .forEach(([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {

                    query.append(
                        key,
                        value
                    );
                }
            });


        const queryString =
            query.toString();

        if (queryString) {

            url +=
                `?${queryString}`;
        }


        return this.request(
            url,
            {
                method: "GET"
            }
        );
    }


    // ==========================================
    // POST Request
    // ==========================================

    async post(
        endpoint,
        data = {}
    ) {

        return this.request(
            endpoint,
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        );
    }


    // ==========================================
    // PUT Request
    // ==========================================

    async put(
        endpoint,
        data = {}
    ) {

        return this.request(
            endpoint,
            {
                method: "PUT",
                body: JSON.stringify(data)
            }
        );
    }


    // ==========================================
    // PATCH Request
    // ==========================================

    async patch(
        endpoint,
        data = {}
    ) {

        return this.request(
            endpoint,
            {
                method: "PATCH",
                body: JSON.stringify(data)
            }
        );
    }


    // ==========================================
    // DELETE Request
    // ==========================================

    async delete(
        endpoint
    ) {

        return this.request(
            endpoint,
            {
                method: "DELETE"
            }
        );
    }


    // ==========================================
    // Upload File
    // ==========================================

    async uploadFile(
        endpoint,
        file,
        additionalData = {}
    ) {

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        // Add additional fields
        Object.entries(
            additionalData
        ).forEach(
            ([key, value]) => {

                formData.append(
                    key,
                    value
                );
            }
        );


        const token =
            this.getToken();

        const headers = {};

        // Do NOT manually set Content-Type
        // for FormData. Browser adds boundary.
        if (token) {

            headers["Authorization"] =
                `Bearer ${token}`;
        }


        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                this.timeout
            );


        try {

            const response =
                await fetch(
                    `${this.baseURL}${endpoint}`,
                    {
                        method: "POST",
                        headers: headers,
                        body: formData,
                        signal: controller.signal
                    }
                );


            clearTimeout(timeout);


            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "velocity_bi_token"
                );

                localStorage.removeItem(
                    "velocity_bi_user"
                );

                window.location.href =
                    "login.html";

                throw new Error(
                    "Session expired."
                );
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "File upload failed."
                );
            }


            return data;

        } catch (error) {

            clearTimeout(timeout);

            console.error(
                "Upload Error:",
                error
            );

            throw error;
        }
    }


    // ==========================================
    // Authentication APIs
    // ==========================================

    async login(
        email,
        password
    ) {

        const response =
            await this.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );


        if (response.token) {

            localStorage.setItem(
                "velocity_bi_token",
                response.token
            );

        } else if (
            response.access_token
        ) {

            localStorage.setItem(
                "velocity_bi_token",
                response.access_token
            );
        }


        if (response.user) {

            localStorage.setItem(
                "velocity_bi_user",
                JSON.stringify(
                    response.user
                )
            );
        }


        return response;
    }


    async register(
        name,
        email,
        password
    ) {

        return this.post(
            "/auth/register",
            {
                name,
                email,
                password
            }
        );
    }


    async logout() {

        try {

            await this.post(
                "/auth/logout"
            );

        } catch (error) {

            console.warn(
                "Logout API error:",
                error
            );

        } finally {

            localStorage.removeItem(
                "velocity_bi_token"
            );

            localStorage.removeItem(
                "velocity_bi_user"
            );
        }
    }


    async getProfile() {

        return this.get(
            "/auth/profile"
        );
    }


    // ==========================================
    // Dataset APIs
    // ==========================================

    async uploadDataset(
        file,
        datasetName = ""
    ) {

        return this.uploadFile(
            "/datasets/upload",
            file,
            {
                dataset_name:
                    datasetName
            }
        );
    }


    async getDatasets() {

        return this.get(
            "/datasets"
        );
    }


    async getDatasetPreview(
        datasetId
    ) {

        return this.get(
            "/datasets/preview",
            {
                dataset_id:
                    datasetId
            }
        );
    }


    async deleteDataset(
        datasetId
    ) {

        return this.delete(
            `/datasets/${datasetId}`
        );
    }


    // ==========================================
    // Data Cleaning APIs
    // ==========================================

    async cleanDataset(
        datasetId,
        options = {}
    ) {

        return this.post(
            "/analytics/cleaning",
            {
                dataset_id:
                    datasetId,
                options:
                    options
            }
        );
    }


    // ==========================================
    // EDA APIs
    // ==========================================

    async performEDA(
        datasetId
    ) {

        return this.get(
            `/analysis/${encodeURIComponent(datasetId)}`
        );
    }


    // ==========================================
    // Correlation Analysis
    // ==========================================

    async correlationAnalysis(
        datasetId
    ) {

        return this.get(
            `/analysis/${encodeURIComponent(datasetId)}/correlation`
        );
    }


    // ==========================================
    // Visualization APIs
    // ==========================================

    async createChart(
        datasetId,
        chartConfig
    ) {

        return this.post(
            "/visualization/charts",
            {
                dataset_id:
                    datasetId,
                chart:
                    chartConfig
            }
        );
    }


    async getDashboardData(
        datasetId
    ) {

        return this.get(
            "/visualization/dashboard",
            {
                dataset_id:
                    datasetId
            }
        );
    }


    // ==========================================
    // Forecasting APIs
    // ==========================================

    async generateForecast(
        datasetId,
        configuration = {}
    ) {

        return this.post(
            "/forecasting/forecast",
            {
                dataset_id:
                    datasetId,
                configuration:
                    configuration
            }
        );
    }


    // ==========================================
    // Reports APIs
    // ==========================================

    async getReports() {

        return this.get(
            "/reports"
        );
    }


    async createReport(
        reportData
    ) {

        return this.post(
            "/reports/generate",
            reportData
        );
    }


    async exportReport(
        reportId,
        format = "json"
    ) {
        const exportFormat = String(format).toLowerCase();
        if (!["json", "csv"].includes(exportFormat)) {
            throw new Error("Report export format must be json or csv.");
        }

        return this.get(
            `/reports/${encodeURIComponent(reportId)}/export/${exportFormat}`
        );
    }


    // ==========================================
    // Admin APIs
    // ==========================================

    async getUsers() {

        return this.get(
            "/admin/users"
        );
    }


    async getAdminActivity() {

        return this.get(
            "/admin/activity"
        );
    }


    async getAdminDashboard() {

        return this.get(
            "/admin/dashboard"
        );
    }
}


// ==========================================
// Create Global API Client
// ==========================================

const apiClient =
    new APIClient();


// ==========================================
// Optional Global Helper Functions
// ==========================================

async function apiGet(
    endpoint,
    params = {}
) {

    return apiClient.get(
        endpoint,
        params
    );
}


async function apiPost(
    endpoint,
    data = {}
) {

    return apiClient.post(
        endpoint,
        data
    );
}


async function apiPut(
    endpoint,
    data = {}
) {

    return apiClient.put(
        endpoint,
        data
    );
}


async function apiDelete(
    endpoint
) {

    return apiClient.delete(
        endpoint
    );
}


async function apiUpload(
    endpoint,
    file,
    data = {}
) {

    return apiClient.uploadFile(
        endpoint,
        file,
        data
    );
}
