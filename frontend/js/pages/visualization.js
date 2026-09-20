// ==========================================
// Velocity BI - Data Visualization
// File: frontend/js/visualization.js
// ==========================================

"use strict";

// ==========================================
// Global Variables
// ==========================================

let visualizationData = [];
let chartInstances = {};

let numericColumns = [];
let categoricalColumns = [];
let dateColumns = [];


// ==========================================
// DOM Helper
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


// ==========================================
// Initialize Visualization
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeVisualization();
});


// ==========================================
// Initialize
// ==========================================

function initializeVisualization() {

    loadVisualizationData();

    if (!visualizationData.length) {

        showVisualizationMessage(
            "No dataset found. Please upload a dataset first.",
            "warning"
        );

        return;
    }

    detectColumnTypes();

    populateColumnSelectors();

    updateDatasetInfo();

    createDefaultVisualization();

    setupEventListeners();
}


// ==========================================
// Load Dataset
// ==========================================

function loadVisualizationData() {

    try {

        const cleanedData =
            localStorage.getItem(
                "velocityBI_cleaned_dataset"
            );

        const normalData =
            localStorage.getItem(
                "velocityBI_dataset"
            );

        const storedData =
            cleanedData || normalData;

        if (!storedData) {
            return;
        }

        const parsedData =
            JSON.parse(storedData);

        if (Array.isArray(parsedData)) {

            visualizationData =
                parsedData;

        } else if (
            parsedData.data &&
            Array.isArray(parsedData.data)
        ) {

            visualizationData =
                parsedData.data;
        }

    } catch (error) {

        console.error(
            "Visualization data loading error:",
            error
        );

        showVisualizationMessage(
            "Unable to load dataset.",
            "error"
        );
    }
}


// ==========================================
// Detect Column Types
// ==========================================

function detectColumnTypes() {

    numericColumns = [];
    categoricalColumns = [];
    dateColumns = [];

    if (!visualizationData.length) {
        return;
    }

    const columns =
        Object.keys(
            visualizationData[0]
        );

    columns.forEach(column => {

        const values =
            visualizationData
                .map(row => row[column])
                .filter(value =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                );

        if (!values.length) {

            categoricalColumns.push(column);

            return;
        }

        const numericCount =
            values.filter(value =>
                !isNaN(Number(value))
            ).length;

        if (numericCount === values.length) {

            numericColumns.push(column);

            return;
        }

        const dateCount =
            values.filter(value => {

                const date =
                    new Date(value);

                return !isNaN(
                    date.getTime()
                );

            }).length;

        if (dateCount === values.length) {

            dateColumns.push(column);

            return;
        }

        categoricalColumns.push(column);
    });
}


// ==========================================
// Populate Selectors
// ==========================================

function populateColumnSelectors() {

    const xAxisSelect =
        getElement("xAxisColumn");

    const yAxisSelect =
        getElement("yAxisColumn");

    const chartTypeSelect =
        getElement("chartType");

    if (xAxisSelect) {

        xAxisSelect.innerHTML =
            '<option value="">Select X-Axis</option>';

        Object.keys(
            visualizationData[0]
        ).forEach(column => {

            xAxisSelect.innerHTML += `
                <option value="${escapeHTML(column)}">
                    ${escapeHTML(column)}
                </option>
            `;
        });
    }

    if (yAxisSelect) {

        yAxisSelect.innerHTML =
            '<option value="">Select Y-Axis</option>';

        numericColumns.forEach(column => {

            yAxisSelect.innerHTML += `
                <option value="${escapeHTML(column)}">
                    ${escapeHTML(column)}
                </option>
            `;
        });
    }

    if (chartTypeSelect) {

        chartTypeSelect.innerHTML = `
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="doughnut">Doughnut Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="radar">Radar Chart</option>
        `;
    }
}


// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {

    const generateBtn =
        getElement("generateChartBtn");

    const chartType =
        getElement("chartType");

    const xAxis =
        getElement("xAxisColumn");

    const yAxis =
        getElement("yAxisColumn");

    const refreshBtn =
        getElement("refreshVisualizationBtn");

    const downloadBtn =
        getElement("downloadChartBtn");

    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            generateChart
        );
    }

    if (chartType) {

        chartType.addEventListener(
            "change",
            handleChartTypeChange
        );
    }

    if (xAxis) {

        xAxis.addEventListener(
            "change",
            updateAvailableYColumns
        );
    }

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            refreshVisualization
        );
    }

    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            downloadCurrentChart
        );
    }
}


// ==========================================
// Handle Chart Type
// ==========================================

function handleChartTypeChange() {

    const type =
        getElement("chartType")?.value;

    const yAxis =
        getElement("yAxisColumn");

    if (!yAxis) {
        return;
    }

    if (type === "pie" ||
        type === "doughnut") {

        yAxis.innerHTML =
            '<option value="">Select Value</option>';

        numericColumns.forEach(column => {

            yAxis.innerHTML += `
                <option value="${escapeHTML(column)}">
                    ${escapeHTML(column)}
                </option>
            `;
        });

    } else {

        updateAvailableYColumns();
    }
}


// ==========================================
// Update Y-Axis Options
// ==========================================

function updateAvailableYColumns() {

    const yAxis =
        getElement("yAxisColumn");

    if (!yAxis) {
        return;
    }

    yAxis.innerHTML =
        '<option value="">Select Y-Axis</option>';

    numericColumns.forEach(column => {

        yAxis.innerHTML += `
            <option value="${escapeHTML(column)}">
                ${escapeHTML(column)}
            </option>
        `;
    });
}


// ==========================================
// Generate Chart
// ==========================================

function generateChart() {

    const chartType =
        getElement("chartType")?.value;

    const xColumn =
        getElement("xAxisColumn")?.value;

    const yColumn =
        getElement("yAxisColumn")?.value;

    if (!chartType) {

        showVisualizationMessage(
            "Please select a chart type.",
            "warning"
        );

        return;
    }

    if (!xColumn) {

        showVisualizationMessage(
            "Please select an X-axis column.",
            "warning"
        );

        return;
    }

    if (!yColumn) {

        showVisualizationMessage(
            "Please select a Y-axis column.",
            "warning"
        );

        return;
    }

    createChart(
        chartType,
        xColumn,
        yColumn
    );
}


// ==========================================
// Create Chart
// ==========================================

function createChart(
    chartType,
    xColumn,
    yColumn
) {

    const canvas =
        getElement("visualizationChart");

    if (!canvas) {

        showVisualizationMessage(
            "Chart canvas not found.",
            "error"
        );

        return;
    }

    destroyChart();

    const chartData =
        prepareChartData(
            chartType,
            xColumn,
            yColumn
        );

    const config = {

        type: chartType === "scatter"
            ? "scatter"
            : chartType,

        data: chartData,

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: true
                },

                title: {
                    display: true,

                    text:
                        `${yColumn} by ${xColumn}`
                },

                tooltip: {
                    enabled: true
                }
            },

            scales:
                chartType === "pie" ||
                chartType === "doughnut"
                    ? {}
                    : {

                        x: {
                            title: {
                                display: true,
                                text: xColumn
                            }
                        },

                        y: {
                            title: {
                                display: true,
                                text: yColumn
                            },

                            beginAtZero: true
                        }
                    }
        }
    };

    chartInstances.main =
        new Chart(
            canvas.getContext("2d"),
            config
        );

    updateChartTitle(
        `${chartType.toUpperCase()} - ${yColumn} vs ${xColumn}`
    );

    showVisualizationMessage(
        "Chart generated successfully.",
        "success"
    );
}


// ==========================================
// Prepare Chart Data
// ==========================================

function prepareChartData(
    chartType,
    xColumn,
    yColumn
) {

    if (
        chartType === "pie" ||
        chartType === "doughnut"
    ) {

        const grouped =
            groupDataByCategory(
                xColumn,
                yColumn
            );

        return {

            labels:
                Object.keys(grouped),

            datasets: [
                {
                    label: yColumn,

                    data:
                        Object.values(grouped),

                    borderWidth: 1
                }
            ]
        };
    }


    if (chartType === "scatter") {

        const points =
            visualizationData
                .map(row => {

                    const x =
                        Number(
                            row[xColumn]
                        );

                    const y =
                        Number(
                            row[yColumn]
                        );

                    return {
                        x,
                        y
                    };
                })
                .filter(point =>
                    !isNaN(point.x) &&
                    !isNaN(point.y)
                );

        return {

            datasets: [
                {
                    label:
                        `${yColumn} vs ${xColumn}`,

                    data: points,

                    pointRadius: 5
                }
            ]
        };
    }


    const grouped =
        groupDataByCategory(
            xColumn,
            yColumn
        );

    return {

        labels:
            Object.keys(grouped),

        datasets: [
            {
                label: yColumn,

                data:
                    Object.values(grouped),

                borderWidth: 2,

                tension: 0.3,

                fill:
                    chartType === "line"
                        ? false
                        : true
            }
        ]
    };
}


// ==========================================
// Group Data
// ==========================================

function groupDataByCategory(
    categoryColumn,
    valueColumn
) {

    const grouped = {};

    visualizationData.forEach(row => {

        const category =
            row[categoryColumn];

        const value =
            Number(
                row[valueColumn]
            );

        if (
            category === null ||
            category === undefined ||
            category === ""
        ) {
            return;
        }

        if (isNaN(value)) {
            return;
        }

        if (
            !Object.prototype.hasOwnProperty
                .call(grouped, category)
        ) {

            grouped[category] = 0;
        }

        grouped[category] += value;
    });

    return grouped;
}


// ==========================================
// Default Visualization
// ==========================================

function createDefaultVisualization() {

    if (
        !numericColumns.length ||
        !categoricalColumns.length
    ) {
        return;
    }

    const xColumn =
        categoricalColumns[0];

    const yColumn =
        numericColumns[0];

    const chartType =
        getElement("chartType");

    const xAxis =
        getElement("xAxisColumn");

    const yAxis =
        getElement("yAxisColumn");

    if (chartType) {
        chartType.value = "bar";
    }

    if (xAxis) {
        xAxis.value = xColumn;
    }

    if (yAxis) {
        yAxis.value = yColumn;
    }

    createChart(
        "bar",
        xColumn,
        yColumn
    );
}


// ==========================================
// Dataset Information
// ==========================================

function updateDatasetInfo() {

    const rowCount =
        getElement("visualizationRowCount");

    const columnCount =
        getElement("visualizationColumnCount");

    const numericCount =
        getElement("visualizationNumericCount");

    const categoricalCount =
        getElement(
            "visualizationCategoricalCount"
        );

    if (rowCount) {

        rowCount.textContent =
            visualizationData.length;
    }

    if (columnCount) {

        columnCount.textContent =
            Object.keys(
                visualizationData[0] || {}
            ).length;
    }

    if (numericCount) {

        numericCount.textContent =
            numericColumns.length;
    }

    if (categoricalCount) {

        categoricalCount.textContent =
            categoricalColumns.length;
    }
}


// ==========================================
// Destroy Existing Chart
// ==========================================

function destroyChart() {

    if (chartInstances.main) {

        chartInstances.main.destroy();

        chartInstances.main =
            null;
    }
}


// ==========================================
// Refresh Visualization
// ==========================================

function refreshVisualization() {

    destroyChart();

    visualizationData = [];

    numericColumns = [];
    categoricalColumns = [];
    dateColumns = [];

    loadVisualizationData();

    if (!visualizationData.length) {

        showVisualizationMessage(
            "No dataset found.",
            "warning"
        );

        return;
    }

    detectColumnTypes();

    populateColumnSelectors();

    updateDatasetInfo();

    createDefaultVisualization();

    showVisualizationMessage(
        "Visualization refreshed.",
        "success"
    );
}


// ==========================================
// Download Chart
// ==========================================

function downloadCurrentChart() {

    const canvas =
        getElement("visualizationChart");

    if (!canvas) {

        showVisualizationMessage(
            "No chart available to download.",
            "warning"
        );

        return;
    }

    const link =
        document.createElement("a");

    link.download =
        "velocity-bi-chart.png";

    link.href =
        canvas.toDataURL("image/png");

    link.click();

    showVisualizationMessage(
        "Chart downloaded successfully.",
        "success"
    );
}


// ==========================================
// Update Chart Title
// ==========================================

function updateChartTitle(title) {

    const titleElement =
        getElement("chartTitle");

    if (titleElement) {

        titleElement.textContent =
            title;
    }
}


// ==========================================
// Status Message
// ==========================================

function showVisualizationMessage(
    message,
    type = "info"
) {

    const element =
        getElement(
            "visualizationMessage"
        );

    if (!element) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    element.textContent =
        message;

    element.className =
        `visualization-message ${type}`;

    setTimeout(() => {

        element.textContent = "";

        element.className =
            "visualization-message";

    }, 4000);
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
// Get Visualization Data
// ==========================================

function getVisualizationData() {

    return visualizationData;
}


// ==========================================
// Public API
// ==========================================

window.VelocityVisualization = {

    initializeVisualization,

    refreshVisualization,

    generateChart,

    createChart,

    getVisualizationData,

    destroyChart,

    downloadCurrentChart,

    detectColumnTypes
};