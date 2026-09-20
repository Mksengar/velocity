// ==========================================
// Velocity BI - Storage Utility
// File: frontend/js/storage.js
// ==========================================

"use strict";

// ==========================================
// Storage Keys
// ==========================================

const STORAGE_KEYS = {
    USER: "velocityBI_user",
    TOKEN: "velocityBI_token",
    DATASET: "velocityBI_dataset",
    DATASET_NAME: "velocityBI_dataset_name",
    DATASET_ID: "velocityBI_dataset_id",
    SETTINGS: "velocityBI_settings",
    THEME: "velocityBI_theme",
    DASHBOARD: "velocityBI_dashboard",
    RECENT_DATASETS: "velocityBI_recent_datasets",
    CORRELATION: "velocityBI_correlation",
    EDA_RESULTS: "velocityBI_eda_results",
    CLEANING_RESULTS: "velocityBI_cleaning_results"
};


// ==========================================
// Safe Storage Detection
// ==========================================

function isStorageAvailable(storageType) {
    try {
        const storage = window[storageType];

        if (!storage) {
            return false;
        }

        const testKey = "__velocity_bi_storage_test__";

        storage.setItem(testKey, "test");
        storage.removeItem(testKey);

        return true;

    } catch (error) {
        console.warn(
            `${storageType} is not available:`,
            error
        );

        return false;
    }
}


// ==========================================
// Storage Availability
// ==========================================

const STORAGE_AVAILABLE = {
    local: isStorageAvailable("localStorage"),
    session: isStorageAvailable("sessionStorage")
};


// ==========================================
// Get Storage Object
// ==========================================

function getStorage(type = "local") {

    if (type === "session") {

        if (STORAGE_AVAILABLE.session) {
            return window.sessionStorage;
        }

        return null;
    }

    if (STORAGE_AVAILABLE.local) {
        return window.localStorage;
    }

    return null;
}


// ==========================================
// Set Item
// ==========================================

function setItem(
    key,
    value,
    type = "local"
) {

    const storage = getStorage(type);

    if (!storage) {
        console.warn(
            `Unable to save "${key}". Storage unavailable.`
        );

        return false;
    }

    try {

        const serializedValue =
            typeof value === "string"
                ? value
                : JSON.stringify(value);

        storage.setItem(
            key,
            serializedValue
        );

        return true;

    } catch (error) {

        console.error(
            `Storage error while saving "${key}":`,
            error
        );

        return false;
    }
}


// ==========================================
// Get Item
// ==========================================

function getItem(
    key,
    type = "local",
    defaultValue = null
) {

    const storage = getStorage(type);

    if (!storage) {
        return defaultValue;
    }

    try {

        const value =
            storage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }

    } catch (error) {

        console.error(
            `Storage error while reading "${key}":`,
            error
        );

        return defaultValue;
    }
}


// ==========================================
// Remove Item
// ==========================================

function removeItem(
    key,
    type = "local"
) {

    const storage = getStorage(type);

    if (!storage) {
        return false;
    }

    try {

        storage.removeItem(key);

        return true;

    } catch (error) {

        console.error(
            `Storage error while removing "${key}":`,
            error
        );

        return false;
    }
}


// ==========================================
// Clear Storage
// ==========================================

function clearStorage(
    type = "local"
) {

    const storage = getStorage(type);

    if (!storage) {
        return false;
    }

    try {

        storage.clear();

        return true;

    } catch (error) {

        console.error(
            "Unable to clear storage:",
            error
        );

        return false;
    }
}


// ==========================================
// Check Item Exists
// ==========================================

function hasItem(
    key,
    type = "local"
) {

    const storage = getStorage(type);

    if (!storage) {
        return false;
    }

    try {
        return storage.getItem(key) !== null;
    } catch {
        return false;
    }
}


// ==========================================
// Get All Storage Keys
// ==========================================

function getAllKeys(
    type = "local"
) {

    const storage = getStorage(type);

    if (!storage) {
        return [];
    }

    try {
        return Object.keys(storage);
    } catch {
        return [];
    }
}


// ==========================================
// User Storage
// ==========================================

function saveUser(user) {

    return setItem(
        STORAGE_KEYS.USER,
        user,
        "local"
    );
}


function getUser() {

    return getItem(
        STORAGE_KEYS.USER,
        "local",
        null
    );
}


function removeUser() {

    return removeItem(
        STORAGE_KEYS.USER,
        "local"
    );
}


// ==========================================
// Authentication Token
// ==========================================

function saveToken(token) {

    if (!token) {
        return false;
    }

    return setItem(
        STORAGE_KEYS.TOKEN,
        token,
        "session"
    );
}


function getToken() {

    return getItem(
        STORAGE_KEYS.TOKEN,
        "session",
        null
    );
}


function removeToken() {

    return removeItem(
        STORAGE_KEYS.TOKEN,
        "session"
    );
}


// ==========================================
// Authentication Check
// ==========================================

function isLoggedIn() {

    const token = getToken();

    return Boolean(token);
}


// ==========================================
// Logout
// ==========================================

function logout() {

    removeToken();
    removeUser();

    console.log(
        "Velocity BI user logged out."
    );

    return true;
}


// ==========================================
// Dataset Storage
// ==========================================

function saveDataset(
    dataset,
    datasetName = "Dataset"
) {

    if (!Array.isArray(dataset)) {

        console.error(
            "Dataset must be an array."
        );

        return false;
    }

    const savedDataset =
        setItem(
            STORAGE_KEYS.DATASET,
            dataset,
            "session"
        );

    const savedName =
        setItem(
            STORAGE_KEYS.DATASET_NAME,
            datasetName,
            "session"
        );

    if (savedDataset && savedName) {

        console.log(
            `Dataset "${datasetName}" saved successfully.`
        );

        return true;
    }

    return false;
}


// ==========================================
// Get Dataset
// ==========================================

function getDataset() {

    return getItem(
        STORAGE_KEYS.DATASET,
        "session",
        []
    );
}


// ==========================================
// Get Dataset Name
// ==========================================

function getDatasetName() {

    return getItem(
        STORAGE_KEYS.DATASET_NAME,
        "session",
        "Dataset"
    );
}


// ==========================================
// Remove Dataset
// ==========================================

function removeDataset() {

    removeItem(
        STORAGE_KEYS.DATASET,
        "session"
    );

    removeItem(
        STORAGE_KEYS.DATASET_NAME,
        "session"
    );

    removeItem(
        STORAGE_KEYS.DATASET_ID,
        "session"
    );

    console.log(
        "Dataset removed."
    );

    return true;
}


// ==========================================
// Dataset ID
// ==========================================

function saveDatasetId(id) {

    return setItem(
        STORAGE_KEYS.DATASET_ID,
        id,
        "session"
    );
}


function getDatasetId() {

    return getItem(
        STORAGE_KEYS.DATASET_ID,
        "session",
        null
    );
}


// ==========================================
// Recent Datasets
// ==========================================

function saveRecentDataset(datasetInfo) {

    if (!datasetInfo) {
        return false;
    }

    let recentDatasets =
        getItem(
            STORAGE_KEYS.RECENT_DATASETS,
            "local",
            []
        );

    if (!Array.isArray(recentDatasets)) {
        recentDatasets = [];
    }

    recentDatasets =
        recentDatasets.filter(
            item =>
                item.id !== datasetInfo.id
        );

    recentDatasets.unshift(
        datasetInfo
    );

    // Keep maximum 10 datasets
    recentDatasets =
        recentDatasets.slice(0, 10);

    return setItem(
        STORAGE_KEYS.RECENT_DATASETS,
        recentDatasets,
        "local"
    );
}


function getRecentDatasets() {

    return getItem(
        STORAGE_KEYS.RECENT_DATASETS,
        "local",
        []
    );
}


// ==========================================
// Settings
// ==========================================

function saveSettings(settings) {

    return setItem(
        STORAGE_KEYS.SETTINGS,
        settings,
        "local"
    );
}


function getSettings() {

    return getItem(
        STORAGE_KEYS.SETTINGS,
        "local",
        {}
    );
}


// ==========================================
// Theme
// ==========================================

function saveTheme(theme) {

    return setItem(
        STORAGE_KEYS.THEME,
        theme,
        "local"
    );
}


function getTheme() {

    return getItem(
        STORAGE_KEYS.THEME,
        "local",
        "dark"
    );
}


// ==========================================
// Dashboard State
// ==========================================

function saveDashboardState(state) {

    return setItem(
        STORAGE_KEYS.DASHBOARD,
        state,
        "local"
    );
}


function getDashboardState() {

    return getItem(
        STORAGE_KEYS.DASHBOARD,
        "local",
        {}
    );
}


// ==========================================
// Correlation Results
// ==========================================

function saveCorrelationResults(results) {

    return setItem(
        STORAGE_KEYS.CORRELATION,
        results,
        "session"
    );
}


function getCorrelationResults() {

    return getItem(
        STORAGE_KEYS.CORRELATION,
        "session",
        {}
    );
}


// ==========================================
// EDA Results
// ==========================================

function saveEDAResults(results) {

    return setItem(
        STORAGE_KEYS.EDA_RESULTS,
        results,
        "session"
    );
}


function getEDAResults() {

    return getItem(
        STORAGE_KEYS.EDA_RESULTS,
        "session",
        {}
    );
}


// ==========================================
// Data Cleaning Results
// ==========================================

function saveCleaningResults(results) {

    return setItem(
        STORAGE_KEYS.CLEANING_RESULTS,
        results,
        "session"
    );
}


function getCleaningResults() {

    return getItem(
        STORAGE_KEYS.CLEANING_RESULTS,
        "session",
        {}
    );
}


// ==========================================
// Storage Size
// ==========================================

function getStorageSize(type = "local") {

    const storage = getStorage(type);

    if (!storage) {
        return 0;
    }

    let totalSize = 0;

    try {

        for (let i = 0; i < storage.length; i++) {

            const key =
                storage.key(i);

            const value =
                storage.getItem(key);

            totalSize +=
                (key?.length || 0) +
                (value?.length || 0);
        }

    } catch (error) {

        console.error(
            "Unable to calculate storage size:",
            error
        );
    }

    return totalSize;
}


// ==========================================
// Storage Information
// ==========================================

function getStorageInfo() {

    return {
        localStorageAvailable:
            STORAGE_AVAILABLE.local,

        sessionStorageAvailable:
            STORAGE_AVAILABLE.session,

        localStorageSize:
            getStorageSize("local"),

        sessionStorageSize:
            getStorageSize("session"),

        localKeys:
            getAllKeys("local"),

        sessionKeys:
            getAllKeys("session")
    };
}


// ==========================================
// Clear Velocity BI Data
// ==========================================

function clearVelocityBIStorage(
    includeLocal = true,
    includeSession = true
) {

    const localKeys = [
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.DASHBOARD,
        STORAGE_KEYS.RECENT_DATASETS
    ];

    const sessionKeys = [
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.DATASET,
        STORAGE_KEYS.DATASET_NAME,
        STORAGE_KEYS.DATASET_ID,
        STORAGE_KEYS.CORRELATION,
        STORAGE_KEYS.EDA_RESULTS,
        STORAGE_KEYS.CLEANING_RESULTS
    ];

    if (includeLocal) {

        localKeys.forEach(key =>
            removeItem(key, "local")
        );
    }

    if (includeSession) {

        sessionKeys.forEach(key =>
            removeItem(key, "session")
        );
    }

    console.log(
        "Velocity BI storage cleared."
    );

    return true;
}


// ==========================================
// Export API
// ==========================================

window.VelocityStorage = {

    // Basic storage
    set: setItem,
    get: getItem,
    remove: removeItem,
    has: hasItem,
    clear: clearStorage,

    // Storage information
    isStorageAvailable,
    getStorageInfo,
    getStorageSize,

    // Authentication
    saveUser,
    getUser,
    removeUser,

    saveToken,
    getToken,
    removeToken,

    isLoggedIn,
    logout,

    // Dataset
    saveDataset,
    getDataset,
    removeDataset,

    saveDatasetId,
    getDatasetId,

    saveRecentDataset,
    getRecentDatasets,

    // Settings
    saveSettings,
    getSettings,

    saveTheme,
    getTheme,

    // Dashboard
    saveDashboardState,
    getDashboardState,

    // Analysis
    saveCorrelationResults,
    getCorrelationResults,

    saveEDAResults,
    getEDAResults,

    saveCleaningResults,
    getCleaningResults,

    // Cleanup
    clearVelocityBIStorage,

    // Keys
    keys: STORAGE_KEYS
};


// ==========================================
// Debug Information
// ==========================================

console.log(
    "Velocity BI Storage initialized:",
    {
        localStorage:
            STORAGE_AVAILABLE.local,

        sessionStorage:
            STORAGE_AVAILABLE.session
    }
);