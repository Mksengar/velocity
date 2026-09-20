// ==========================================
// Velocity BI - Settings JavaScript
// File: frontend/js/settings.js
// ==========================================

"use strict";

// ==========================================
// Storage Configuration
// ==========================================

const SETTINGS_STORAGE_KEY = "velocityBI_settings";

const DEFAULT_SETTINGS = {
    theme: "dark",
    language: "English",
    notifications: true,
    emailNotifications: false,
    autoSave: true,
    autoRefresh: false,
    refreshInterval: 30,
    compactMode: false,
    animations: true,
    chartAnimations: true,
    showGrid: true,
    defaultChartType: "bar",
    dateFormat: "DD/MM/YYYY",
    rowsPerPage: 25
};


// ==========================================
// Safe Storage Helpers
// ==========================================

function isStorageAvailable() {
    try {
        const testKey = "__velocity_bi_test__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn("localStorage is not available.");
        return false;
    }
}


function loadSettings() {
    if (!isStorageAvailable()) {
        return { ...DEFAULT_SETTINGS };
    }

    try {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!savedSettings) {
            return { ...DEFAULT_SETTINGS };
        }

        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(savedSettings)
        };

    } catch (error) {
        console.error("Unable to load settings:", error);
        return { ...DEFAULT_SETTINGS };
    }
}


function saveSettings(settings) {
    if (!isStorageAvailable()) {
        return false;
    }

    try {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

        return true;

    } catch (error) {
        console.error("Unable to save settings:", error);
        return false;
    }
}


// ==========================================
// Current Settings
// ==========================================

let settings = loadSettings();


// ==========================================
// DOM Helper
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


function query(selector) {
    return document.querySelector(selector);
}


// ==========================================
// Apply Theme
// ==========================================

function applyTheme(theme) {

    const body = document.body;

    if (!body) return;

    if (theme === "light") {
        body.classList.add("light-theme");
        body.classList.remove("dark-theme");

        document.documentElement.setAttribute(
            "data-theme",
            "light"
        );

    } else {
        body.classList.add("dark-theme");
        body.classList.remove("light-theme");

        document.documentElement.setAttribute(
            "data-theme",
            "dark"
        );
    }
}


// ==========================================
// Apply UI Settings
// ==========================================

function applyUISettings() {

    // Compact mode
    document.body.classList.toggle(
        "compact-mode",
        settings.compactMode
    );


    // Animations
    document.body.classList.toggle(
        "disable-animations",
        !settings.animations
    );


    // Chart animations
    document.body.classList.toggle(
        "disable-chart-animations",
        !settings.chartAnimations
    );


    // Grid
    document.body.classList.toggle(
        "hide-grid",
        !settings.showGrid
    );
}


// ==========================================
// Update Form Controls
// ==========================================

function populateSettingsForm() {

    const theme = getElement("theme");
    const language = getElement("language");
    const notifications = getElement("notifications");
    const emailNotifications = getElement("emailNotifications");
    const autoSave = getElement("autoSave");
    const autoRefresh = getElement("autoRefresh");
    const refreshInterval = getElement("refreshInterval");
    const compactMode = getElement("compactMode");
    const animations = getElement("animations");
    const chartAnimations = getElement("chartAnimations");
    const showGrid = getElement("showGrid");
    const defaultChartType = getElement("defaultChartType");
    const dateFormat = getElement("dateFormat");
    const rowsPerPage = getElement("rowsPerPage");


    if (theme) {
        theme.value = settings.theme;
    }

    if (language) {
        language.value = settings.language;
    }

    if (notifications) {
        notifications.checked = settings.notifications;
    }

    if (emailNotifications) {
        emailNotifications.checked = settings.emailNotifications;
    }

    if (autoSave) {
        autoSave.checked = settings.autoSave;
    }

    if (autoRefresh) {
        autoRefresh.checked = settings.autoRefresh;
    }

    if (refreshInterval) {
        refreshInterval.value = settings.refreshInterval;
    }

    if (compactMode) {
        compactMode.checked = settings.compactMode;
    }

    if (animations) {
        animations.checked = settings.animations;
    }

    if (chartAnimations) {
        chartAnimations.checked = settings.chartAnimations;
    }

    if (showGrid) {
        showGrid.checked = settings.showGrid;
    }

    if (defaultChartType) {
        defaultChartType.value = settings.defaultChartType;
    }

    if (dateFormat) {
        dateFormat.value = settings.dateFormat;
    }

    if (rowsPerPage) {
        rowsPerPage.value = settings.rowsPerPage;
    }
}


// ==========================================
// Read Settings From Form
// ==========================================

function readSettingsForm() {

    const theme = getElement("theme");
    const language = getElement("language");
    const notifications = getElement("notifications");
    const emailNotifications = getElement("emailNotifications");
    const autoSave = getElement("autoSave");
    const autoRefresh = getElement("autoRefresh");
    const refreshInterval = getElement("refreshInterval");
    const compactMode = getElement("compactMode");
    const animations = getElement("animations");
    const chartAnimations = getElement("chartAnimations");
    const showGrid = getElement("showGrid");
    const defaultChartType = getElement("defaultChartType");
    const dateFormat = getElement("dateFormat");
    const rowsPerPage = getElement("rowsPerPage");


    settings.theme = theme
        ? theme.value
        : settings.theme;

    settings.language = language
        ? language.value
        : settings.language;

    settings.notifications = notifications
        ? notifications.checked
        : settings.notifications;

    settings.emailNotifications = emailNotifications
        ? emailNotifications.checked
        : settings.emailNotifications;

    settings.autoSave = autoSave
        ? autoSave.checked
        : settings.autoSave;

    settings.autoRefresh = autoRefresh
        ? autoRefresh.checked
        : settings.autoRefresh;

    settings.refreshInterval = refreshInterval
        ? Number(refreshInterval.value)
        : settings.refreshInterval;

    settings.compactMode = compactMode
        ? compactMode.checked
        : settings.compactMode;

    settings.animations = animations
        ? animations.checked
        : settings.animations;

    settings.chartAnimations = chartAnimations
        ? chartAnimations.checked
        : settings.chartAnimations;

    settings.showGrid = showGrid
        ? showGrid.checked
        : settings.showGrid;

    settings.defaultChartType = defaultChartType
        ? defaultChartType.value
        : settings.defaultChartType;

    settings.dateFormat = dateFormat
        ? dateFormat.value
        : settings.dateFormat;

    settings.rowsPerPage = rowsPerPage
        ? Number(rowsPerPage.value)
        : settings.rowsPerPage;

    return settings;
}


// ==========================================
// Save Settings
// ==========================================

function handleSaveSettings() {

    const updatedSettings = readSettingsForm();

    const saved = saveSettings(updatedSettings);

    if (saved) {

        settings = updatedSettings;

        applyTheme(settings.theme);
        applyUISettings();

        showMessage(
            "Settings saved successfully.",
            "success"
        );

    } else {

        showMessage(
            "Unable to save settings.",
            "error"
        );
    }
}


// ==========================================
// Reset Settings
// ==========================================

function resetSettings() {

    const confirmed = confirm(
        "Are you sure you want to reset all settings to default?"
    );

    if (!confirmed) {
        return;
    }

    settings = { ...DEFAULT_SETTINGS };

    saveSettings(settings);

    populateSettingsForm();

    applyTheme(settings.theme);
    applyUISettings();

    showMessage(
        "Settings have been reset.",
        "success"
    );
}


// ==========================================
// Theme Change
// ==========================================

function handleThemeChange(event) {

    const selectedTheme = event.target.value;

    settings.theme = selectedTheme;

    applyTheme(selectedTheme);

    saveSettings(settings);
}


// ==========================================
// Auto Refresh
// ==========================================

let refreshTimer = null;


function startAutoRefresh() {

    stopAutoRefresh();

    if (!settings.autoRefresh) {
        return;
    }

    const interval =
        Math.max(Number(settings.refreshInterval), 5) * 1000;

    refreshTimer = setInterval(() => {

        window.dispatchEvent(
            new CustomEvent("velocityBI:autoRefresh")
        );

    }, interval);
}


function stopAutoRefresh() {

    if (refreshTimer !== null) {

        clearInterval(refreshTimer);

        refreshTimer = null;
    }
}


// ==========================================
// Notification Settings
// ==========================================

function updateNotificationSettings() {

    const notifications = getElement("notifications");

    const emailNotifications =
        getElement("emailNotifications");

    if (notifications) {
        settings.notifications = notifications.checked;
    }

    if (emailNotifications) {
        settings.emailNotifications =
            emailNotifications.checked;
    }

    saveSettings(settings);
}


// ==========================================
// Toggle Settings
// ==========================================

function setupToggle(id, property) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.addEventListener("change", () => {

        settings[property] = element.checked;

        saveSettings(settings);

        applyUISettings();

        if (property === "autoRefresh") {
            startAutoRefresh();
        }

        if (property === "refreshInterval") {
            startAutoRefresh();
        }
    });
}


// ==========================================
// Message / Toast
// ==========================================

function showMessage(message, type = "success") {

    let messageBox =
        getElement("settingsMessage");

    if (!messageBox) {

        messageBox = document.createElement("div");

        messageBox.id = "settingsMessage";

        messageBox.className = "settings-message";

        document.body.appendChild(messageBox);
    }

    messageBox.textContent = message;

    messageBox.className =
        `settings-message ${type}`;

    messageBox.style.display = "block";

    setTimeout(() => {

        messageBox.style.display = "none";

    }, 3000);
}


// ==========================================
// Change Password Placeholder
// ==========================================

function changePassword() {

    const currentPassword =
        prompt("Enter your current password:");

    if (!currentPassword) {
        return;
    }

    const newPassword =
        prompt("Enter your new password:");

    if (!newPassword) {
        return;
    }

    if (newPassword.length < 6) {

        showMessage(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }

    /*
     * IMPORTANT:
     * Password changes should normally be handled
     * by the backend API.
     *
     * Example:
     *
     * fetch("/api/auth/change-password", {
     *     method: "POST",
     *     headers: {
     *         "Content-Type": "application/json"
     *     },
     *     body: JSON.stringify({
     *         currentPassword,
     *         newPassword
     *     })
     * });
     */

    showMessage(
        "Password change request submitted.",
        "success"
    );
}


// ==========================================
// Clear Application Data
// ==========================================

function clearApplicationData() {

    const confirmed = confirm(
        "This will remove locally stored Velocity BI data. Continue?"
    );

    if (!confirmed) {
        return;
    }

    try {

        localStorage.removeItem(
            SETTINGS_STORAGE_KEY
        );

        localStorage.removeItem(
            "velocityBI_user"
        );

        localStorage.removeItem(
            "velocityBI_datasets"
        );

        localStorage.removeItem(
            "velocityBI_dashboard"
        );

        localStorage.removeItem(
            "velocityBI_reports"
        );

        sessionStorage.clear();

        showMessage(
            "Application data cleared successfully.",
            "success"
        );

        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {

        console.error(
            "Unable to clear application data:",
            error
        );

        showMessage(
            "Unable to clear application data.",
            "error"
        );
    }
}


// ==========================================
// Export Settings
// ==========================================

function exportSettings() {

    const data = JSON.stringify(
        settings,
        null,
        2
    );

    const blob = new Blob(
        [data],
        {
            type: "application/json"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "velocity-bi-settings.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ==========================================
// Import Settings
// ==========================================

function importSettings(file) {

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {

        try {

            const imported =
                JSON.parse(event.target.result);

            settings = {
                ...DEFAULT_SETTINGS,
                ...imported
            };

            saveSettings(settings);

            populateSettingsForm();

            applyTheme(settings.theme);
            applyUISettings();

            showMessage(
                "Settings imported successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Invalid settings file:",
                error
            );

            showMessage(
                "Invalid settings file.",
                "error"
            );
        }
    };

    reader.readAsText(file);
}


// ==========================================
// Keyboard Shortcuts
// ==========================================

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        function(event) {

            // Ctrl + S
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "s"
            ) {

                event.preventDefault();

                handleSaveSettings();
            }

        }
    );
}


// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {

    const saveButton =
        getElement("saveSettings");

    const resetButton =
        getElement("resetSettings");

    const theme =
        getElement("theme");

    const changePasswordButton =
        getElement("changePassword");

    const clearDataButton =
        getElement("clearApplicationData");

    const exportButton =
        getElement("exportSettings");

    const importInput =
        getElement("importSettings");


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            handleSaveSettings
        );
    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetSettings
        );
    }


    if (theme) {

        theme.addEventListener(
            "change",
            handleThemeChange
        );
    }


    if (changePasswordButton) {

        changePasswordButton.addEventListener(
            "click",
            changePassword
        );
    }


    if (clearDataButton) {

        clearDataButton.addEventListener(
            "click",
            clearApplicationData
        );
    }


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportSettings
        );
    }


    if (importInput) {

        importInput.addEventListener(
            "change",
            function(event) {

                const file =
                    event.target.files[0];

                importSettings(file);
            }
        );
    }


    setupToggle(
        "notifications",
        "notifications"
    );

    setupToggle(
        "emailNotifications",
        "emailNotifications"
    );

    setupToggle(
        "autoSave",
        "autoSave"
    );

    setupToggle(
        "autoRefresh",
        "autoRefresh"
    );

    setupToggle(
        "compactMode",
        "compactMode"
    );

    setupToggle(
        "animations",
        "animations"
    );

    setupToggle(
        "chartAnimations",
        "chartAnimations"
    );

    setupToggle(
        "showGrid",
        "showGrid"
    );

    setupKeyboardShortcuts();
}


// ==========================================
// Initialize Settings
// ==========================================

function initializeSettings() {

    settings = loadSettings();

    populateSettingsForm();

    applyTheme(settings.theme);

    applyUISettings();

    setupEventListeners();

    startAutoRefresh();

    console.log(
        "Velocity BI settings initialized."
    );
}


// ==========================================
// Public API
// ==========================================

window.VelocityBISettings = {

    get: function() {
        return { ...settings };
    },

    save: function(newSettings) {

        settings = {
            ...settings,
            ...newSettings
        };

        saveSettings(settings);

        applyTheme(settings.theme);
        applyUISettings();

        startAutoRefresh();
    },

    reset: resetSettings,

    export: exportSettings,

    import: importSettings,

    clearData: clearApplicationData
};


// ==========================================
// DOM Ready
// ==========================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSettings
    );

} else {

    initializeSettings();
}