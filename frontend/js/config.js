// ==========================================
// Velocity BI - Configuration
// File: frontend/js/config.js
// ==========================================

const CONFIG = {
    // Application Information
    APP_NAME: "Velocity BI",
    APP_VERSION: "1.0.0",

    // Backend API
    API_BASE_URL: "http://127.0.0.1:5000/api",

    // API Endpoints
    API: {
        AUTH: {
            LOGIN: "/auth/login",
            REGISTER: "/auth/register",
            LOGOUT: "/auth/logout",
            PROFILE: "/auth/profile"
        },

        DATASETS: {
            UPLOAD: "/datasets/upload",
            LIST: "/datasets",
            PREVIEW: "/datasets",
            DELETE: "/datasets"
        },

        DASHBOARD: {
            OVERVIEW: "/dashboard/overview"
        },

        ANALYTICS: {
            EDA: "/analytics/eda",
            CORRELATION: "/analytics/correlation",
            CLEANING: "/analytics/cleaning"
        },

        VISUALIZATION: {
            CHARTS: "/visualization/charts",
            DASHBOARD: "/visualization/dashboard"
        },

        REPORTS: {
            LIST: "/reports",
            CREATE: "/reports/create",
            EXPORT: "/reports/export"
        },

        FORECASTING: {
            FORECAST: "/forecasting/forecast"
        },

        ADMIN: {
            LOGIN: "/admin/login",
            USERS: "/admin/users",
            ACTIVITY: "/admin/activity",
            DASHBOARD: "/admin/dashboard"
        }
    },

    // Local Storage Keys
    STORAGE: {
        TOKEN: "velocity_bi_token",
        USER: "velocity_bi_user",
        THEME: "velocity_bi_theme",
        DATASET: "velocity_bi_dataset"
    },

    // Upload Configuration
    UPLOAD: {
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50 MB

        ALLOWED_EXTENSIONS: [
            ".csv",
            ".xlsx",
            ".xls",
            ".json"
        ]
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        ITEMS_PER_PAGE: 10
    },

    // Chart Configuration
    CHARTS: {
        DEFAULT_HEIGHT: 400,

        TYPES: [
            "bar",
            "line",
            "pie",
            "doughnut",
            "scatter",
            "area",
            "histogram"
        ]
    },

    // Application Settings
    SETTINGS: {
        REQUEST_TIMEOUT: 30000,
        DEBUG: true
    }
};


// ==========================================
// Helper Functions
// ==========================================

// Get API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}


// Get authentication token
function getAuthToken() {
    return localStorage.getItem(CONFIG.STORAGE.TOKEN);
}


// Save authentication token
function saveAuthToken(token) {
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
}


// Remove authentication token
function removeAuthToken() {
    localStorage.removeItem(CONFIG.STORAGE.TOKEN);
}


// Check whether user is logged in
function isLoggedIn() {
    return !!getAuthToken();
}


// Get current user
function getCurrentUser() {
    const user = localStorage.getItem(CONFIG.STORAGE.USER);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Invalid user data:", error);
        return null;
    }
}


// Save current user
function saveCurrentUser(user) {
    localStorage.setItem(
        CONFIG.STORAGE.USER,
        JSON.stringify(user)
    );
}


// Remove current user
function removeCurrentUser() {
    localStorage.removeItem(CONFIG.STORAGE.USER);
}


// Logout user
function logoutUser() {
    removeAuthToken();
    removeCurrentUser();

    window.location.href = "login.html";
}


// ==========================================
// API Request Helper
// ==========================================

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    // Add JWT token if available
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {

        const response = await fetch(
            getApiUrl(endpoint),
            {
                ...options,
                headers: headers
            }
        );

        // Handle unauthorized request
        if (response.status === 401) {
            logoutUser();
            return null;
        }

        const contentType = response.headers.get("content-type");

        let data;

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                "Something went wrong"
            );
        }

        return data;

    } catch (error) {

        console.error(
            "Velocity BI API Error:",
            error
        );

        throw error;
    }
}


// ==========================================
// File Validation
// ==========================================

function validateFile(file) {

    if (!file) {
        return {
            valid: false,
            message: "Please select a file."
        };
    }

    // Check file size
    if (file.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {

        return {
            valid: false,
            message: "File size must be less than 50 MB."
        };
    }

    // Check extension
    const fileName = file.name.toLowerCase();

    const validExtension =
        CONFIG.UPLOAD.ALLOWED_EXTENSIONS.some(
            extension => fileName.endsWith(extension)
        );

    if (!validExtension) {

        return {
            valid: false,
            message:
                "Only CSV, Excel and JSON files are supported."
        };
    }

    return {
        valid: true,
        message: "File is valid."
    };
}


// ==========================================
// Theme Management
// ==========================================

function getTheme() {
    return localStorage.getItem(
        CONFIG.STORAGE.THEME
    ) || "dark";
}


function setTheme(theme) {

    localStorage.setItem(
        CONFIG.STORAGE.THEME,
        theme
    );

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );
}


function initializeTheme() {
    setTheme(getTheme());
}


// ==========================================
// Page Protection
// ==========================================

function requireLogin() {

    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}


function redirectIfLoggedIn() {

    if (isLoggedIn()) {
        window.location.href = "dashboard.html";
    }
}


// ==========================================
// Debug Information
// ==========================================

if (CONFIG.SETTINGS.DEBUG) {

    console.log(
        `${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`
    );

    console.log(
        "API:",
        CONFIG.API_BASE_URL
    );
}


// Initialize theme
document.addEventListener(
    "DOMContentLoaded",
    initializeTheme
);