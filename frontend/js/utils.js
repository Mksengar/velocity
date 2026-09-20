```javascript
// ==========================================
// Velocity BI - Utility Functions
// File: frontend/js/utils.js
// ==========================================


// ==========================================
// DOM Helpers
// ==========================================

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function getElement(id) {
    return document.getElementById(id);
}

function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    return element;
}


// ==========================================
// Show / Hide Elements
// ==========================================

function showElement(element) {
    if (!element) return;

    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (element) {
        element.style.display = "";
    }
}

function hideElement(element) {
    if (!element) return;

    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (element) {
        element.style.display = "none";
    }
}

function toggleElement(element) {
    if (!element) return;

    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (!element) return;

    const isHidden =
        element.style.display === "none" ||
        window.getComputedStyle(element).display === "none";

    if (isHidden) {
        showElement(element);
    } else {
        hideElement(element);
    }
}


// ==========================================
// HTML Escape
// ==========================================

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const div = document.createElement("div");
    div.textContent = String(value);

    return div.innerHTML;
}


// ==========================================
// Loading Spinner
// ==========================================

function showLoading(element, text = "Loading...") {
    if (!element) return;

    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (!element) return;

    if (!element.dataset.originalContent) {
        element.dataset.originalContent = element.innerHTML;
    }

    element.innerHTML = `
        <div class="loading-spinner">
            <span class="spinner"></span>
            <span>${escapeHTML(text)}</span>
        </div>
    `;

    element.classList.add("is-loading");
}

function hideLoading(element) {
    if (!element) return;

    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (!element) return;

    if (element.dataset.originalContent !== undefined) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
    }

    element.classList.remove("is-loading");
}


// ==========================================
// Button Loading
// ==========================================

function setButtonLoading(
    button,
    loading = true,
    loadingText = "Loading..."
) {
    if (!button) return;

    if (typeof button === "string") {
        button = document.querySelector(button);
    }

    if (!button) return;

    if (loading) {
        button.disabled = true;

        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${escapeHTML(loadingText)}
        `;
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.originalText || "Submit";

        delete button.dataset.originalText;
    }
}


// ==========================================
// Notifications
// ==========================================

function showNotification(
    message,
    type = "info",
    duration = 4000
) {
    let container = document.getElementById(
        "notificationContainer"
    );

    if (!container) {
        container = document.createElement("div");

        container.id = "notificationContainer";
        container.className = "notification-container";

        document.body.appendChild(container);
    }

    const notification =
        document.createElement("div");

    notification.className =
        `notification notification-${type}`;

    notification.innerHTML = `
        <span class="notification-message">
            ${escapeHTML(message)}
        </span>

        <button
            class="notification-close"
            type="button"
            aria-label="Close notification"
        >
            &times;
        </button>
    `;

    container.appendChild(notification);

    const closeButton =
        notification.querySelector(
            ".notification-close"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            () => removeNotification(notification)
        );
    }

    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }

    return notification;
}

function removeNotification(notification) {
    if (!notification) return;

    notification.classList.add(
        "notification-hide"
    );

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

function showSuccess(message) {
    return showNotification(
        message,
        "success"
    );
}

function showError(message) {
    return showNotification(
        message,
        "error"
    );
}

function showWarning(message) {
    return showNotification(
        message,
        "warning"
    );
}

function showInfo(message) {
    return showNotification(
        message,
        "info"
    );
}


// ==========================================
// Number Formatting
// ==========================================

function formatNumber(
    value,
    decimals = 2
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }
    );
}

function formatInteger(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0
        }
    );
}


// ==========================================
// Currency Formatting
// ==========================================

function formatCurrency(
    value,
    currency = "INR"
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "₹0.00";
    }

    try {
        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 2
            }
        ).format(number);
    } catch (error) {
        return `${currency} ${number.toFixed(2)}`;
    }
}


// ==========================================
// Percentage Formatting
// ==========================================

function formatPercentage(
    value,
    decimals = 2
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0%";
    }

    return `${number.toFixed(decimals)}%`;
}


// ==========================================
// File Size Formatting
// ==========================================

function formatFileSize(bytes) {
    const number = Number(bytes);

    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index = Math.min(
        Math.floor(
            Math.log(number) / Math.log(1024)
        ),
        units.length - 1
    );

    const size =
        number / Math.pow(1024, index);

    return `${size.toFixed(
        index === 0 ? 0 : 2
    )} ${units[index]}`;
}


// ==========================================
// Date Formatting
// ==========================================

function formatDate(date) {
    if (!date) {
        return "-";
    }

    const dateObject = new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {
        return "-";
    }

    return dateObject.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatDateTime(date) {
    if (!date) {
        return "-";
    }

    const dateObject = new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {
        return "-";
    }

    return dateObject.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// Relative Time
// ==========================================

function timeAgo(date) {
    const dateObject = new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {
        return "-";
    }

    const now = new Date();

    const seconds = Math.floor(
        (now.getTime() - dateObject.getTime()) /
        1000
    );

    if (seconds < 0) {
        return "Just now";
    }

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(
        seconds / 60
    );

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days = Math.floor(
        hours / 24
    );

    if (days < 30) {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
    }

    const months = Math.floor(
        days / 30
    );

    if (months < 12) {
        return `${months} month${months !== 1 ? "s" : ""} ago`;
    }

    const years = Math.floor(
        months / 12
    );

    return `${years} year${years !== 1 ? "s" : ""} ago`;
}


// ==========================================
// Validation
// ==========================================

function isValidEmail(email) {
    if (!email) {
        return false;
    }

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
        String(email).trim().toLowerCase()
    );
}

function isValidPassword(
    password,
    minimumLength = 6
) {
    if (
        typeof password !== "string"
    ) {
        return false;
    }

    return password.length >= minimumLength;
}

function validateRequiredFields(fields) {
    const errors = [];

    if (!Array.isArray(fields)) {
        return errors;
    }

    fields.forEach(field => {
        const element =
            typeof field === "string"
                ? document.querySelector(field)
                : field;

        if (!element) {
            return;
        }

        const value =
            element.value !== undefined
                ? String(element.value).trim()
                : "";

        if (!value) {
            errors.push(
                `${element.name || element.id || "Field"} is required.`
            );

            element.classList.add(
                "input-error"
            );
        } else {
            element.classList.remove(
                "input-error"
            );
        }
    });

    return errors;
}


// ==========================================
// Debounce
// ==========================================

function debounce(
    callback,
    delay = 300
) {
    let timer = null;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}


// ==========================================
// Throttle
// ==========================================

function throttle(
    callback,
    limit = 300
) {
    let waiting = false;

    return function (...args) {
        if (waiting) {
            return;
        }

        callback.apply(this, args);

        waiting = true;

        setTimeout(() => {
            waiting = false;
        }, limit);
    };
}


// ==========================================
// Local Storage
// ==========================================

function setStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            "LocalStorage error:",
            error
        );

        return false;
    }
}

function getStorage(
    key,
    defaultValue = null
) {
    try {
        const value =
            localStorage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        return JSON.parse(value);

    } catch (error) {
        console.error(
            "LocalStorage read error:",
            error
        );

        return defaultValue;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(
            "LocalStorage remove error:",
            error
        );
    }
}


// ==========================================
// Query Parameters
// ==========================================

function getQueryParam(name) {
    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(name);
}


// ==========================================
// Navigation
// ==========================================

function navigateTo(page) {
    if (!page) return;

    window.location.href = page;
}


// ==========================================
// Copy To Clipboard
// ==========================================

async function copyToClipboard(text) {
    try {
        if (
            !navigator.clipboard ||
            !navigator.clipboard.writeText
        ) {
            throw new Error(
                "Clipboard API is not available."
            );
        }

        await navigator.clipboard.writeText(
            String(text)
        );

        showSuccess(
            "Copied to clipboard."
        );

        return true;

    } catch (error) {
        console.error(
            "Copy failed:",
            error
        );

        showError(
            "Unable to copy text."
        );

        return false;
    }
}


// ==========================================
// Download File
// ==========================================

function downloadFile(
    data,
    filename,
    mimeType = "text/plain"
) {
    if (!filename) {
        filename = "download";
    }

    const blob =
        data instanceof Blob
            ? data
            : new Blob(
                [data],
                {
                    type: mimeType
                }
            );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}


// ==========================================
// CSV Download
// ==========================================

function downloadCSV(
    rows,
    filename = "velocity-bi-data.csv"
) {
    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {
        showWarning(
            "No data available for export."
        );

        return;
    }

    const headers =
        Object.keys(rows[0]);

    const csvRows = [];

    csvRows.push(
        headers.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    );

    rows.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];

            if (
                value === null ||
                value === undefined
            ) {
                value = "";
            }

            return `"${String(value)
                .replace(/"/g, '""')}"`;
        });

        csvRows.push(
            values.join(",")
        );
    });

    downloadFile(
        csvRows.join("\n"),
        filename,
        "text/csv;charset=utf-8;"
    );
}


// ==========================================
// Array Helpers
// ==========================================

function uniqueArray(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    return [...new Set(array)];
}

function sortBy(
    array,
    key,
    ascending = true
) {
    if (!Array.isArray(array)) {
        return [];
    }

    return [...array].sort((a, b) => {
        const valueA = a?.[key];
        const valueB = b?.[key];

        if (valueA === valueB) {
            return 0;
        }

        if (valueA === undefined) {
            return 1;
        }

        if (valueB === undefined) {
            return -1;
        }

        if (valueA < valueB) {
            return ascending ? -1 : 1;
        }

        return ascending ? 1 : -1;
    });
}


// ==========================================
// Dashboard Statistics
// ==========================================

function calculateChange(
    current,
    previous
) {
    current = Number(current) || 0;
    previous = Number(previous) || 0;

    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }

    return (
        (current - previous) /
        Math.abs(previous)
    ) * 100;
}

function updateStatistic(
    element,
    value,
    previousValue = null
) {
    if (!element) {
        return;
    }

    if (typeof element === "string") {
        element =
            document.querySelector(element);
    }

    if (!element) {
        return;
    }

    const valueElement =
        element.querySelector(
            ".stat-value"
        );

    const changeElement =
        element.querySelector(
            ".stat-change"
        );

    if (valueElement) {
        valueElement.textContent =
            formatNumber(value);
    }

    if (
        changeElement &&
        previousValue !== null
    ) {
        const change =
            calculateChange(
                value,
                previousValue
            );

        const sign =
            change >= 0 ? "+" : "";

        changeElement.textContent =
            `${sign}${change.toFixed(1)}%`;

        changeElement.classList.toggle(
            "positive",
            change >= 0
        );

        changeElement.classList.toggle(
            "negative",
            change < 0
        );
    }
}


// ==========================================
// Empty State
// ==========================================

function showEmptyState(
    container,
    message = "No data available."
) {
    if (!container) {
        return;
    }

    if (typeof container === "string") {
        container =
            document.querySelector(container);
    }

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                📊
            </div>

            <h3>No Data</h3>

            <p>
                ${escapeHTML(message)}
            </p>
        </div>
    `;
}


// ==========================================
// Error State
// ==========================================

function showErrorState(
    container,
    message = "Something went wrong."
) {
    if (!container) {
        return;
    }

    if (typeof container === "string") {
        container =
            document.querySelector(container);
    }

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="error-state">

            <div class="error-state-icon">
                ⚠️
            </div>

            <h3>Unable to Load Data</h3>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="retry-btn"
                onclick="location.reload()"
            >
                Retry
            </button>

        </div>
    `;
}


// ==========================================
// Confirmation
// ==========================================

function confirmAction(
    message,
    callback
) {
    const confirmed =
        window.confirm(message);

    if (
        confirmed &&
        typeof callback === "function"
    ) {
        callback();
    }

    return confirmed;
}


// ==========================================
// Generate ID
// ==========================================

function generateId(prefix = "id") {
    return (
        `${prefix}_` +
        `${Date.now()}_` +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


// ==========================================
// Text Helpers
// ==========================================

function capitalize(text) {
    if (!text) {
        return "";
    }

    const value = String(text);

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

function titleCase(text) {
    if (!text) {
        return "";
    }

    return String(text)
        .toLowerCase()
        .split(/\s+/)
        .map(word => capitalize(word))
        .join(" ");
}

function truncateText(
    text,
    maxLength = 100
) {
    if (!text) {
        return "";
    }

    text = String(text);

    if (text.length <= maxLength) {
        return text;
    }

    return (
        text.substring(
            0,
            Math.max(0, maxLength - 3)
        ) + "..."
    );
}


// ==========================================
// Scroll To Element
// ==========================================

function scrollToElement(selector) {
    const element =
        typeof selector === "string"
            ? document.querySelector(selector)
            : selector;

    if (!element) {
        return;
    }

    element.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// Network Status
// ==========================================

function isOnline() {
    return navigator.onLine;
}

window.addEventListener(
    "offline",
    () => {
        if (
            typeof showWarning === "function"
        ) {
            showWarning(
                "You are offline. Some features may not work."
            );
        }
    }
);

window.addEventListener(
    "online",
    () => {
        if (
            typeof showSuccess === "function"
        ) {
            showSuccess(
                "Internet connection restored."
            );
        }
    }
);


// ==========================================
// Initialize Utilities
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Current year
        document
            .querySelectorAll(
                "[data-current-year]"
            )
            .forEach(element => {
                element.textContent =
                    new Date().getFullYear();
            });


        // Number formatting
        document
            .querySelectorAll(
                "[data-format-number]"
            )
            .forEach(element => {
                element.textContent =
                    formatNumber(
                        element.textContent
                    );
            });


        // Currency formatting
        document
            .querySelectorAll(
                "[data-format-currency]"
            )
            .forEach(element => {
                element.textContent =
                    formatCurrency(
                        element.textContent
                    );
            });


        // Date formatting
        document
            .querySelectorAll(
                "[data-format-date]"
            )
            .forEach(element => {
                element.textContent =
                    formatDate(
                        element.textContent
                    );
            });
    }
);
```
