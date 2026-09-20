// ==========================================
// Velocity BI - Data Cleaning
// File: frontend/js/data-cleaning.js
// ==========================================

"use strict";

// ==========================================
// Global State
// ==========================================

let originalData = [];
let cleanedData = [];
let columnTypes = {};
let selectedFileName = "cleaned_dataset.csv";


// ==========================================
// DOM Helpers
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


// ==========================================
// Initialize Page
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadDataset();
    setupEventListeners();
});


// ==========================================
// Setup Event Listeners
// ==========================================

function setupEventListeners() {

    const cleanBtn = getElement("cleanDataBtn");
    const duplicateBtn = getElement("removeDuplicatesBtn");
    const missingBtn = getElement("handleMissingBtn");
    const trimBtn = getElement("trimSpacesBtn");
    const resetBtn = getElement("resetDataBtn");
    const downloadBtn = getElement("downloadCleanedBtn");

    if (cleanBtn) {
        cleanBtn.addEventListener("click", cleanData);
    }

    if (duplicateBtn) {
        duplicateBtn.addEventListener("click", removeDuplicates);
    }

    if (missingBtn) {
        missingBtn.addEventListener("click", handleMissingValues);
    }

    if (trimBtn) {
        trimTextValues();
    }

    if (resetBtn) {
        resetData();
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadCSV);
    }
}


// ==========================================
// Load Dataset
// ==========================================

function loadDataset() {

    try {
        const storedData = localStorage.getItem("velocityBI_dataset");

        if (!storedData) {
            showMessage(
                "No dataset found. Please upload a dataset first.",
                "warning"
            );
            return;
        }

        const parsedData = JSON.parse(storedData);

        if (Array.isArray(parsedData)) {
            originalData = parsedData;
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
            originalData = parsedData.data;

            if (parsedData.fileName) {
                selectedFileName = parsedData.fileName;
            }
        }

        cleanedData = JSON.parse(JSON.stringify(originalData));

        detectColumnTypes();
        updateStatistics();
        renderPreview();

    } catch (error) {
        console.error("Dataset loading error:", error);

        showMessage(
            "Unable to load dataset.",
            "error"
        );
    }
}


// ==========================================
// Detect Column Types
// ==========================================

function detectColumnTypes() {

    columnTypes = {};

    if (!cleanedData.length) {
        return;
    }

    const columns = Object.keys(cleanedData[0]);

    columns.forEach(column => {

        const values = cleanedData
            .map(row => row[column])
            .filter(value =>
                value !== null &&
                value !== undefined &&
                value !== ""
            );

        if (!values.length) {
            columnTypes[column] = "string";
            return;
        }

        const numericValues = values.filter(value =>
            !isNaN(value) && value !== ""
        );

        if (numericValues.length === values.length) {
            columnTypes[column] = "number";
            return;
        }

        const dateValues = values.filter(value =>
            !isNaN(Date.parse(value))
        );

        if (dateValues.length === values.length) {
            columnTypes[column] = "date";
            return;
        }

        columnTypes[column] = "string";
    });
}


// ==========================================
// Render Dataset Preview
// ==========================================

function renderPreview() {

    const table = getElement("dataPreviewTable");

    if (!table) {
        return;
    }

    if (!cleanedData.length) {
        table.innerHTML = `
            <tr>
                <td colspan="100%">
                    No data available
                </td>
            </tr>
        `;
        return;
    }

    const columns = Object.keys(cleanedData[0]);

    let html = "<thead><tr>";

    columns.forEach(column => {
        html += `<th>${escapeHTML(column)}</th>`;
    });

    html += "</tr></thead>";

    html += "<tbody>";

    const previewRows = cleanedData.slice(0, 100);

    previewRows.forEach(row => {

        html += "<tr>";

        columns.forEach(column => {

            const value =
                row[column] === null ||
                row[column] === undefined
                    ? ""
                    : row[column];

            html += `
                <td>
                    ${escapeHTML(String(value))}
                </td>
            `;
        });

        html += "</tr>";
    });

    html += "</tbody>";

    table.innerHTML = html;
}


// ==========================================
// Remove Duplicate Rows
// ==========================================

function removeDuplicates() {

    if (!cleanedData.length) {
        showMessage("No data available.", "warning");
        return;
    }

    const beforeCount = cleanedData.length;

    const uniqueRows = [];
    const seen = new Set();

    cleanedData.forEach(row => {

        const rowKey = JSON.stringify(row);

        if (!seen.has(rowKey)) {
            seen.add(rowKey);
            uniqueRows.push(row);
        }
    });

    cleanedData = uniqueRows;

    const removedCount =
        beforeCount - cleanedData.length;

    updateStatistics();
    renderPreview();
    saveCleanedData();

    showMessage(
        `${removedCount} duplicate row(s) removed.`,
        "success"
    );
}


// ==========================================
// Handle Missing Values
// ==========================================

function handleMissingValues() {

    if (!cleanedData.length) {
        showMessage("No data available.", "warning");
        return;
    }

    const methodElement = getElement("missingValueMethod");

    const method =
        methodElement
            ? methodElement.value
            : "empty";

    const columns = Object.keys(cleanedData[0]);

    columns.forEach(column => {

        const values = cleanedData
            .map(row => row[column])
            .filter(value =>
                value !== null &&
                value !== undefined &&
                value !== ""
            );

        if (!values.length) {
            return;
        }

        if (method === "remove") {

            cleanedData = cleanedData.filter(row => {

                const value = row[column];

                return (
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                );
            });

        } else {

            let replacementValue = "";

            if (method === "zero") {
                replacementValue = 0;
            }

            if (method === "mean") {

                const numbers = values
                    .map(Number)
                    .filter(value => !isNaN(value));

                if (numbers.length) {

                    const sum = numbers.reduce(
                        (total, value) => total + value,
                        0
                    );

                    replacementValue =
                        sum / numbers.length;
                }
            }

            if (method === "median") {

                const numbers = values
                    .map(Number)
                    .filter(value => !isNaN(value))
                    .sort((a, b) => a - b);

                if (numbers.length) {

                    const middle =
                        Math.floor(numbers.length / 2);

                    replacementValue =
                        numbers.length % 2 === 0
                            ? (
                                numbers[middle - 1] +
                                numbers[middle]
                            ) / 2
                            : numbers[middle];
                }
            }

            if (method === "mode") {

                replacementValue =
                    calculateMode(values);
            }

            cleanedData.forEach(row => {

                const value = row[column];

                if (
                    value === null ||
                    value === undefined ||
                    value === ""
                ) {
                    row[column] = replacementValue;
                }
            });
        }
    });

    updateStatistics();
    renderPreview();
    saveCleanedData();

    showMessage(
        "Missing values handled successfully.",
        "success"
    );
}


// ==========================================
// Calculate Mode
// ==========================================

function calculateMode(values) {

    const frequency = {};

    values.forEach(value => {

        const key = String(value);

        frequency[key] =
            (frequency[key] || 0) + 1;
    });

    let mode = values[0];
    let highestFrequency = 0;

    Object.keys(frequency).forEach(key => {

        if (frequency[key] > highestFrequency) {

            highestFrequency =
                frequency[key];

            mode = key;
        }
    });

    return mode;
}


// ==========================================
// Trim Spaces
// ==========================================

function trimTextValues() {

    if (!cleanedData.length) {
        return;
    }

    cleanedData.forEach(row => {

        Object.keys(row).forEach(column => {

            if (typeof row[column] === "string") {

                row[column] =
                    row[column].trim();
            }
        });
    });

    renderPreview();
}


// ==========================================
// Convert Data Types
// ==========================================

function convertDataTypes() {

    if (!cleanedData.length) {
        return;
    }

    Object.keys(columnTypes).forEach(column => {

        const type = columnTypes[column];

        cleanedData.forEach(row => {

            const value = row[column];

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return;
            }

            if (type === "number") {

                const numberValue =
                    Number(value);

                if (!isNaN(numberValue)) {
                    row[column] = numberValue;
                }
            }

            if (type === "date") {

                const dateValue =
                    new Date(value);

                if (!isNaN(dateValue.getTime())) {

                    row[column] =
                        dateValue.toISOString()
                            .split("T")[0];
                }
            }

            if (type === "string") {

                row[column] =
                    String(value).trim();
            }
        });
    });

    renderPreview();
}


// ==========================================
// Complete Cleaning Process
// ==========================================

function cleanData() {

    if (!cleanedData.length) {

        showMessage(
            "No dataset available for cleaning.",
            "warning"
        );

        return;
    }

    // Step 1: Trim spaces
    trimTextValues();

    // Step 2: Detect column types
    detectColumnTypes();

    // Step 3: Convert values
    convertDataTypes();

    // Step 4: Remove duplicates
    const uniqueRows = [];
    const seen = new Set();

    cleanedData.forEach(row => {

        const key = JSON.stringify(row);

        if (!seen.has(key)) {

            seen.add(key);
            uniqueRows.push(row);
        }
    });

    cleanedData = uniqueRows;

    // Step 5: Update UI
    updateStatistics();
    renderPreview();

    // Step 6: Save
    saveCleanedData();

    showMessage(
        "Dataset cleaned successfully.",
        "success"
    );
}


// ==========================================
// Reset Dataset
// ==========================================

function resetData() {

    if (!originalData.length) {
        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to reset all cleaning changes?"
        );

    if (!confirmed) {
        return;
    }

    cleanedData =
        JSON.parse(
            JSON.stringify(originalData)
        );

    detectColumnTypes();
    updateStatistics();
    renderPreview();

    saveCleanedData();

    showMessage(
        "Dataset restored to original version.",
        "success"
    );
}


// ==========================================
// Statistics
// ==========================================

function updateStatistics() {

    const rowsElement =
        getElement("rowCount");

    const columnsElement =
        getElement("columnCount");

    const missingElement =
        getElement("missingCount");

    const duplicateElement =
        getElement("duplicateCount");

    const rowCount =
        cleanedData.length;

    const columnCount =
        cleanedData.length
            ? Object.keys(cleanedData[0]).length
            : 0;

    let missingCount = 0;

    cleanedData.forEach(row => {

        Object.values(row).forEach(value => {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                missingCount++;
            }
        });
    });

    const duplicateCount =
        calculateDuplicateCount();

    if (rowsElement) {
        rowsElement.textContent = rowCount;
    }

    if (columnsElement) {
        columnsElement.textContent = columnCount;
    }

    if (missingElement) {
        missingElement.textContent =
            missingCount;
    }

    if (duplicateElement) {
        duplicateElement.textContent =
            duplicateCount;
    }
}


// ==========================================
// Calculate Duplicate Count
// ==========================================

function calculateDuplicateCount() {

    const seen = new Set();
    let duplicates = 0;

    cleanedData.forEach(row => {

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
// Save Cleaned Dataset
// ==========================================

function saveCleanedData() {

    try {

        localStorage.setItem(
            "velocityBI_cleaned_dataset",
            JSON.stringify(cleanedData)
        );

        localStorage.setItem(
            "velocityBI_dataset",
            JSON.stringify(cleanedData)
        );

    } catch (error) {

        console.error(
            "Unable to save cleaned dataset:",
            error
        );
    }
}


// ==========================================
// Download CSV
// ==========================================

function downloadCSV() {

    if (!cleanedData.length) {

        showMessage(
            "No cleaned data available.",
            "warning"
        );

        return;
    }

    const columns =
        Object.keys(cleanedData[0]);

    const header =
        columns.map(csvEscape).join(",");

    const rows =
        cleanedData.map(row => {

            return columns
                .map(column =>
                    csvEscape(row[column])
                )
                .join(",");
        });

    const csv =
        [header, ...rows].join("\n");

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
        getCleanedFileName();

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showMessage(
        "Cleaned dataset downloaded.",
        "success"
    );
}


// ==========================================
// CSV Escape
// ==========================================

function csvEscape(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const stringValue =
        String(value);

    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;
    }

    return stringValue;
}


// ==========================================
// Generate Cleaned Filename
// ==========================================

function getCleanedFileName() {

    const name =
        selectedFileName
            .replace(/\.[^/.]+$/, "");

    return `${name}_cleaned.csv`;
}


// ==========================================
// UI Message
// ==========================================

function showMessage(message, type = "info") {

    const messageElement =
        getElement("cleaningMessage");

    if (!messageElement) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    messageElement.textContent =
        message;

    messageElement.className =
        `cleaning-message ${type}`;

    setTimeout(() => {

        messageElement.textContent = "";

        messageElement.className =
            "cleaning-message";

    }, 4000);
}


// ==========================================
// HTML Escape
// ==========================================

function escapeHTML(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// Get Cleaned Dataset
// Useful for Other JS Files
// ==========================================

function getCleanedDataset() {

    return cleanedData;
}


// ==========================================
// Get Column Types
// ==========================================

function getColumnTypes() {

    return columnTypes;
}


// ==========================================
// Export Functions
// ==========================================

window.VelocityDataCleaning = {

    cleanData,
    removeDuplicates,
    handleMissingValues,
    trimTextValues,
    convertDataTypes,
    resetData,
    downloadCSV,
    getCleanedDataset,
    getColumnTypes

};