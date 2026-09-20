// ==========================================
// Velocity BI - Correlation Analysis
// File: frontend/js/correlation.js
// ==========================================

"use strict";

// ==========================================
// Global State
// ==========================================

let correlationData = [];
let correlationMatrix = {};
let numericColumns = [];


// ==========================================
// DOM Helper
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeCorrelation();
});


function initializeCorrelation() {
    console.log("Velocity BI - Correlation Analysis initialized");

    loadDataset();

    const calculateButton = getElement("calculateCorrelation");

    if (calculateButton) {
        calculateButton.addEventListener("click", calculateCorrelation);
    }
}


// ==========================================
// Load Dataset
// ==========================================

function loadDataset() {
    try {
        const storedData =
            sessionStorage.getItem("velocityBI_dataset") ||
            localStorage.getItem("velocityBI_dataset");

        if (!storedData) {
            console.warn("No dataset found.");

            showMessage(
                "No dataset found. Please upload a dataset first.",
                "warning"
            );

            return;
        }

        correlationData = JSON.parse(storedData);

        if (!Array.isArray(correlationData)) {
            throw new Error("Dataset must be an array.");
        }

        console.log(
            `Dataset loaded: ${correlationData.length} rows`
        );

        detectNumericColumns();

    } catch (error) {
        console.error("Dataset loading error:", error);

        showMessage(
            "Unable to load dataset.",
            "error"
        );
    }
}


// ==========================================
// Detect Numeric Columns
// ==========================================

function detectNumericColumns() {
    if (!correlationData.length) {
        return;
    }

    const columns = Object.keys(correlationData[0]);

    numericColumns = columns.filter(column => {

        const values = correlationData
            .map(row => row[column])
            .filter(value =>
                value !== null &&
                value !== undefined &&
                value !== ""
            );

        if (!values.length) {
            return false;
        }

        const numericValues = values.filter(value =>
            !isNaN(Number(value))
        );

        return numericValues.length / values.length >= 0.7;
    });

    console.log(
        "Numeric columns:",
        numericColumns
    );

    displayColumnSelector();
}


// ==========================================
// Display Column Selector
// ==========================================

function displayColumnSelector() {

    const container =
        getElement("correlationColumns");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!numericColumns.length) {

        container.innerHTML = `
            <p class="empty-message">
                No numeric columns found.
            </p>
        `;

        return;
    }

    numericColumns.forEach(column => {

        const label = document.createElement("label");

        label.className = "correlation-column";

        label.innerHTML = `
            <input
                type="checkbox"
                value="${escapeHTML(column)}"
                checked
            >

            <span>
                ${escapeHTML(column)}
            </span>
        `;

        container.appendChild(label);
    });
}


// ==========================================
// Calculate Correlation
// ==========================================

function calculateCorrelation() {

    if (!correlationData.length) {

        showMessage(
            "Please load a dataset first.",
            "warning"
        );

        return;
    }

    const selectedColumns =
        getSelectedColumns();

    if (selectedColumns.length < 2) {

        showMessage(
            "Select at least two numeric columns.",
            "warning"
        );

        return;
    }

    correlationMatrix = {};

    selectedColumns.forEach(columnA => {

        correlationMatrix[columnA] = {};

        selectedColumns.forEach(columnB => {

            const valuesA = getNumericValues(columnA);
            const valuesB = getNumericValues(columnB);

            const pairedValues = createPairs(
                valuesA,
                valuesB
            );

            if (pairedValues.length < 2) {

                correlationMatrix[columnA][columnB] = null;

            } else {

                correlationMatrix[columnA][columnB] =
                    pearsonCorrelation(
                        pairedValues.map(pair => pair.x),
                        pairedValues.map(pair => pair.y)
                    );
            }
        });
    });

    displayCorrelationMatrix();
    displayCorrelationTable();
    displayCorrelationSummary();

    console.log(
        "Correlation Matrix:",
        correlationMatrix
    );
}


// ==========================================
// Get Selected Columns
// ==========================================

function getSelectedColumns() {

    const checkboxes =
        document.querySelectorAll(
            "#correlationColumns input[type='checkbox']:checked"
        );

    return Array.from(checkboxes)
        .map(input => input.value);
}


// ==========================================
// Get Numeric Values
// ==========================================

function getNumericValues(column) {

    return correlationData.map(row => {

        const value = Number(row[column]);

        return isNaN(value) ? null : value;

    });
}


// ==========================================
// Create Paired Values
// ==========================================

function createPairs(valuesA, valuesB) {

    const pairs = [];

    for (let i = 0; i < valuesA.length; i++) {

        if (
            valuesA[i] !== null &&
            valuesB[i] !== null
        ) {

            pairs.push({
                x: valuesA[i],
                y: valuesB[i]
            });
        }
    }

    return pairs;
}


// ==========================================
// Pearson Correlation
// ==========================================

function pearsonCorrelation(x, y) {

    if (
        !Array.isArray(x) ||
        !Array.isArray(y) ||
        x.length !== y.length ||
        x.length < 2
    ) {
        return null;
    }

    const n = x.length;

    const meanX =
        x.reduce((sum, value) => sum + value, 0) / n;

    const meanY =
        y.reduce((sum, value) => sum + value, 0) / n;

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < n; i++) {

        const differenceX = x[i] - meanX;
        const differenceY = y[i] - meanY;

        numerator +=
            differenceX * differenceY;

        denominatorX +=
            differenceX * differenceX;

        denominatorY +=
            differenceY * differenceY;
    }

    const denominator =
        Math.sqrt(
            denominatorX * denominatorY
        );

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}


// ==========================================
// Display Correlation Matrix
// ==========================================

function displayCorrelationMatrix() {

    const container =
        getElement("correlationMatrix");

    if (!container) {
        return;
    }

    const columns =
        Object.keys(correlationMatrix);

    let html = `
        <div class="correlation-matrix-wrapper">
            <table class="correlation-table">
                <thead>
                    <tr>
                        <th>Variable</th>
    `;

    columns.forEach(column => {

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

    columns.forEach(rowColumn => {

        html += `
            <tr>
                <th>
                    ${escapeHTML(rowColumn)}
                </th>
        `;

        columns.forEach(column => {

            const value =
                correlationMatrix[rowColumn][column];

            html += `
                <td
                    class="${getCorrelationClass(value)}"
                    title="${getCorrelationDescription(value)}"
                >
                    ${formatCorrelation(value)}
                </td>
            `;
        });

        html += `
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}


// ==========================================
// Display Correlation Table
// ==========================================

function displayCorrelationTable() {

    const table =
        getElement("correlationResults");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    const columns =
        Object.keys(correlationMatrix);

    columns.forEach(columnA => {

        columns.forEach(columnB => {

            if (columnA >= columnB) {
                return;
            }

            const value =
                correlationMatrix[columnA][columnB];

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(columnA)}</td>
                <td>${escapeHTML(columnB)}</td>
                <td>
                    ${formatCorrelation(value)}
                </td>
                <td>
                    ${getCorrelationStrength(value)}
                </td>
                <td>
                    ${getCorrelationDirection(value)}
                </td>
            `;

            table.appendChild(row);
        });
    });
}


// ==========================================
// Display Summary
// ==========================================

function displayCorrelationSummary() {

    const container =
        getElement("correlationSummary");

    if (!container) {
        return;
    }

    const pairs = [];

    const columns =
        Object.keys(correlationMatrix);

    columns.forEach(columnA => {

        columns.forEach(columnB => {

            if (columnA >= columnB) {
                return;
            }

            const value =
                correlationMatrix[columnA][columnB];

            if (value !== null) {

                pairs.push({
                    columnA,
                    columnB,
                    value
                });
            }
        });
    });

    if (!pairs.length) {

        container.innerHTML =
            "<p>No correlation results available.</p>";

        return;
    }

    const strongestPositive =
        [...pairs].sort(
            (a, b) => b.value - a.value
        )[0];

    const strongestNegative =
        [...pairs].sort(
            (a, b) => a.value - b.value
        )[0];

    container.innerHTML = `
        <div class="correlation-summary-card">

            <h3>Correlation Summary</h3>

            <p>
                <strong>Strongest Positive:</strong>
                ${escapeHTML(strongestPositive.columnA)}
                ↔
                ${escapeHTML(strongestPositive.columnB)}
                (${formatCorrelation(strongestPositive.value)})
            </p>

            <p>
                <strong>Strongest Negative:</strong>
                ${escapeHTML(strongestNegative.columnA)}
                ↔
                ${escapeHTML(strongestNegative.columnB)}
                (${formatCorrelation(strongestNegative.value)})
            </p>

        </div>
    `;
}


// ==========================================
// Correlation Formatting
// ==========================================

function formatCorrelation(value) {

    if (value === null || value === undefined) {
        return "N/A";
    }

    return Number(value).toFixed(3);
}


// ==========================================
// Correlation Strength
// ==========================================

function getCorrelationStrength(value) {

    if (value === null) {
        return "N/A";
    }

    const absoluteValue =
        Math.abs(value);

    if (absoluteValue >= 0.8) {
        return "Very Strong";
    }

    if (absoluteValue >= 0.6) {
        return "Strong";
    }

    if (absoluteValue >= 0.4) {
        return "Moderate";
    }

    if (absoluteValue >= 0.2) {
        return "Weak";
    }

    return "Very Weak";
}


// ==========================================
// Correlation Direction
// ==========================================

function getCorrelationDirection(value) {

    if (value === null) {
        return "N/A";
    }

    if (value > 0) {
        return "Positive";
    }

    if (value < 0) {
        return "Negative";
    }

    return "No Linear Correlation";
}


// ==========================================
// Correlation Description
// ==========================================

function getCorrelationDescription(value) {

    if (value === null) {
        return "Not available";
    }

    return `${getCorrelationDirection(value)} correlation - ${getCorrelationStrength(value)}`;
}


// ==========================================
// CSS Class
// ==========================================

function getCorrelationClass(value) {

    if (value === null) {
        return "correlation-na";
    }

    if (value >= 0.8) {
        return "correlation-positive-very-strong";
    }

    if (value >= 0.6) {
        return "correlation-positive-strong";
    }

    if (value >= 0.4) {
        return "correlation-positive-moderate";
    }

    if (value > 0) {
        return "correlation-positive";
    }

    if (value <= -0.8) {
        return "correlation-negative-very-strong";
    }

    if (value <= -0.6) {
        return "correlation-negative-strong";
    }

    if (value <= -0.4) {
        return "correlation-negative-moderate";
    }

    if (value < 0) {
        return "correlation-negative";
    }

    return "correlation-neutral";
}


// ==========================================
// Export Correlation Matrix
// ==========================================

function exportCorrelationCSV() {

    const columns =
        Object.keys(correlationMatrix);

    if (!columns.length) {
        showMessage(
            "Calculate correlation first.",
            "warning"
        );
        return;
    }

    let csv = "";

    csv += [
        "Variable",
        ...columns
    ].join(",") + "\n";

    columns.forEach(rowColumn => {

        const row = [
            rowColumn
        ];

        columns.forEach(column => {

            const value =
                correlationMatrix[rowColumn][column];

            row.push(
                value === null
                    ? ""
                    : Number(value).toFixed(4)
            );
        });

        csv += row.join(",") + "\n";
    });

    downloadFile(
        csv,
        "velocity-bi-correlation.csv",
        "text/csv"
    );
}


// ==========================================
// Download Helper
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
        getElement("correlationMessage");

    if (!container) {
        console.log(`[${type}] ${message}`);
        return;
    }

    container.className =
        `correlation-message ${type}`;

    container.textContent =
        message;
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
// Public API
// ==========================================

window.VelocityCorrelation = {

    calculate: calculateCorrelation,

    getMatrix: () =>
        correlationMatrix,

    getColumns: () =>
        numericColumns,

    exportCSV:
        exportCorrelationCSV,

    pearson:
        pearsonCorrelation
};