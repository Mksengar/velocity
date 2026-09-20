// ==========================================
// Velocity BI - Time Series Analysis
// File: frontend/js/time-series.js
// ==========================================

"use strict";

// ==========================================
// Global State
// ==========================================

let timeSeriesData = [];
let timeColumn = null;
let valueColumn = null;
let timeSeriesChart = null;


// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeTimeSeries();
});


function initializeTimeSeries() {

    console.log(
        "Velocity BI - Time Series Analysis initialized"
    );

    loadTimeSeriesDataset();

    const analyzeButton =
        document.getElementById("analyzeTimeSeries");

    if (analyzeButton) {
        analyzeButton.addEventListener(
            "click",
            analyzeTimeSeries
        );
    }

    const generateButton =
        document.getElementById("generateTimeSeries");

    if (generateButton) {
        generateButton.addEventListener(
            "click",
            generateTimeSeriesChart
        );
    }
}


// ==========================================
// Load Dataset
// ==========================================

function loadTimeSeriesDataset() {

    try {

        let dataset = null;

        // Use VelocityStorage if available
        if (
            window.VelocityStorage &&
            typeof VelocityStorage.getDataset === "function"
        ) {

            dataset =
                VelocityStorage.getDataset();

        } else {

            const storedData =
                sessionStorage.getItem(
                    "velocityBI_dataset"
                );

            if (storedData) {
                dataset = JSON.parse(storedData);
            }
        }

        if (!Array.isArray(dataset) || !dataset.length) {

            showMessage(
                "No dataset found. Please upload a dataset first.",
                "warning"
            );

            return;
        }

        timeSeriesData = dataset;

        console.log(
            `Loaded ${timeSeriesData.length} records.`
        );

        detectTimeColumn();
        detectNumericColumns();

    } catch (error) {

        console.error(
            "Dataset loading error:",
            error
        );

        showMessage(
            "Unable to load dataset.",
            "error"
        );
    }
}


// ==========================================
// Detect Date / Time Column
// ==========================================

function detectTimeColumn() {

    if (!timeSeriesData.length) {
        return;
    }

    const columns =
        Object.keys(timeSeriesData[0]);

    const dateKeywords = [
        "date",
        "time",
        "timestamp",
        "datetime",
        "year",
        "month",
        "day"
    ];

    // First try column names
    timeColumn =
        columns.find(column => {

            const lowerColumn =
                column.toLowerCase();

            return dateKeywords.some(keyword =>
                lowerColumn.includes(keyword)
            );
        });

    // If no obvious column is found,
    // test the data values
    if (!timeColumn) {

        timeColumn =
            columns.find(column => {

                const values =
                    timeSeriesData
                        .slice(0, 20)
                        .map(row => row[column]);

                const validDates =
                    values.filter(value =>
                        isValidDate(value)
                    );

                return (
                    validDates.length >=
                    Math.max(
                        2,
                        values.length * 0.7
                    )
                );
            });
    }

    if (timeColumn) {

        console.log(
            "Detected time column:",
            timeColumn
        );

    } else {

        showMessage(
            "No date/time column detected.",
            "warning"
        );
    }

    displayTimeColumnSelector();
}


// ==========================================
// Detect Numeric Columns
// ==========================================

function detectNumericColumns() {

    if (!timeSeriesData.length) {
        return;
    }

    const columns =
        Object.keys(timeSeriesData[0]);

    const numericColumns =
        columns.filter(column => {

            if (column === timeColumn) {
                return false;
            }

            const values =
                timeSeriesData
                    .map(row => row[column])
                    .filter(value =>
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                    );

            if (!values.length) {
                return false;
            }

            const numericValues =
                values.filter(value =>
                    !isNaN(Number(value))
                );

            return (
                numericValues.length /
                values.length >= 0.7
            );
        });

    displayValueColumnSelector(
        numericColumns
    );
}


// ==========================================
// Display Time Column Selector
// ==========================================

function displayTimeColumnSelector() {

    const select =
        document.getElementById(
            "timeColumn"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const columns =
        Object.keys(
            timeSeriesData[0] || {}
        );

    columns.forEach(column => {

        const option =
            document.createElement("option");

        option.value = column;
        option.textContent = column;

        if (column === timeColumn) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    select.addEventListener(
        "change",
        event => {
            timeColumn = event.target.value;
        }
    );
}


// ==========================================
// Display Value Column Selector
// ==========================================

function displayValueColumnSelector(
    numericColumns
) {

    const select =
        document.getElementById(
            "valueColumn"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    numericColumns.forEach(
        (column, index) => {

            const option =
                document.createElement("option");

            option.value = column;
            option.textContent = column;

            if (
                valueColumn === column ||
                (!valueColumn && index === 0)
            ) {
                option.selected = true;
                valueColumn = column;
            }

            select.appendChild(option);
        }
    );

    select.addEventListener(
        "change",
        event => {
            valueColumn =
                event.target.value;
        }
    );
}


// ==========================================
// Analyze Time Series
// ==========================================

function analyzeTimeSeries() {

    if (!timeSeriesData.length) {

        showMessage(
            "No dataset available.",
            "warning"
        );

        return;
    }

    const timeSelect =
        document.getElementById(
            "timeColumn"
        );

    const valueSelect =
        document.getElementById(
            "valueColumn"
        );

    if (timeSelect) {
        timeColumn =
            timeSelect.value;
    }

    if (valueSelect) {
        valueColumn =
            valueSelect.value;
    }

    if (!timeColumn || !valueColumn) {

        showMessage(
            "Please select a date/time column and a value column.",
            "warning"
        );

        return;
    }

    const processedData =
        prepareTimeSeriesData();

    if (processedData.length < 2) {

        showMessage(
            "Not enough valid time-series data.",
            "warning"
        );

        return;
    }

    timeSeriesData =
        processedData;

    calculateStatistics();

    generateTimeSeriesChart();

    showMessage(
        "Time-series analysis completed successfully.",
        "success"
    );
}


// ==========================================
// Prepare Time Series Data
// ==========================================

function prepareTimeSeriesData() {

    const result = [];

    timeSeriesData.forEach(row => {

        const date =
            parseDate(row[timeColumn]);

        const value =
            Number(row[valueColumn]);

        if (
            date &&
            !isNaN(value)
        ) {

            result.push({
                date,
                value,
                originalRow: row
            });
        }
    });

    result.sort(
        (a, b) =>
            a.date.getTime() -
            b.date.getTime()
    );

    return result;
}


// ==========================================
// Generate Chart
// ==========================================

function generateTimeSeriesChart() {

    const processedData =
        prepareTimeSeriesData();

    if (processedData.length < 2) {

        showMessage(
            "At least two valid data points are required.",
            "warning"
        );

        return;
    }

    const canvas =
        document.getElementById(
            "timeSeriesChart"
        );

    if (!canvas) {
        console.warn(
            "Canvas #timeSeriesChart not found."
        );
        return;
    }

    if (
        typeof Chart === "undefined"
    ) {

        showMessage(
            "Chart.js is not loaded.",
            "error"
        );

        return;
    }

    if (timeSeriesChart) {
        timeSeriesChart.destroy();
    }

    const labels =
        processedData.map(
            item => formatDate(item.date)
        );

    const values =
        processedData.map(
            item => item.value
        );

    const context =
        canvas.getContext("2d");

    timeSeriesChart =
        new Chart(context, {

            type: "line",

            data: {

                labels,

                datasets: [
                    {
                        label:
                            valueColumn,

                        data:
                            values,

                        borderWidth: 2,

                        pointRadius: 3,

                        tension: 0.25,

                        fill: false
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {

                    legend: {
                        display: true
                    },

                    tooltip: {
                        enabled: true
                    }
                },

                scales: {

                    x: {
                        title: {
                            display: true,
                            text: timeColumn
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text: valueColumn
                        },

                        beginAtZero: false
                    }
                }
            }
        });
}


// ==========================================
// Calculate Statistics
// ==========================================

function calculateStatistics() {

    const data =
        prepareTimeSeriesData();

    if (!data.length) {
        return;
    }

    const values =
        data.map(item => item.value);

    const sum =
        values.reduce(
            (total, value) =>
                total + value,
            0
        );

    const mean =
        sum / values.length;

    const min =
        Math.min(...values);

    const max =
        Math.max(...values);

    const firstValue =
        values[0];

    const lastValue =
        values[values.length - 1];

    const change =
        lastValue - firstValue;

    const percentageChange =
        firstValue !== 0
            ? (change / firstValue) * 100
            : 0;

    const statistics = {

        count:
            values.length,

        mean,

        min,

        max,

        firstValue,

        lastValue,

        change,

        percentageChange
    };

    displayStatistics(statistics);

    return statistics;
}


// ==========================================
// Display Statistics
// ==========================================

function displayStatistics(
    statistics
) {

    const container =
        document.getElementById(
            "timeSeriesStats"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="stat-card">
            <h4>Data Points</h4>
            <p>
                ${statistics.count}
            </p>
        </div>

        <div class="stat-card">
            <h4>Average</h4>
            <p>
                ${formatNumber(statistics.mean)}
            </p>
        </div>

        <div class="stat-card">
            <h4>Minimum</h4>
            <p>
                ${formatNumber(statistics.min)}
            </p>
        </div>

        <div class="stat-card">
            <h4>Maximum</h4>
            <p>
                ${formatNumber(statistics.max)}
            </p>
        </div>

        <div class="stat-card">
            <h4>Change</h4>
            <p>
                ${formatNumber(statistics.change)}
            </p>
        </div>

        <div class="stat-card">
            <h4>Change %</h4>
            <p>
                ${formatNumber(
                    statistics.percentageChange
                )}%
            </p>
        </div>
    `;
}


// ==========================================
// Moving Average
// ==========================================

function calculateMovingAverage(
    values,
    windowSize = 3
) {

    if (
        !Array.isArray(values) ||
        windowSize <= 0
    ) {
        return [];
    }

    const result = [];

    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        const start =
            Math.max(
                0,
                i - windowSize + 1
            );

        const window =
            values.slice(
                start,
                i + 1
            );

        const average =
            window.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / window.length;

        result.push(average);
    }

    return result;
}


// ==========================================
// Detect Trend
// ==========================================

function detectTrend() {

    const data =
        prepareTimeSeriesData();

    if (data.length < 2) {
        return "Insufficient data";
    }

    const first =
        data[0].value;

    const last =
        data[data.length - 1].value;

    if (last > first) {
        return "Increasing";
    }

    if (last < first) {
        return "Decreasing";
    }

    return "Stable";
}


// ==========================================
// Date Parsing
// ==========================================

function parseDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const date =
        new Date(value);

    if (
        isNaN(date.getTime())
    ) {
        return null;
    }

    return date;
}


// ==========================================
// Validate Date
// ==========================================

function isValidDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return false;
    }

    const date =
        new Date(value);

    return !isNaN(
        date.getTime()
    );
}


// ==========================================
// Format Date
// ==========================================

function formatDate(date) {

    if (!(date instanceof Date)) {
        return String(date);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ==========================================
// Format Number
// ==========================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {
        return "N/A";
    }

    return Number(value)
        .toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
}


// ==========================================
// Export Time Series CSV
// ==========================================

function exportTimeSeriesCSV() {

    const data =
        prepareTimeSeriesData();

    if (!data.length) {

        showMessage(
            "No time-series data available.",
            "warning"
        );

        return;
    }

    let csv =
        `${timeColumn},${valueColumn}\n`;

    data.forEach(item => {

        csv +=
            `"${item.date.toISOString()}","${item.value}"\n`;
    });

    downloadFile(
        csv,
        "velocity-bi-time-series.csv",
        "text/csv"
    );
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
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ==========================================
// Message Helper
// ==========================================

function showMessage(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "timeSeriesMessage"
        );

    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    container.className =
        `time-series-message ${type}`;

    container.textContent =
        message;
}


// ==========================================
// Public API
// ==========================================

window.VelocityTimeSeries = {

    analyze:
        analyzeTimeSeries,

    generateChart:
        generateTimeSeriesChart,

    getData:
        prepareTimeSeriesData,

    calculateStatistics,

    calculateMovingAverage,

    detectTrend,

    exportCSV:
        exportTimeSeriesCSV
};


// ==========================================
// Initialization Log
// ==========================================

console.log(
    "Velocity BI time-series.js loaded successfully."
);