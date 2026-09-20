// ==========================================
// Velocity BI - Reports Management
// File: frontend/js/reports.js
// ==========================================

"use strict";


// ==========================================
// Configuration
// ==========================================

const REPORTS_CONFIG = {
    storageKey: "velocity_bi_reports",
    datasetsKey: "velocity_bi_datasets",
    userKey: "velocity_bi_user",
    maxReports: 100
};


// ==========================================
// DOM Helpers
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}

function query(selector) {
    return document.querySelector(selector);
}

function queryAll(selector) {
    return document.querySelectorAll(selector);
}


// ==========================================
// Safe Storage
// ==========================================

const ReportsStorage = {

    isAvailable() {
        try {
            const testKey = "__velocity_reports_test__";
            localStorage.setItem(testKey, "1");
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn("localStorage is unavailable.");
            return false;
        }
    },

    get(key, defaultValue = null) {
        if (!this.isAvailable()) {
            return defaultValue;
        }

        try {
            const data = localStorage.getItem(key);

            if (!data) {
                return defaultValue;
            }

            return JSON.parse(data);

        } catch (error) {
            console.error("Storage read error:", error);
            return defaultValue;
        }
    },

    set(key, value) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Storage write error:", error);
            return false;
        }
    },

    remove(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error("Storage remove error:", error);
            return false;
        }
    }
};


// ==========================================
// Report State
// ==========================================

const ReportsState = {
    reports: [],
    filteredReports: [],
    selectedReport: null,
    searchTerm: "",
    category: "all",
    sortBy: "newest"
};


// ==========================================
// Generate ID
// ==========================================

function generateReportId() {

    return (
        "report_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 9)
    );
}


// ==========================================
// Format Date
// ==========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ==========================================
// Format Date + Time
// ==========================================

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// Load Reports
// ==========================================

function loadReports() {

    const storedReports = ReportsStorage.get(
        REPORTS_CONFIG.storageKey,
        []
    );

    ReportsState.reports = Array.isArray(storedReports)
        ? storedReports
        : [];

    applyFilters();
}


// ==========================================
// Save Reports
// ==========================================

function saveReports() {

    if (ReportsState.reports.length > REPORTS_CONFIG.maxReports) {

        ReportsState.reports =
            ReportsState.reports.slice(
                0,
                REPORTS_CONFIG.maxReports
            );
    }

    return ReportsStorage.set(
        REPORTS_CONFIG.storageKey,
        ReportsState.reports
    );
}


// ==========================================
// Create Report
// ==========================================

function createReport(reportData = {}) {

    const now = new Date().toISOString();

    const report = {

        id: generateReportId(),

        name:
            reportData.name ||
            "Untitled Report",

        description:
            reportData.description ||
            "",

        category:
            reportData.category ||
            "General",

        datasetId:
            reportData.datasetId ||
            null,

        datasetName:
            reportData.datasetName ||
            "No Dataset",

        type:
            reportData.type ||
            "Analytics",

        status:
            reportData.status ||
            "Draft",

        createdAt:
            reportData.createdAt ||
            now,

        updatedAt:
            reportData.updatedAt ||
            now,

        createdBy:
            reportData.createdBy ||
            getCurrentUserName(),

        charts:
            Array.isArray(reportData.charts)
                ? reportData.charts
                : [],

        filters:
            reportData.filters ||
            {},

        metrics:
            reportData.metrics ||
            {},

        data:
            reportData.data ||
            {}
    };

    ReportsState.reports.unshift(report);

    saveReports();
    applyFilters();

    showNotification(
        "Report created successfully.",
        "success"
    );

    return report;
}


// ==========================================
// Get Current User
// ==========================================

function getCurrentUser() {

    return ReportsStorage.get(
        REPORTS_CONFIG.userKey,
        null
    );
}


function getCurrentUserName() {

    const user = getCurrentUser();

    if (!user) {
        return "User";
    }

    return (
        user.name ||
        user.username ||
        user.email ||
        "User"
    );
}


// ==========================================
// Update Report
// ==========================================

function updateReport(reportId, updates = {}) {

    const index = ReportsState.reports.findIndex(
        report => report.id === reportId
    );

    if (index === -1) {
        showNotification(
            "Report not found.",
            "error"
        );
        return null;
    }

    ReportsState.reports[index] = {

        ...ReportsState.reports[index],

        ...updates,

        updatedAt: new Date().toISOString()
    };

    saveReports();
    applyFilters();

    return ReportsState.reports[index];
}


// ==========================================
// Delete Report
// ==========================================

function deleteReport(reportId) {

    const index = ReportsState.reports.findIndex(
        report => report.id === reportId
    );

    if (index === -1) {
        return false;
    }

    const reportName =
        ReportsState.reports[index].name;

    const confirmed = confirm(
        `Delete "${reportName}"?`
    );

    if (!confirmed) {
        return false;
    }

    ReportsState.reports.splice(index, 1);

    saveReports();
    applyFilters();

    showNotification(
        "Report deleted successfully.",
        "success"
    );

    return true;
}


// ==========================================
// Duplicate Report
// ==========================================

function duplicateReport(reportId) {

    const original =
        ReportsState.reports.find(
            report => report.id === reportId
        );

    if (!original) {
        return null;
    }

    const copy = {
        ...original,

        id: generateReportId(),

        name:
            `${original.name} - Copy`,

        status: "Draft",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };

    ReportsState.reports.unshift(copy);

    saveReports();
    applyFilters();

    showNotification(
        "Report duplicated successfully.",
        "success"
    );

    return copy;
}


// ==========================================
// Get Report By ID
// ==========================================

function getReportById(reportId) {

    return ReportsState.reports.find(
        report => report.id === reportId
    ) || null;
}


// ==========================================
// Search Reports
// ==========================================

function searchReports(searchTerm) {

    ReportsState.searchTerm =
        String(searchTerm || "")
            .trim()
            .toLowerCase();

    applyFilters();
}


// ==========================================
// Filter Reports
// ==========================================

function filterReports(category) {

    ReportsState.category =
        category || "all";

    applyFilters();
}


// ==========================================
// Apply Filters
// ==========================================

function applyFilters() {

    let reports = [...ReportsState.reports];

    const search =
        ReportsState.searchTerm;

    const category =
        ReportsState.category;

    if (search) {

        reports = reports.filter(report => {

            return (

                report.name
                    .toLowerCase()
                    .includes(search)

                ||

                report.description
                    .toLowerCase()
                    .includes(search)

                ||

                report.category
                    .toLowerCase()
                    .includes(search)

                ||

                report.datasetName
                    .toLowerCase()
                    .includes(search)
            );
        });
    }

    if (category !== "all") {

        reports = reports.filter(
            report =>
                String(report.category)
                    .toLowerCase() ===
                String(category)
                    .toLowerCase()
        );
    }

    sortReportsArray(reports);

    ReportsState.filteredReports = reports;

    renderReports();
}


// ==========================================
// Sort Reports
// ==========================================

function sortReports(sortBy) {

    ReportsState.sortBy =
        sortBy || "newest";

    applyFilters();
}


function sortReportsArray(reports) {

    switch (ReportsState.sortBy) {

        case "oldest":

            reports.sort(
                (a, b) =>
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
            );

            break;

        case "name":

            reports.sort(
                (a, b) =>
                    a.name.localeCompare(b.name)
            );

            break;

        case "updated":

            reports.sort(
                (a, b) =>
                    new Date(b.updatedAt) -
                    new Date(a.updatedAt)
            );

            break;

        case "newest":
        default:

            reports.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

            break;
    }
}


// ==========================================
// Render Reports
// ==========================================

function renderReports() {

    const container =
        getElement("reportsContainer") ||
        query(".reports-container") ||
        query("#reports-list");

    if (!container) {
        return;
    }

    const reports =
        ReportsState.filteredReports;

    if (!reports.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No Reports Found</h3>
                <p>Create a report or change your search filters.</p>
            </div>
        `;

        updateReportCount(0);

        return;
    }

    container.innerHTML =
        reports
            .map(report => createReportCard(report))
            .join("");

    updateReportCount(reports.length);
}


// ==========================================
// Create Report Card
// ==========================================

function createReportCard(report) {

    const statusClass =
        String(report.status)
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `
        <div
            class="report-card"
            data-report-id="${escapeHTML(report.id)}"
        >

            <div class="report-card-header">

                <div class="report-icon">
                    📊
                </div>

                <div class="report-title-area">

                    <h3>
                        ${escapeHTML(report.name)}
                    </h3>

                    <span class="report-category">
                        ${escapeHTML(report.category)}
                    </span>

                </div>

                <span class="report-status ${statusClass}">
                    ${escapeHTML(report.status)}
                </span>

            </div>


            <div class="report-card-body">

                <p class="report-description">
                    ${escapeHTML(
                        report.description ||
                        "No description available."
                    )}
                </p>


                <div class="report-meta">

                    <span>
                        Dataset:
                        <strong>
                            ${escapeHTML(
                                report.datasetName
                            )}
                        </strong>
                    </span>

                    <span>
                        Created:
                        <strong>
                            ${formatDate(
                                report.createdAt
                            )}
                        </strong>
                    </span>

                    <span>
                        By:
                        <strong>
                            ${escapeHTML(
                                report.createdBy
                            )}
                        </strong>
                    </span>

                </div>

            </div>


            <div class="report-card-footer">

                <button
                    class="btn btn-primary"
                    onclick="previewReport('${escapeHTML(report.id)}')"
                >
                    Preview
                </button>

                <button
                    class="btn btn-secondary"
                    onclick="editReport('${escapeHTML(report.id)}')"
                >
                    Edit
                </button>

                <button
                    class="btn btn-secondary"
                    onclick="downloadReport('${escapeHTML(report.id)}')"
                >
                    Download
                </button>

                <button
                    class="btn btn-danger"
                    onclick="deleteReport('${escapeHTML(report.id)}')"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


// ==========================================
// Update Report Count
// ==========================================

function updateReportCount(count) {

    const elements = [
        getElement("reportCount"),
        getElement("reportsCount"),
        query(".report-count")
    ];

    elements.forEach(element => {

        if (element) {
            element.textContent = count;
        }

    });
}


// ==========================================
// Preview Report
// ==========================================

function previewReport(reportId) {

    const report =
        getReportById(reportId);

    if (!report) {
        showNotification(
            "Report not found.",
            "error"
        );
        return;
    }

    ReportsState.selectedReport =
        report;

    const modal =
        getElement("reportPreviewModal");

    if (modal) {

        const title =
            getElement("previewReportTitle");

        const content =
            getElement("previewReportContent");

        if (title) {
            title.textContent =
                report.name;
        }

        if (content) {

            content.innerHTML = `
                <div class="report-preview">

                    <h2>
                        ${escapeHTML(report.name)}
                    </h2>

                    <p>
                        ${escapeHTML(
                            report.description
                        )}
                    </p>

                    <hr>

                    <div class="preview-info">

                        <p>
                            <strong>Category:</strong>
                            ${escapeHTML(
                                report.category
                            )}
                        </p>

                        <p>
                            <strong>Dataset:</strong>
                            ${escapeHTML(
                                report.datasetName
                            )}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${escapeHTML(
                                report.status
                            )}
                        </p>

                        <p>
                            <strong>Created:</strong>
                            ${formatDateTime(
                                report.createdAt
                            )}
                        </p>

                        <p>
                            <strong>Last Updated:</strong>
                            ${formatDateTime(
                                report.updatedAt
                            )}
                        </p>

                    </div>

                    ${renderReportMetrics(report)}

                    ${renderReportCharts(report)}

                </div>
            `;
        }

        modal.classList.add("active");

        return;
    }

    // Fallback
    showReportDetails(report);
}


// ==========================================
// Render Metrics
// ==========================================

function renderReportMetrics(report) {

    const metrics =
        report.metrics || {};

    const keys =
        Object.keys(metrics);

    if (!keys.length) {
        return "";
    }

    return `
        <div class="report-metrics">

            ${keys.map(key => `
                <div class="metric-card">

                    <span class="metric-label">
                        ${escapeHTML(key)}
                    </span>

                    <strong class="metric-value">
                        ${escapeHTML(
                            metrics[key]
                        )}
                    </strong>

                </div>
            `).join("")}

        </div>
    `;
}


// ==========================================
// Render Charts
// ==========================================

function renderReportCharts(report) {

    if (
        !Array.isArray(report.charts) ||
        !report.charts.length
    ) {
        return `
            <div class="no-charts">
                No charts available for this report.
            </div>
        `;
    }

    return `
        <div class="report-charts">

            ${report.charts.map(
                (chart, index) => `

                <div class="report-chart">

                    <h4>
                        ${escapeHTML(
                            chart.title ||
                            `Chart ${index + 1}`
                        )}
                    </h4>

                    <div class="chart-placeholder">

                        📈

                        <span>
                            ${
                                escapeHTML(
                                    chart.type ||
                                    "Chart"
                                )
                            }
                        </span>

                    </div>

                </div>

            `
            ).join("")}

        </div>
    `;
}


// ==========================================
// Show Report Details
// ==========================================

function showReportDetails(report) {

    const message = `

Report: ${report.name}

Category: ${report.category}

Dataset: ${report.datasetName}

Status: ${report.status}

Created: ${formatDateTime(report.createdAt)}

Updated: ${formatDateTime(report.updatedAt)}

    `;

    alert(message);
}


// ==========================================
// Close Preview Modal
// ==========================================

function closeReportPreview() {

    const modal =
        getElement("reportPreviewModal");

    if (modal) {
        modal.classList.remove("active");
    }

    ReportsState.selectedReport =
        null;
}


// ==========================================
// Edit Report
// ==========================================

function editReport(reportId) {

    const report =
        getReportById(reportId);

    if (!report) {
        showNotification(
            "Report not found.",
            "error"
        );
        return;
    }

    const nameInput =
        getElement("reportName");

    const descriptionInput =
        getElement("reportDescription");

    const categoryInput =
        getElement("reportCategory");

    const reportIdInput =
        getElement("reportId");

    if (nameInput) {
        nameInput.value =
            report.name;
    }

    if (descriptionInput) {
        descriptionInput.value =
            report.description;
    }

    if (categoryInput) {
        categoryInput.value =
            report.category;
    }

    if (reportIdInput) {
        reportIdInput.value =
            report.id;
    }

    const form =
        getElement("reportForm");

    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;
    }

    showReportDetails(report);
}


// ==========================================
// Save Report Form
// ==========================================

function saveReportForm(event) {

    if (event) {
        event.preventDefault();
    }

    const name =
        getElement("reportName")?.value.trim();

    const description =
        getElement("reportDescription")?.value.trim();

    const category =
        getElement("reportCategory")?.value;

    const reportId =
        getElement("reportId")?.value;

    if (!name) {

        showNotification(
            "Please enter a report name.",
            "error"
        );

        return;
    }

    if (reportId) {

        updateReport(reportId, {

            name,

            description,

            category

        });

        showNotification(
            "Report updated successfully.",
            "success"
        );

    } else {

        createReport({

            name,

            description,

            category

        });
    }

    const form =
        getElement("reportForm");

    if (form) {
        form.reset();
    }
}


// ==========================================
// Download Report
// ==========================================

function downloadReport(reportId) {

    const report =
        getReportById(reportId);

    if (!report) {

        showNotification(
            "Report not found.",
            "error"
        );

        return;
    }

    const reportData = {

        reportName: report.name,

        description: report.description,

        category: report.category,

        dataset: report.datasetName,

        status: report.status,

        createdBy: report.createdBy,

        createdAt:
            formatDateTime(report.createdAt),

        updatedAt:
            formatDateTime(report.updatedAt),

        metrics:
            report.metrics,

        charts:
            report.charts
    };

    const json =
        JSON.stringify(
            reportData,
            null,
            2
        );

    const blob =
        new Blob(
            [json],
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
        `${sanitizeFileName(report.name)}.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showNotification(
        "Report downloaded.",
        "success"
    );
}


// ==========================================
// Sanitize File Name
// ==========================================

function sanitizeFileName(name) {

    return String(name || "report")
        .replace(/[<>:"/\\|?*]+/g, "_")
        .replace(/\s+/g, "_")
        .substring(0, 100);
}


// ==========================================
// Export CSV
// ==========================================

function exportReportsCSV() {

    const reports =
        ReportsState.filteredReports;

    if (!reports.length) {

        showNotification(
            "No reports available for export.",
            "warning"
        );

        return;
    }

    const headers = [
        "Name",
        "Category",
        "Dataset",
        "Status",
        "Created By",
        "Created At",
        "Updated At"
    ];

    const rows =
        reports.map(report => [

            report.name,

            report.category,

            report.datasetName,

            report.status,

            report.createdBy,

            formatDateTime(report.createdAt),

            formatDateTime(report.updatedAt)

        ]);

    const csv = [

        headers,

        ...rows

    ].map(row =>

        row.map(value =>
            `"${String(value)
                .replace(/"/g, '""')}"`
        ).join(",")

    ).join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "velocity-bi-reports.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showNotification(
        "Reports exported successfully.",
        "success"
    );
}


// ==========================================
// Generate Demo Reports
// ==========================================

function generateDemoReports() {

    if (ReportsState.reports.length > 0) {
        return;
    }

    createReport({

        name: "Sales Performance Report",

        description:
            "Monthly sales performance analysis.",

        category: "Sales",

        datasetName: "Sales Dataset",

        type: "Analytics",

        status: "Completed",

        metrics: {

            "Total Sales": "₹12,45,000",

            "Orders": "2,845",

            "Customers": "1,254",

            "Growth": "18.4%"

        },

        charts: [

            {
                title: "Monthly Sales",
                type: "Line Chart"
            },

            {
                title: "Sales by Category",
                type: "Bar Chart"
            }

        ]

    });


    createReport({

        name: "Customer Analytics",

        description:
            "Customer behavior and segmentation report.",

        category: "Customers",

        datasetName: "Customer Dataset",

        type: "Analytics",

        status: "Completed",

        metrics: {

            "Total Customers": "8,540",

            "Active Customers": "6,245",

            "Retention": "72.5%"

        },

        charts: [

            {
                title: "Customer Segments",
                type: "Pie Chart"
            },

            {
                title: "Customer Growth",
                type: "Line Chart"
            }

        ]

    });
}


// ==========================================
// Notification
// ==========================================

function showNotification(message, type = "info") {

    let notification =
        getElement("reportNotification");

    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "reportNotification";

        notification.className =
            "report-notification";

        document.body.appendChild(
            notification
        );
    }

    notification.className =
        `report-notification ${type}`;

    notification.textContent =
        message;

    notification.classList.add("show");

    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3000);
}


// ==========================================
// Search Input Event
// ==========================================

function setupSearch() {

    const searchInput =
        getElement("reportSearch") ||
        query(".report-search");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        event => {

            searchReports(
                event.target.value
            );

        }
    );
}


// ==========================================
// Filter Event
// ==========================================

function setupFilters() {

    const categoryFilter =
        getElement("reportCategoryFilter");

    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            event => {

                filterReports(
                    event.target.value
                );

            }
        );
    }


    const sortFilter =
        getElement("reportSort");

    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            event => {

                sortReports(
                    event.target.value
                );

            }
        );
    }
}


// ==========================================
// Form Event
// ==========================================

function setupReportForm() {

    const form =
        getElement("reportForm");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        saveReportForm
    );
}


// ==========================================
// Modal Events
// ==========================================

function setupModalEvents() {

    const modal =
        getElement("reportPreviewModal");

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeReportPreview();

            }

        }
    );
}


// ==========================================
// Keyboard Shortcuts
// ==========================================

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeReportPreview();

            }

        }
    );
}


// ==========================================
// Initialize Reports
// ==========================================

function initializeReports() {

    console.log(
        "Velocity BI Reports initialized."
    );

    loadReports();

    setupSearch();

    setupFilters();

    setupReportForm();

    setupModalEvents();

    setupKeyboardShortcuts();
}


// ==========================================
// Global API
// ==========================================

window.VelocityReports = {

    load: loadReports,

    create: createReport,

    update: updateReport,

    delete: deleteReport,

    duplicate: duplicateReport,

    get: getReportById,

    search: searchReports,

    filter: filterReports,

    sort: sortReports,

    preview: previewReport,

    download: downloadReport,

    exportCSV: exportReportsCSV,

    refresh: applyFilters

};


// ==========================================
// Global Functions
// ==========================================

window.createReport =
    createReport;

window.updateReport =
    updateReport;

window.deleteReport =
    deleteReport;

window.duplicateReport =
    duplicateReport;

window.previewReport =
    previewReport;

window.closeReportPreview =
    closeReportPreview;

window.editReport =
    editReport;

window.downloadReport =
    downloadReport;

window.exportReportsCSV =
    exportReportsCSV;

window.searchReports =
    searchReports;

window.filterReports =
    filterReports;

window.sortReports =
    sortReports;


// ==========================================
// Start Application
// ==========================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeReports
    );

} else {

    initializeReports();

}