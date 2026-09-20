"use strict";

// ==========================================
// Velocity BI - Forecasting
// File: frontend/js/forecasting.js
// ==========================================

let forecastingData = [];
let forecastResults = [];
let forecastingChart = null;

let forecastTimeColumn = null;
let forecastValueColumn = null;


// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeForecasting();
});


function initializeForecasting() {

    console.log(
        "Velocity BI - Forecasting initialized"
    );

    loadForecastingDataset();

    const forecastButton =
        document.getElementById("generateForecast");

    if (forecastButton) {
        forecastButton.addEventListener(
            "click",
            generateForecast
        );
    }

    const analyzeButton =
        document.getElementById("analyzeForecast");

    if (analyzeButton) {
        analyzeButton.addEventListener(
            "click",
            generateForecast
        );
    }
}


// ==========================================
// Load Dataset
// ==========================================

function loadForecastingDataset() {

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
                dataset =
                    JSON.parse(storedData);
            }
        }

        if (
            !Array.isArray(dataset) ||
            dataset.length < 2
        ) {

            showMessage(
                "Please upload a dataset with at least two records.",
                "warning"
            );

            return;
        }

        forecastingData = dataset;

        console.log(
            `Forecasting dataset loaded: ${dataset.length} rows`
        );

        detectForecastColumns();

    } catch (error) {

        console.error(
            "Forecasting dataset error:",
            error
        );

        showMessage(
            "Unable to load forecasting dataset.",
            "error"
        );
    }
}


// ==========================================
// Detect Columns
// ==========================================

function detectForecastColumns() {

    if (!forecastingData.length) {
        return;
    }

    const columns =
        Object.keys(
            forecastingData[0]
        );

    const dateKeywords = [
        "date",
        "time",
        "timestamp",
        "datetime",
        "year",
        "month",
        "day"
    ];

    // Detect time column
    forecastTimeColumn =
        columns.find(column => {

            const lowerName =
                column.toLowerCase();

            return dateKeywords.some(keyword =>
                lowerName.includes(keyword)
            );
        });

    // Detect value column
    const numericColumns =
        columns.filter(column => {

            if (
                column === forecastTimeColumn
            ) {
                return false;
            }

            const values =
                forecastingData
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

    forecastValueColumn =
        numericColumns[0] || null;

    displayForecastColumnSelectors(
        columns,
        numericColumns
    );
}


// ==========================================
// Display Column Selectors
// ==========================================

function displayForecastColumnSelectors(
    columns,
    numericColumns
) {

    const timeSelect =
        document.getElementById(
            "forecastTimeColumn"
        );

    const valueSelect =
        document.getElementById(
            "forecastValueColumn"
        );

    if (timeSelect) {

        timeSelect.innerHTML = "";

        columns.forEach(column => {

            const option =
                document.createElement("option");

            option.value = column;
            option.textContent = column;

            if (
                column === forecastTimeColumn
            ) {
                option.selected = true;
            }

            timeSelect.appendChild(option);
        });

        timeSelect.addEventListener(
            "change",
            event => {
                forecastTimeColumn =
                    event.target.value;
            }
        );
    }

    if (valueSelect) {

        valueSelect.innerHTML = "";

        numericColumns.forEach(
            (column, index) => {

                const option =
                    document.createElement("option");

                option.value = column;
                option.textContent = column;

                if (
                    column === forecastValueColumn ||
                    (
                        !forecastValueColumn &&
                        index === 0
                    )
                ) {
                    option.selected = true;
                    forecastValueColumn =
                        column;
                }

                valueSelect.appendChild(option);
            }
        );

        valueSelect.addEventListener(
            "change",
            event => {
                forecastValueColumn =
                    event.target.value;
            }
        );
    }
}


// ==========================================
// Generate Forecast
// ==========================================

function generateForecast() {

    if (!forecastingData.length) {

        showMessage(
            "No dataset available.",
            "warning"
        );

        return;
    }

    const timeSelect =
        document.getElementById(
            "forecastTimeColumn"
        );

    const valueSelect =
        document.getElementById(
            "forecastValueColumn"
        );

    if (timeSelect) {
        forecastTimeColumn =
            timeSelect.value;
    }

    if (valueSelect) {
        forecastValueColumn =
            valueSelect.value;
    }

    if (
        !forecastTimeColumn ||
        !forecastValueColumn
    ) {

        showMessage(
            "Please select both time and value columns.",
            "warning"
        );

        return;
    }

    const horizonInput =
        document.getElementById(
            "forecastHorizon"
        );

    const horizon =
        horizonInput
            ? parseInt(
                horizonInput.value,
                10
            )
            : 7;

    if (
        isNaN(horizon) ||
        horizon <= 0
    ) {

        showMessage(
            "Forecast period must be greater than zero.",
            "warning"
        );

        return;
    }

    const preparedData =
        prepareForecastData();

    if (preparedData.length < 2) {

        showMessage(
            "At least two valid time-series records are required.",
            "warning"
        );

        return;
    }

    const regression =
        calculateLinearRegression(
            preparedData
        );

    forecastResults =
        createForecast(
            preparedData,
            regression,
            horizon
        );

    displayForecastStatistics(
        preparedData,
        regression,
        forecastResults
    );

    renderForecastChart(
        preparedData,
        forecastResults
    );

    displayForecastTable(
        forecastResults
    );

    saveForecastResults();

    showMessage(
        "Forecast generated successfully.",
        "success"
    );
}


// ==========================================
// Prepare Forecast Data
// ==========================================

function prepareForecastData() {

    const result = [];

    forecastingData.forEach(row => {

        const date =
            parseDate(
                row[forecastTimeColumn]
            );

        const value =
            Number(
                row[forecastValueColumn]
            );

        if (
            date &&
            !isNaN(value)
        ) {

            result.push({
                date,
                value
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
// Linear Regression
// ==========================================

function calculateLinearRegression(data) {

    const n = data.length;

    const x =
        data.map(
            (_, index) => index
        );

    const y =
        data.map(
            item => item.value
        );

    const sumX =
        x.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    const sumY =
        y.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    const sumXY =
        x.reduce(
            (sum, value, index) =>
                sum + value * y[index],
            0
        );

    const sumX2 =
        x.reduce(
            (sum, value) =>
                sum + value * value,
            0
        );

    const denominator =
        n * sumX2 -
        sumX * sumX;

    if (denominator === 0) {

        return {
            slope: 0,
            intercept: y[0] || 0,
            rSquared: 0
        };
    }

    const slope =
        (
            n * sumXY -
            sumX * sumY
        ) / denominator;

    const intercept =
        (
            sumY -
            slope * sumX
        ) / n;

    // R-squared
    const meanY =
        sumY / n;

    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {

        const predicted =
            intercept +
            slope * x[i];

        ssTotal +=
            Math.pow(
                y[i] - meanY,
                2
            );

        ssResidual +=
            Math.pow(
                y[i] - predicted,
                2
            );
    }

    const rSquared =
        ssTotal === 0
            ? 1
            : 1 -
              ssResidual / ssTotal;

    return {
        slope,
        intercept,
        rSquared
    };
}


// ==========================================
// Create Forecast
// ==========================================

function createForecast(
    historicalData,
    regression,
    horizon
) {

    const results = [];

    const lastDate =
        historicalData[
            historicalData.length - 1
        ].date;

    const lastIndex =
        historicalData.length - 1;

    const interval =
        calculateAverageInterval(
            historicalData
        );

    for (
        let i = 1;
        i <= horizon;
        i++
    ) {

        const forecastIndex =
            lastIndex + i;

        const predictedValue =
            regression.intercept +
            regression.slope *
            forecastIndex;

        const forecastDate =
            new Date(lastDate);

        forecastDate.setTime(
            forecastDate.getTime() +
            interval * i
        );

        results.push({

            date:
                forecastDate,

            value:
                predictedValue,

            type:
                "forecast"
        });
    }

    return results;
}


// ==========================================
// Calculate Average Time Interval
// ==========================================

function calculateAverageInterval(data) {

    if (data.length < 2) {

        return (
            24 *
            60 *
            60 *
            1000
        );
    }

    let total = 0;

    for (
        let i = 1;
        i < data.length;
        i++
    ) {

        total +=
            data[i].date.getTime() -
            data[i - 1].date.getTime();
    }

    return total /
        (data.length - 1);
}


// ==========================================
// Render Forecast Chart
// ==========================================

function renderForecastChart(
    historicalData,
    forecast
) {

    const canvas =
        document.getElementById(
            "forecastChart"
        );

    if (!canvas) {
        console.warn(
            "Canvas #forecastChart not found."
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

    if (forecastingChart) {
        forecastingChart.destroy();
    }

    const historicalLabels =
        historicalData.map(
            item =>
                formatDate(item.date)
        );

    const forecastLabels =
        forecast.map(
            item =>
                formatDate(item.date)
        );

    const labels = [
        ...historicalLabels,
        ...forecastLabels
    ];

    const historicalValues = [
        ...historicalData.map(
            item => item.value
        ),
        ...forecast.map(
            () => null
        )
    ];

    const forecastValues = [
        ...historicalData.map(
            () => null
        ),
        ...forecast.map(
            item => item.value
        )
    ];

    const context =
        canvas.getContext("2d");

    forecastingChart =
        new Chart(context, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            `Historical - ${forecastValueColumn}`,

                        data:
                            historicalValues,

                        borderWidth: 2,

                        pointRadius: 3,

                        tension: 0.25,

                        fill: false
                    },

                    {
                        label:
                            `Forecast - ${forecastValueColumn}`,

                        data:
                            forecastValues,

                        borderWidth: 2,

                        borderDash: [
                            6,
                            4
                        ],

                        pointRadius: 4,

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
                            text:
                                forecastTimeColumn
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text:
                                forecastValueColumn
                        }
                    }
                }
            }
        });
}


// ==========================================
// Forecast Statistics
// ==========================================

function displayForecastStatistics(
    historicalData,
    regression,
    forecast
) {

    const container =
        document.getElementById(
            "forecastStats"
        );

    if (!container) {
        return;
    }

    const forecastValues =
        forecast.map(
            item => item.value
        );

    const averageForecast =
        forecastValues.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        forecastValues.length;

    const firstForecast =
        forecastValues[0];

    const lastForecast =
        forecastValues[
            forecastValues.length - 1
        ];

    const forecastChange =
        lastForecast -
        firstForecast;

    container.innerHTML = `

        <div class="stat-card">
            <h4>Historical Records</h4>
            <p>
                ${historicalData.length}
            </p>
        </div>

        <div class="stat-card">
            <h4>Forecast Period</h4>
            <p>
                ${forecast.length}
            </p>
        </div>

        <div class="stat-card">
            <h4>Average Forecast</h4>
            <p>
                ${formatNumber(
                    averageForecast
                )}
            </p>
        </div>

        <div class="stat-card">
            <h4>First Forecast</h4>
            <p>
                ${formatNumber(
                    firstForecast
                )}
            </p>
        </div>

        <div class="stat-card">
            <h4>Last Forecast</h4>
            <p>
                ${formatNumber(
                    lastForecast
                )}
            </p>
        </div>

        <div class="stat-card">
            <h4>Model R²</h4>
            <p>
                ${formatNumber(
                    regression.rSquared
                )}
            </p>
        </div>

        <div class="stat-card">
            <h4>Forecast Trend</h4>
            <p>
                ${detectForecastTrend(
                    forecast
                )}
            </p>
        </div>

        <div class="stat-card">
            <h4>Forecast Change</h4>
            <p>
                ${formatNumber(
                    forecastChange
                )}
            </p>
        </div>
    `;
}


// ==========================================
// Forecast Table
// ==========================================

function displayForecastTable(
    forecast
) {

    const tableBody =
        document.getElementById(
            "forecastResults"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    forecast.forEach(
        (item, index) => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${index + 1}
                </td>

                <td>
                    ${formatDate(item.date)}
                </td>

                <td>
                    ${formatNumber(item.value)}
                </td>

                <td>
                    Forecast
                </td>
            `;

            tableBody.appendChild(row);
        }
    );
}


// ==========================================
// Forecast Trend
// ==========================================

function detectForecastTrend(
    forecast
) {

    if (forecast.length < 2) {
        return "Insufficient data";
    }

    const first =
        forecast[0].value;

    const last =
        forecast[
            forecast.length - 1
        ].value;

    if (last > first) {
        return "Increasing";
    }

    if (last < first) {
        return "Decreasing";
    }

    return "Stable";
}


// ==========================================
// Save Forecast Results
// ==========================================

function saveForecastResults() {

    const results = {

        timeColumn:
            forecastTimeColumn,

        valueColumn:
            forecastValueColumn,

        forecast:
            forecastResults,

        generatedAt:
            new Date().toISOString()
    };

    if (
        window.VelocityStorage &&
        typeof VelocityStorage.set === "function"
    ) {

        VelocityStorage.set(
            "velocityBI_forecast_results",
            results,
            "session"
        );

    } else {

        try {

            sessionStorage.setItem(
                "velocityBI_forecast_results",
                JSON.stringify(results)
            );

        } catch (error) {

            console.warn(
                "Unable to save forecast results:",
                error
            );
        }
    }
}


// ==========================================
// Load Saved Forecast
// ==========================================

function loadSavedForecast() {

    try {

        let saved = null;

        if (
            window.VelocityStorage &&
            typeof VelocityStorage.get === "function"
        ) {

            saved =
                VelocityStorage.get(
                    "velocityBI_forecast_results",
                    "session",
                    null
                );

        } else {

            const stored =
                sessionStorage.getItem(
                    "velocityBI_forecast_results"
                );

            if (stored) {
                saved =
                    JSON.parse(stored);
            }
        }

        if (
            saved &&
            Array.isArray(saved.forecast)
        ) {

            forecastResults =
                saved.forecast.map(item => ({
                    ...item,
                    date:
                        new Date(item.date)
                }));

            forecastTimeColumn =
                saved.timeColumn;

            forecastValueColumn =
                saved.valueColumn;

            return saved;
        }

    } catch (error) {

        console.error(
            "Unable to load saved forecast:",
            error
        );
    }

    return null;
}


// ==========================================
// Export Forecast CSV
// ==========================================

function exportForecastCSV() {

    if (!forecastResults.length) {

        showMessage(
            "Generate a forecast before exporting.",
            "warning"
        );

        return;
    }

    let csv =
        `Forecast Number,${forecastTimeColumn},${forecastValueColumn},Type\n`;

    forecastResults.forEach(
        (item, index) => {

            csv +=
                `"${index + 1}",` +
                `"${item.date.toISOString()}",` +
                `"${item.value}",` +
                `"Forecast"\n`;
        }
    );

    downloadFile(
        csv,
        "velocity-bi-forecast.csv",
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
// Date Parser
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
        isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


// ==========================================
// Date Formatter
// ==========================================

function formatDate(date) {

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
// Number Formatter
// ==========================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {
        return "N/A";
    }

    return Number(value).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );
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
            "forecastMessage"
        );

    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    container.className =
        `forecast-message ${type}`;

    container.textContent =
        message;
}


// ==========================================
// Public API
// ==========================================

window.VelocityForecasting = {

    generate:
        generateForecast,

    getResults:
        () => forecastResults,

    getData:
        prepareForecastData,

    regression:
        calculateLinearRegression,

    loadSaved:
        loadSavedForecast,

    exportCSV:
        exportForecastCSV
};


// ==========================================
// Initialization Log
// ==========================================

console.log(
    "Velocity BI forecasting.js loaded successfully."
);