// ==========================================
// Velocity BI - Dashboard Builder
// File: frontend/js/dashboard-builder.js
// ==========================================

"use strict";

// ==========================================
// Global State
// ==========================================

let dashboardWidgets = [];
let selectedWidgetId = null;
let dashboardData = [];

let dashboardChartInstances = {};

const DASHBOARD_STORAGE_KEY =
    "velocityBI_dashboard_builder";


// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeDashboardBuilder();
});


function initializeDashboardBuilder() {

    console.log(
        "Velocity BI - Dashboard Builder initialized"
    );

    loadDashboardData();

    loadSavedDashboard();

    setupDashboardEvents();

    renderDashboard();
}


// ==========================================
// Setup Events
// ==========================================

function setupDashboardEvents() {

    const addButton =
        document.getElementById("addWidget");

    if (addButton) {
        addButton.addEventListener(
            "click",
            addWidgetFromForm
        );
    }

    const saveButton =
        document.getElementById("saveDashboard");

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveDashboard
        );
    }

    const clearButton =
        document.getElementById("clearDashboard");

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearDashboard
        );
    }

    const exportButton =
        document.getElementById("exportDashboard");

    if (exportButton) {
        exportButton.addEventListener(
            "click",
            exportDashboard
        );
    }
}


// ==========================================
// Load Dataset
// ==========================================

function loadDashboardData() {

    try {

        if (
            window.VelocityStorage &&
            typeof VelocityStorage.getDataset === "function"
        ) {

            dashboardData =
                VelocityStorage.getDataset();

        } else {

            const stored =
                sessionStorage.getItem(
                    "velocityBI_dataset"
                );

            if (stored) {
                dashboardData =
                    JSON.parse(stored);
            }
        }

        if (!Array.isArray(dashboardData)) {
            dashboardData = [];
        }

        console.log(
            "Dashboard dataset:",
            dashboardData.length,
            "rows"
        );

        populateColumnSelectors();

    } catch (error) {

        console.error(
            "Unable to load dashboard dataset:",
            error
        );

        dashboardData = [];
    }
}


// ==========================================
// Populate Column Selectors
// ==========================================

function populateColumnSelectors() {

    const columns =
        dashboardData.length
            ? Object.keys(dashboardData[0])
            : [];

    const selectors = [
        "widgetXColumn",
        "widgetYColumn",
        "widgetValueColumn",
        "widgetLabelColumn"
    ];

    selectors.forEach(id => {

        const select =
            document.getElementById(id);

        if (!select) {
            return;
        }

        select.innerHTML =
            `<option value="">Select column</option>`;

        columns.forEach(column => {

            const option =
                document.createElement("option");

            option.value = column;
            option.textContent = column;

            select.appendChild(option);
        });
    });
}


// ==========================================
// Add Widget From Form
// ==========================================

function addWidgetFromForm() {

    const typeElement =
        document.getElementById("widgetType");

    const titleElement =
        document.getElementById("widgetTitle");

    const xElement =
        document.getElementById("widgetXColumn");

    const yElement =
        document.getElementById("widgetYColumn");

    const valueElement =
        document.getElementById(
            "widgetValueColumn"
        );

    const labelElement =
        document.getElementById(
            "widgetLabelColumn"
        );

    const type =
        typeElement
            ? typeElement.value
            : "bar";

    const title =
        titleElement?.value.trim() ||
        "New Widget";

    const widget = {

        id:
            generateWidgetId(),

        type,

        title,

        xColumn:
            xElement?.value || "",

        yColumn:
            yElement?.value || "",

        valueColumn:
            valueElement?.value || "",

        labelColumn:
            labelElement?.value || "",

        width: 6,

        height: 350,

        position: {
            x: 0,
            y: 0
        }
    };

    dashboardWidgets.push(widget);

    selectedWidgetId =
        widget.id;

    renderDashboard();

    showBuilderMessage(
        "Widget added successfully.",
        "success"
    );
}


// ==========================================
// Add Widget Programmatically
// ==========================================

function addWidget(
    type = "bar",
    title = "New Widget",
    options = {}
) {

    const widget = {

        id:
            generateWidgetId(),

        type,

        title,

        xColumn:
            options.xColumn || "",

        yColumn:
            options.yColumn || "",

        valueColumn:
            options.valueColumn || "",

        labelColumn:
            options.labelColumn || "",

        width:
            options.width || 6,

        height:
            options.height || 350,

        position: {
            x: options.x || 0,
            y: options.y || 0
        }
    };

    dashboardWidgets.push(widget);

    renderDashboard();

    return widget;
}


// ==========================================
// Generate Widget ID
// ==========================================

function generateWidgetId() {

    return (
        "widget_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


// ==========================================
// Render Dashboard
// ==========================================

function renderDashboard() {

    const container =
        document.getElementById(
            "dashboardCanvas"
        );

    if (!container) {
        return;
    }

    // Destroy old charts
    Object.values(
        dashboardChartInstances
    ).forEach(chart => {

        try {
            chart.destroy();
        } catch {
            // Ignore chart cleanup errors
        }
    });

    dashboardChartInstances = {};

    container.innerHTML = "";

    if (!dashboardWidgets.length) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <h3>Dashboard is empty</h3>
                <p>
                    Add a widget to start building
                    your dashboard.
                </p>
            </div>
        `;

        return;
    }

    dashboardWidgets.forEach(
        widget => {

            const element =
                createWidgetElement(
                    widget
                );

            container.appendChild(
                element
            );
        }
    );

    initializeDragAndDrop();
}


// ==========================================
// Create Widget Element
// ==========================================

function createWidgetElement(widget) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "dashboard-widget";

    wrapper.dataset.widgetId =
        widget.id;

    wrapper.style.minHeight =
        `${widget.height}px`;

    wrapper.style.gridColumn =
        `span ${widget.width}`;

    if (
        selectedWidgetId ===
        widget.id
    ) {
        wrapper.classList.add(
            "selected"
        );
    }

    wrapper.innerHTML = `

        <div class="widget-header">

            <h3>
                ${escapeHTML(widget.title)}
            </h3>

            <div class="widget-actions">

                <button
                    class="edit-widget"
                    data-id="${widget.id}"
                    title="Edit widget"
                >
                    ✏️
                </button>

                <button
                    class="duplicate-widget"
                    data-id="${widget.id}"
                    title="Duplicate widget"
                >
                    📋
                </button>

                <button
                    class="delete-widget"
                    data-id="${widget.id}"
                    title="Delete widget"
                >
                    🗑️
                </button>

            </div>

        </div>

        <div class="widget-body">

            <div
                class="widget-chart-container"
                style="height:${widget.height - 70}px;"
            >
                <canvas
                    id="chart-${widget.id}"
                ></canvas>
            </div>

        </div>
    `;

    wrapper.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".widget-actions"
                )
            ) {
                return;
            }

            selectWidget(widget.id);
        }
    );

    const deleteButton =
        wrapper.querySelector(
            ".delete-widget"
        );

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteWidget(
                    widget.id
                );
            }
        );
    }

    const duplicateButton =
        wrapper.querySelector(
            ".duplicate-widget"
        );

    if (duplicateButton) {

        duplicateButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                duplicateWidget(
                    widget.id
                );
            }
        );
    }

    const editButton =
        wrapper.querySelector(
            ".edit-widget"
        );

    if (editButton) {

        editButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                editWidget(
                    widget.id
                );
            }
        );
    }

    setTimeout(
        () => renderWidgetChart(widget),
        0
    );

    return wrapper;
}


// ==========================================
// Render Widget Chart
// ==========================================

function renderWidgetChart(widget) {

    const canvas =
        document.getElementById(
            `chart-${widget.id}`
        );

    if (!canvas) {
        return;
    }

    if (
        typeof Chart === "undefined"
    ) {

        canvas.parentElement.innerHTML =
            `
            <p>
                Chart.js is not loaded.
            </p>
            `;

        return;
    }

    const data =
        getWidgetData(widget);

    if (!data.length) {

        canvas.parentElement.innerHTML =
            `
            <div class="widget-no-data">
                No data available
            </div>
            `;

        return;
    }

    let chartConfig;

    switch (widget.type) {

        case "line":
            chartConfig =
                createLineChartConfig(
                    widget,
                    data
                );
            break;

        case "pie":
            chartConfig =
                createPieChartConfig(
                    widget,
                    data
                );
            break;

        case "doughnut":
            chartConfig =
                createDoughnutChartConfig(
                    widget,
                    data
                );
            break;

        case "scatter":
            chartConfig =
                createScatterChartConfig(
                    widget,
                    data
                );
            break;

        case "bar":
        default:
            chartConfig =
                createBarChartConfig(
                    widget,
                    data
                );
            break;
    }

    dashboardChartInstances[
        widget.id
    ] =
        new Chart(
            canvas.getContext("2d"),
            chartConfig
        );
}


// ==========================================
// Get Widget Data
// ==========================================

function getWidgetData(widget) {

    if (!dashboardData.length) {
        return [];
    }

    return dashboardData.filter(
        row => row
    );
}


// ==========================================
// Bar Chart
// ==========================================

function createBarChartConfig(
    widget,
    data
) {

    const labelColumn =
        widget.xColumn ||
        widget.labelColumn;

    const valueColumn =
        widget.yColumn ||
        widget.valueColumn;

    const labels =
        data.map(
            row =>
                row[labelColumn]
        );

    const values =
        data.map(
            row =>
                Number(
                    row[valueColumn]
                )
        );

    return {

        type: "bar",

        data: {

            labels,

            datasets: [
                {
                    label:
                        valueColumn ||
                        "Value",

                    data:
                        values,

                    borderWidth: 1
                }
            ]
        },

        options: getCommonChartOptions(
            widget
        )
    };
}


// ==========================================
// Line Chart
// ==========================================

function createLineChartConfig(
    widget,
    data
) {

    const labelColumn =
        widget.xColumn ||
        widget.labelColumn;

    const valueColumn =
        widget.yColumn ||
        widget.valueColumn;

    const labels =
        data.map(
            row =>
                row[labelColumn]
        );

    const values =
        data.map(
            row =>
                Number(
                    row[valueColumn]
                )
        );

    return {

        type: "line",

        data: {

            labels,

            datasets: [
                {
                    label:
                        valueColumn ||
                        "Value",

                    data:
                        values,

                    borderWidth: 2,

                    tension: 0.25,

                    fill: false
                }
            ]
        },

        options: getCommonChartOptions(
            widget
        )
    };
}


// ==========================================
// Pie Chart
// ==========================================

function createPieChartConfig(
    widget,
    data
) {

    const labelColumn =
        widget.labelColumn ||
        widget.xColumn;

    const valueColumn =
        widget.valueColumn ||
        widget.yColumn;

    const labels =
        data.map(
            row =>
                row[labelColumn]
        );

    const values =
        data.map(
            row =>
                Number(
                    row[valueColumn]
                )
        );

    return {

        type: "pie",

        data: {

            labels,

            datasets: [
                {
                    label:
                        valueColumn ||
                        "Value",

                    data:
                        values,

                    borderWidth: 1
                }
            ]
        },

        options: getCommonChartOptions(
            widget
        )
    };
}


// ==========================================
// Doughnut Chart
// ==========================================

function createDoughnutChartConfig(
    widget,
    data
) {

    const config =
        createPieChartConfig(
            widget,
            data
        );

    config.type =
        "doughnut";

    return config;
}


// ==========================================
// Scatter Chart
// ==========================================

function createScatterChartConfig(
    widget,
    data
) {

    const xColumn =
        widget.xColumn;

    const yColumn =
        widget.yColumn;

    const points =
        data.map(row => ({

            x:
                Number(
                    row[xColumn]
                ),

            y:
                Number(
                    row[yColumn]
                )
        }))
        .filter(point =>
            !isNaN(point.x) &&
            !isNaN(point.y)
        );

    return {

        type: "scatter",

        data: {

            datasets: [
                {
                    label:
                        widget.title,

                    data:
                        points,

                    borderWidth: 1
                }
            ]
        },

        options: getCommonChartOptions(
            widget
        )
    };
}


// ==========================================
// Common Chart Options
// ==========================================

function getCommonChartOptions(widget) {

    return {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                display: true
            },

            title: {
                display: false,
                text: widget.title
            }
        },

        scales: {

            x: {
                beginAtZero: false
            },

            y: {
                beginAtZero: false
            }
        }
    };
}


// ==========================================
// Select Widget
// ==========================================

function selectWidget(id) {

    selectedWidgetId = id;

    document
        .querySelectorAll(
            ".dashboard-widget"
        )
        .forEach(element => {

            element.classList.toggle(
                "selected",
                element.dataset.widgetId === id
            );
        });

    console.log(
        "Selected widget:",
        id
    );
}


// ==========================================
// Delete Widget
// ==========================================

function deleteWidget(id) {

    const index =
        dashboardWidgets.findIndex(
            widget =>
                widget.id === id
        );

    if (index === -1) {
        return;
    }

    dashboardWidgets.splice(
        index,
        1
    );

    if (
        selectedWidgetId === id
    ) {
        selectedWidgetId = null;
    }

    renderDashboard();

    showBuilderMessage(
        "Widget deleted.",
        "success"
    );
}


// ==========================================
// Duplicate Widget
// ==========================================

function duplicateWidget(id) {

    const widget =
        dashboardWidgets.find(
            item =>
                item.id === id
        );

    if (!widget) {
        return;
    }

    const duplicate =
        JSON.parse(
            JSON.stringify(widget)
        );

    duplicate.id =
        generateWidgetId();

    duplicate.title +=
        " Copy";

    dashboardWidgets.push(
        duplicate
    );

    renderDashboard();

    showBuilderMessage(
        "Widget duplicated.",
        "success"
    );
}


// ==========================================
// Edit Widget
// ==========================================

function editWidget(id) {

    const widget =
        dashboardWidgets.find(
            item =>
                item.id === id
        );

    if (!widget) {
        return;
    }

    selectedWidgetId = id;

    const title =
        prompt(
            "Enter widget title:",
            widget.title
        );

    if (
        title !== null &&
        title.trim()
    ) {

        widget.title =
            title.trim();
    }

    renderDashboard();

    showBuilderMessage(
        "Widget updated.",
        "success"
    );
}


// ==========================================
// Drag and Drop
// ==========================================

function initializeDragAndDrop() {

    const widgets =
        document.querySelectorAll(
            ".dashboard-widget"
        );

    widgets.forEach(widgetElement => {

        widgetElement.draggable = true;

        widgetElement.addEventListener(
            "dragstart",
            event => {

                event.dataTransfer.setData(
                    "text/plain",
                    widgetElement.dataset.widgetId
                );

                widgetElement.classList.add(
                    "dragging"
                );
            }
        );

        widgetElement.addEventListener(
            "dragend",
            () => {

                widgetElement.classList.remove(
                    "dragging"
                );
            }
        );

        widgetElement.addEventListener(
            "dragover",
            event => {
                event.preventDefault();
            }
        );

        widgetElement.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                const draggedId =
                    event.dataTransfer.getData(
                        "text/plain"
                    );

                const targetId =
                    widgetElement.dataset.widgetId;

                if (
                    draggedId === targetId
                ) {
                    return;
                }

                reorderWidgets(
                    draggedId,
                    targetId
                );
            }
        );
    });
}


// ==========================================
// Reorder Widgets
// ==========================================

function reorderWidgets(
    draggedId,
    targetId
) {

    const draggedIndex =
        dashboardWidgets.findIndex(
            widget =>
                widget.id === draggedId
        );

    const targetIndex =
        dashboardWidgets.findIndex(
            widget =>
                widget.id === targetId
        );

    if (
        draggedIndex === -1 ||
        targetIndex === -1
    ) {
        return;
    }

    const [
        draggedWidget
    ] =
        dashboardWidgets.splice(
            draggedIndex,
            1
        );

    dashboardWidgets.splice(
        targetIndex,
        0,
        draggedWidget
    );

    renderDashboard();
}


// ==========================================
// Save Dashboard
// ==========================================

function saveDashboard() {

    const dashboard = {

        version: "1.0",

        name:
            getDashboardName(),

        widgets:
            dashboardWidgets,

        savedAt:
            new Date().toISOString()
    };

    let saved = false;

    if (
        window.VelocityStorage &&
        typeof VelocityStorage.set === "function"
    ) {

        saved =
            VelocityStorage.set(
                DASHBOARD_STORAGE_KEY,
                dashboard,
                "local"
            );

    } else {

        try {

            localStorage.setItem(
                DASHBOARD_STORAGE_KEY,
                JSON.stringify(dashboard)
            );

            saved = true;

        } catch (error) {

            console.error(
                "Dashboard save error:",
                error
            );
        }
    }

    if (saved) {

        showBuilderMessage(
            "Dashboard saved successfully.",
            "success"
        );
    }
}


// ==========================================
// Load Saved Dashboard
// ==========================================

function loadSavedDashboard() {

    try {

        let dashboard = null;

        if (
            window.VelocityStorage &&
            typeof VelocityStorage.get === "function"
        ) {

            dashboard =
                VelocityStorage.get(
                    DASHBOARD_STORAGE_KEY,
                    "local",
                    null
                );

        } else {

            const stored =
                localStorage.getItem(
                    DASHBOARD_STORAGE_KEY
                );

            if (stored) {
                dashboard =
                    JSON.parse(stored);
            }
        }

        if (
            dashboard &&
            Array.isArray(
                dashboard.widgets
            )
        ) {

            dashboardWidgets =
                dashboard.widgets;

            console.log(
                "Saved dashboard loaded."
            );
        }

    } catch (error) {

        console.error(
            "Unable to load saved dashboard:",
            error
        );
    }
}


// ==========================================
// Dashboard Name
// ==========================================

function getDashboardName() {

    const input =
        document.getElementById(
            "dashboardName"
        );

    if (
        input &&
        input.value.trim()
    ) {

        return input.value.trim();
    }

    return "Velocity BI Dashboard";
}


// ==========================================
// Clear Dashboard
// ==========================================

function clearDashboard() {

    const confirmed =
        window.confirm(
            "Are you sure you want to clear the dashboard?"
        );

    if (!confirmed) {
        return;
    }

    dashboardWidgets = [];

    selectedWidgetId = null;

    Object.values(
        dashboardChartInstances
    ).forEach(chart => {

        try {
            chart.destroy();
        } catch {
            // Ignore cleanup errors
        }
    });

    dashboardChartInstances = {};

    renderDashboard();

    showBuilderMessage(
        "Dashboard cleared.",
        "success"
    );
}


// ==========================================
// Export Dashboard Configuration
// ==========================================

function exportDashboard() {

    const dashboard = {

        version: "1.0",

        name:
            getDashboardName(),

        widgets:
            dashboardWidgets,

        exportedAt:
            new Date().toISOString()
    };

    const json =
        JSON.stringify(
            dashboard,
            null,
            2
        );

    downloadFile(
        json,
        "velocity-bi-dashboard.json",
        "application/json"
    );

    showBuilderMessage(
        "Dashboard exported.",
        "success"
    );
}


// ==========================================
// Import Dashboard
// ==========================================

function importDashboardFile(file) {

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = event => {

        try {

            const dashboard =
                JSON.parse(
                    event.target.result
                );

            if (
                !dashboard ||
                !Array.isArray(
                    dashboard.widgets
                )
            ) {

                throw new Error(
                    "Invalid dashboard file."
                );
            }

            dashboardWidgets =
                dashboard.widgets;

            renderDashboard();

            showBuilderMessage(
                "Dashboard imported successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Dashboard import error:",
                error
            );

            showBuilderMessage(
                "Invalid dashboard file.",
                "error"
            );
        }
    };

    reader.readAsText(file);
}


// ==========================================
// Download File
// ==========================================

function downloadFile(
    content,
    filename,
    type
) {

    const blob =
        new Blob(
            [content],
            { type }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );
}


// ==========================================
// Builder Message
// ==========================================

function showBuilderMessage(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "dashboardBuilderMessage"
        );

    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    container.className =
        `dashboard-builder-message ${type}`;

    container.textContent =
        message;

    setTimeout(() => {

        container.textContent = "";

    }, 3000);
}


// ==========================================
// HTML Escape
// ==========================================

function escapeHTML(value) {

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
// Public API
// ==========================================

window.VelocityDashboardBuilder = {

    addWidget,

    deleteWidget,

    duplicateWidget,

    editWidget,

    selectWidget,

    render:
        renderDashboard,

    save:
        saveDashboard,

    load:
        loadSavedDashboard,

    clear:
        clearDashboard,

    export:
        exportDashboard,

    importFile:
        importDashboardFile,

    getWidgets:
        () => dashboardWidgets,

    getSelectedWidget:
        () =>
            dashboardWidgets.find(
                widget =>
                    widget.id ===
                    selectedWidgetId
            ) || null
};


// ==========================================
// Initialization Log
// ==========================================

console.log(
    "Velocity BI dashboard-builder.js loaded successfully."
);