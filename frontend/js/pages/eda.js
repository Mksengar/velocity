// ==========================================
// Velocity BI - Exploratory Data Analysis
// File: frontend/js/eda.js
// ==========================================

"use strict";

// ==========================================
// Global State
// ==========================================

let edaData = [];
let numericColumns = [];
let categoricalColumns = [];


// ==========================================
// DOM Helper
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


// ==========================================
// Initialize EDA
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeEDA();
});


// ==========================================
// Initialize
// ==========================================

function initializeEDA() {

    loadEDAData();

    if (!edaData.length) {
        showEDAStatus(
            "No dataset found. Please upload and clean a dataset first.",
            "warning"
        );
        return;
    }

    detectColumnTypes();
    calculateEDA();
    renderDatasetOverview();
    renderColumnSummary();
    renderNumericStatistics();
    renderMissingValues();
    renderUniqueValues();
    renderDataQuality();

}


// ==========================================
// Load Dataset
// ==========================================

function loadEDAData() {

    try {

        // First try cleaned dataset
        const cleanedDataset =
            localStorage.getItem(
                "velocityBI_cleaned_dataset"
            );

        // If cleaned dataset doesn't exist,
        // use normal dataset
        const normalDataset =
            localStorage.getItem(
                "velocityBI_dataset"
            );

        const storedData =
            cleanedDataset || normalDataset;

        if (!storedData) {
            return;
        }

        const parsedData =
            JSON.parse(storedData);

        if (Array.isArray(parsedData)) {

            edaData = parsedData;

        } else if (
            parsedData.data &&
            Array.isArray(parsedData.data)
        ) {

            edaData =
                parsedData.data;
        }

    } catch (error) {

        console.error(
            "EDA data loading error:",
            error
        );

        showEDAStatus(
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

    if (!edaData.length) {
        return;
    }

    const columns =
        Object.keys(edaData[0]);

    columns.forEach(column => {

        const values =
            edaData
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

        if (
            numericCount === values.length
        ) {

            numericColumns.push(column);

        } else {

            categoricalColumns.push(column);
        }

    });
}


// ==========================================
// Calculate EDA
// ==========================================

function calculateEDA() {

    console.log("EDA Analysis Started");

    console.log("Rows:", edaData.length);

    console.log(
        "Columns:",
        edaData.length
            ? Object.keys(edaData[0]).length
            : 0
    );

    console.log(
        "Numeric Columns:",
        numericColumns
    );

    console.log(
        "Categorical Columns:",
        categoricalColumns
    );
}


// ==========================================
// Dataset Overview
// ==========================================

function renderDatasetOverview() {

    const rowCount =
        getElement("edaRowCount");

    const columnCount =
        getElement("edaColumnCount");

    const numericCount =
        getElement("edaNumericCount");

    const categoricalCount =
        getElement("edaCategoricalCount");

    const missingCount =
        getElement("edaMissingCount");

    const rows =
        edaData.length;

    const columns =
        rows
            ? Object.keys(edaData[0]).length
            : 0;

    const missing =
        calculateMissingValues();

    if (rowCount) {
        rowCount.textContent = rows;
    }

    if (columnCount) {
        columnCount.textContent = columns;
    }

    if (numericCount) {
        numericCount.textContent =
            numericColumns.length;
    }

    if (categoricalCount) {
        categoricalCount.textContent =
            categoricalColumns.length;
    }

    if (missingCount) {
        missingCount.textContent =
            missing;
    }
}


// ==========================================
// Column Summary
// ==========================================

function renderColumnSummary() {

    const container =
        getElement("columnSummary");

    if (!container || !edaData.length) {
        return;
    }

    const columns =
        Object.keys(edaData[0]);

    let html = `
        <table class="eda-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Non-Null</th>
                    <th>Missing</th>
                    <th>Unique</th>
                </tr>
            </thead>
            <tbody>
    `;

    columns.forEach(column => {

        const values =
            edaData.map(row => row[column]);

        const missing =
            values.filter(value =>
                isMissing(value)
            ).length;

        const nonNull =
            values.length - missing;

        const unique =
            new Set(
                values
                    .filter(value =>
                        !isMissing(value)
                    )
                    .map(value =>
                        String(value)
                    )
            ).size;

        const type =
            numericColumns.includes(column)
                ? "Numeric"
                : "Categorical";

        html += `
            <tr>
                <td>${escapeHTML(column)}</td>
                <td>${type}</td>
                <td>${nonNull}</td>
                <td>${missing}</td>
                <td>${unique}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}


// ==========================================
// Numeric Statistics
// ==========================================

function renderNumericStatistics() {

    const container =
        getElement("numericStatistics");

    if (!container) {
        return;
    }

    if (!numericColumns.length) {

        container.innerHTML =
            "<p>No numeric columns found.</p>";

        return;
    }

    let html = `
        <table class="eda-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Count</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Std Dev</th>
                </tr>
            </thead>
            <tbody>
    `;

    numericColumns.forEach(column => {

        const values =
            getNumericValues(column);

        const count =
            values.length;

        const mean =
            calculateMean(values);

        const median =
            calculateMedian(values);

        const min =
            values.length
                ? Math.min(...values)
                : 0;

        const max =
            values.length
                ? Math.max(...values)
                : 0;

        const stdDev =
            calculateStandardDeviation(values);

        html += `
            <tr>
                <td>${escapeHTML(column)}</td>
                <td>${count}</td>
                <td>${formatNumber(mean)}</td>
                <td>${formatNumber(median)}</td>
                <td>${formatNumber(min)}</td>
                <td>${formatNumber(max)}</td>
                <td>${formatNumber(stdDev)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}


// ==========================================
// Missing Values
// ==========================================

function renderMissingValues() {

    const container =
        getElement("missingValuesTable");

    if (!container || !edaData.length) {
        return;
    }

    const columns =
        Object.keys(edaData[0]);

    let html = `
        <table class="eda-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Missing</th>
                    <th>Missing %</th>
                </tr>
            </thead>
            <tbody>
    `;

    columns.forEach(column => {

        const missing =
            edaData.filter(row =>
                isMissing(row[column])
            ).length;

        const percentage =
            edaData.length
                ? (missing / edaData.length) * 100
                : 0;

        html += `
            <tr>
                <td>${escapeHTML(column)}</td>
                <td>${missing}</td>
                <td>${percentage.toFixed(2)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}


// ==========================================
// Unique Values
// ==========================================

function renderUniqueValues() {

    const container =
        getElement("uniqueValuesTable");

    if (!container || !edaData.length) {
        return;
    }

    const columns =
        Object.keys(edaData[0]);

    let html = `
        <table class="eda-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Unique Values</th>
                    <th>Cardinality %</th>
                </tr>
            </thead>
            <tbody>
    `;

    columns.forEach(column => {

        const values =
            edaData
                .map(row => row[column])
                .filter(value =>
                    !isMissing(value)
                );

        const unique =
            new Set(
                values.map(value =>
                    String(value)
                )
            ).size;

        const cardinality =
            edaData.length
                ? (unique / edaData.length) * 100
                : 0;

        html += `
            <tr>
                <td>${escapeHTML(column)}</td>
                <td>${unique}</td>
                <td>${cardinality.toFixed(2)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}


// ==========================================
// Data Quality
// ==========================================

function renderDataQuality() {

    const container =
        getElement("dataQuality");

    if (!container || !edaData.length) {
        return;
    }

    const totalCells =
        edaData.length *
        Object.keys(edaData[0]).length;

    const missingCells =
        calculateMissingValues();

    const duplicateRows =
        calculateDuplicateRows();

    const completeCells =
        totalCells - missingCells;

    const completeness =
        totalCells
            ? (completeCells / totalCells) * 100
            : 0;

    container.innerHTML = `
        <div class="quality-card">
            <h3>Data Completeness</h3>
            <strong>
                ${completeness.toFixed(2)}%
            </strong>
        </div>

        <div class="quality-card">
            <h3>Missing Cells</h3>
            <strong>
                ${missingCells}
            </strong>
        </div>

        <div class="quality-card">
            <h3>Duplicate Rows</h3>
            <strong>
                ${duplicateRows}
            </strong>
        </div>

        <div class="quality-card">
            <h3>Total Cells</h3>
            <strong>
                ${totalCells}
            </strong>
        </div>
    `;
}


// ==========================================
// Numeric Values
// ==========================================

function getNumericValues(column) {

    return edaData
        .map(row => Number(row[column]))
        .filter(value =>
            !isNaN(value) &&
            isFinite(value)
        );
}


// ==========================================
// Mean
// ==========================================

function calculateMean(values) {

    if (!values.length) {
        return 0;
    }

    const sum =
        values.reduce(
            (total, value) =>
                total + value,
            0
        );

    return sum / values.length;
}


// ==========================================
// Median
// ==========================================

function calculateMedian(values) {

    if (!values.length) {
        return 0;
    }

    const sorted =
        [...values].sort(
            (a, b) => a - b
        );

    const middle =
        Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {

        return (
            sorted[middle - 1] +
            sorted[middle]
        ) / 2;
    }

    return sorted[middle];
}


// ==========================================
// Standard Deviation
// ==========================================

function calculateStandardDeviation(values) {

    if (values.length < 2) {
        return 0;
    }

    const mean =
        calculateMean(values);

    const squaredDifferences =
        values.map(value =>
            Math.pow(
                value - mean,
                2
            )
        );

    const variance =
        squaredDifferences.reduce(
            (total, value) =>
                total + value,
            0
        ) / values.length;

    return Math.sqrt(variance);
}


// ==========================================
// Missing Value Counter
// ==========================================

function calculateMissingValues() {

    let count = 0;

    edaData.forEach(row => {

        Object.values(row).forEach(value => {

            if (isMissing(value)) {
                count++;
            }
        });
    });

    return count;
}


// ==========================================
// Duplicate Row Counter
// ==========================================

function calculateDuplicateRows() {

    const seen = new Set();
    let duplicates = 0;

    edaData.forEach(row => {

        const key =
            JSON.stringify(row);

        if (seen.has(key)) {
            duplicates++;
        } else {
            seen.add(key);
        }
    });

    return duplicates;
}


// ==========================================
// Check Missing Value
// ==========================================

function isMissing(value) {

    return (
        value === null ||
        value === undefined ||
        value === ""
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
        return "-";
    }

    return Number(value).toLocaleString(
        undefined,
        {
            maximumFractionDigits: 4
        }
    );
}


// ==========================================
// Categorical Frequency Analysis
// ==========================================

function getFrequency(column) {

    const frequency = {};

    edaData.forEach(row => {

        const value = row[column];

        if (isMissing(value)) {
            return;
        }

        const key =
            String(value);

        frequency[key] =
            (frequency[key] || 0) + 1;
    });

    return frequency;
}


// ==========================================
// Get Top Categories
// ==========================================

function getTopCategories(
    column,
    limit = 10
) {

    const frequency =
        getFrequency(column);

    return Object.entries(frequency)
        .sort(
            (a, b) => b[1] - a[1]
        )
        .slice(0, limit);
}


// ==========================================
// Correlation
// ==========================================

function calculateCorrelation(
    columnA,
    columnB
) {

    const pairs = [];

    edaData.forEach(row => {

        const x =
            Number(row[columnA]);

        const y =
            Number(row[columnB]);

        if (
            !isNaN(x) &&
            !isNaN(y)
        ) {
            pairs.push([x, y]);
        }
    });

    if (pairs.length < 2) {
        return 0;
    }

    const xValues =
        pairs.map(pair => pair[0]);

    const yValues =
        pairs.map(pair => pair[1]);

    const xMean =
        calculateMean(xValues);

    const yMean =
        calculateMean(yValues);

    let numerator = 0;
    let xVariance = 0;
    let yVariance = 0;

    pairs.forEach(pair => {

        const x =
            pair[0] - xMean;

        const y =
            pair[1] - yMean;

        numerator += x * y;

        xVariance += x * x;

        yVariance += y * y;
    });

    const denominator =
        Math.sqrt(
            xVariance * yVariance
        );

    if (!denominator) {
        return 0;
    }

    return numerator / denominator;
}


// ==========================================
// Generate Correlation Matrix
// ==========================================

function generateCorrelationMatrix() {

    const matrix = {};

    numericColumns.forEach(columnA => {

        matrix[columnA] = {};

        numericColumns.forEach(columnB => {

            matrix[columnA][columnB] =
                calculateCorrelation(
                    columnA,
                    columnB
                );
        });
    });

    return matrix;
}


// ==========================================
// Render Correlation Matrix
// ==========================================

function renderCorrelationMatrix() {

    const container =
        getElement("correlationMatrix");

    if (!container) {
        return;
    }

    if (numericColumns.length < 2) {

        container.innerHTML =
            "<p>At least two numeric columns are required.</p>";

        return;
    }

    const matrix =
        generateCorrelationMatrix();

    let html = `
        <table class="eda-table">
            <thead>
                <tr>
                    <th>Column</th>
    `;

    numericColumns.forEach(column => {

        html += `
            <th>
                ${escapeHTML(column)}
            </th>
        `;
    });

    html += `
            </tr>
        </thead>
        <tbody>
    `;

    numericColumns.forEach(rowColumn => {

        html += `
            <tr>
                <th>
                    ${escapeHTML(rowColumn)}
                </th>
        `;

        numericColumns.forEach(column => {

            const value =
                matrix[rowColumn][column];

            html += `
                <td>
                    ${value.toFixed(3)}
                </td>
            `;
        });

        html += "</tr>";
    });

    html += `
        </tbody>
        </table>
    `;

    container.innerHTML = html;
}


// ==========================================
// Export EDA Data
// ==========================================

function getEDAData() {

    return {
        data: edaData,
        numericColumns,
        categoricalColumns,
        rowCount: edaData.length,
        columnCount:
            edaData.length
                ? Object.keys(edaData[0]).length
                : 0,
        missingValues:
            calculateMissingValues(),
        duplicateRows:
            calculateDuplicateRows()
    };
}


// ==========================================
// Refresh EDA
// ==========================================

function refreshEDA() {

    initializeEDA();

    showEDAStatus(
        "EDA analysis refreshed.",
        "success"
    );
}


// ==========================================
// Status Message
// ==========================================

function showEDAStatus(
    message,
    type = "info"
) {

    const element =
        getElement("edaStatus");

    if (!element) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    element.textContent =
        message;

    element.className =
        `eda-status ${type}`;
}


// ==========================================
// HTML Escape
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// Make Functions Available Globally
// ==========================================

window.VelocityEDA = {

    initializeEDA,
    refreshEDA,
    getEDAData,
    getNumericValues,
    getFrequency,
    getTopCategories,
    calculateMean,
    calculateMedian,
    calculateStandardDeviation,
    calculateCorrelation,
    generateCorrelationMatrix,
    renderCorrelationMatrix
};