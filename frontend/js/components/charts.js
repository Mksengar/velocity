// ==========================================
// Velocity BI - Chart Components
// File: frontend/js/components/charts.js
// ==========================================

"use strict";

// ==========================================
// Chart Manager
// ==========================================

const VelocityBICharts = (() => {

    const charts = {};

    // ==========================================
    // Default Configuration
    // ==========================================

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,

        animation: {
            duration: 700
        },

        plugins: {
            legend: {
                display: true,
                position: "top"
            },

            tooltip: {
                enabled: true
            }
        },

        scales: {
            x: {
                grid: {
                    display: true
                }
            },

            y: {
                beginAtZero: true,
                grid: {
                    display: true
                }
            }
        }
    };


    // ==========================================
    // Get Chart Type
    // ==========================================

    function normalizeType(type) {

        const allowedTypes = [
            "bar",
            "line",
            "pie",
            "doughnut",
            "polarArea",
            "radar",
            "scatter"
        ];

        return allowedTypes.includes(type)
            ? type
            : "bar";
    }


    // ==========================================
    // Merge Objects
    // ==========================================

    function mergeOptions(base, custom) {

        const result = {
            ...base,
            ...custom
        };

        if (base.plugins || custom.plugins) {
            result.plugins = {
                ...(base.plugins || {}),
                ...(custom.plugins || {})
            };
        }

        if (base.scales || custom.scales) {
            result.scales = {
                ...(base.scales || {}),
                ...(custom.scales || {})
            };
        }

        return result;
    }


    // ==========================================
    // Create Chart
    // ==========================================

    function create(
        canvasId,
        type,
        data,
        options = {}
    ) {

        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.error(
                `Chart canvas not found: ${canvasId}`
            );
            return null;
        }


        // Destroy existing chart
        destroy(canvasId);


        const chartType = normalizeType(type);

        const chartOptions =
            mergeOptions(
                defaultOptions,
                options
            );


        const chart = new Chart(
            canvas,
            {
                type: chartType,
                data: data,
                options: chartOptions
            }
        );


        charts[canvasId] = chart;

        return chart;
    }


    // ==========================================
    // Create Bar Chart
    // ==========================================

    function createBar(
        canvasId,
        labels,
        datasets,
        options = {}
    ) {

        return create(
            canvasId,
            "bar",
            {
                labels: labels,
                datasets: datasets
            },
            options
        );
    }


    // ==========================================
    // Create Line Chart
    // ==========================================

    function createLine(
        canvasId,
        labels,
        datasets,
        options = {}
    ) {

        return create(
            canvasId,
            "line",
            {
                labels: labels,
                datasets: datasets
            },
            options
        );
    }


    // ==========================================
    // Create Pie Chart
    // ==========================================

    function createPie(
        canvasId,
        labels,
        data,
        backgroundColors = [],
        options = {}
    ) {

        return create(
            canvasId,
            "pie",
            {
                labels: labels,

                datasets: [
                    {
                        label: "Dataset",
                        data: data,
                        backgroundColor: backgroundColors
                    }
                ]
            },
            options
        );
    }


    // ==========================================
    // Create Doughnut Chart
    // ==========================================

    function createDoughnut(
        canvasId,
        labels,
        data,
        backgroundColors = [],
        options = {}
    ) {

        return create(
            canvasId,
            "doughnut",
            {
                labels: labels,

                datasets: [
                    {
                        label: "Dataset",
                        data: data,
                        backgroundColor: backgroundColors
                    }
                ]
            },
            options
        );
    }


    // ==========================================
    // Create Scatter Chart
    // ==========================================

    function createScatter(
        canvasId,
        datasets,
        options = {}
    ) {

        return create(
            canvasId,
            "scatter",
            {
                datasets: datasets
            },
            options
        );
    }


    // ==========================================
    // Update Chart
    // ==========================================

    function update(
        canvasId,
        data,
        options = {}
    ) {

        const chart = charts[canvasId];

        if (!chart) {

            console.warn(
                `Chart does not exist: ${canvasId}`
            );

            return null;
        }


        chart.data = data;

        chart.options =
            mergeOptions(
                chart.options,
                options
            );

        chart.update();

        return chart;
    }


    // ==========================================
    // Update Labels
    // ==========================================

    function updateLabels(
        canvasId,
        labels
    ) {

        const chart = charts[canvasId];

        if (!chart) return null;

        chart.data.labels = labels;

        chart.update();

        return chart;
    }


    // ==========================================
    // Update Dataset
    // ==========================================

    function updateDataset(
        canvasId,
        datasetIndex,
        data
    ) {

        const chart = charts[canvasId];

        if (!chart) return null;

        if (!chart.data.datasets[datasetIndex]) {

            console.warn(
                "Dataset index does not exist."
            );

            return null;
        }

        chart.data.datasets[
            datasetIndex
        ].data = data;

        chart.update();

        return chart;
    }


    // ==========================================
    // Add Dataset
    // ==========================================

    function addDataset(
        canvasId,
        dataset
    ) {

        const chart = charts[canvasId];

        if (!chart) return null;

        chart.data.datasets.push(dataset);

        chart.update();

        return chart;
    }


    // ==========================================
    // Remove Dataset
    // ==========================================

    function removeDataset(
        canvasId,
        datasetIndex
    ) {

        const chart = charts[canvasId];

        if (!chart) return null;

        chart.data.datasets.splice(
            datasetIndex,
            1
        );

        chart.update();

        return chart;
    }


    // ==========================================
    // Clear Chart
    // ==========================================

    function clear(canvasId) {

        const chart = charts[canvasId];

        if (!chart) return;

        chart.data.labels = [];

        chart.data.datasets.forEach(
            dataset => {
                dataset.data = [];
            }
        );

        chart.update();
    }


    // ==========================================
    // Destroy Chart
    // ==========================================

    function destroy(canvasId) {

        const chart = charts[canvasId];

        if (!chart) {
            return;
        }

        chart.destroy();

        delete charts[canvasId];
    }


    // ==========================================
    // Destroy All Charts
    // ==========================================

    function destroyAll() {

        Object.keys(charts).forEach(
            canvasId => {
                destroy(canvasId);
            }
        );
    }


    // ==========================================
    // Get Chart
    // ==========================================

    function get(canvasId) {

        return charts[canvasId] || null;
    }


    // ==========================================
    // Check Chart
    // ==========================================

    function exists(canvasId) {

        return Boolean(
            charts[canvasId]
        );
    }


    // ==========================================
    // Generate Colors
    // ==========================================

    function generateColors(count) {

        const colors = [];

        for (let i = 0; i < count; i++) {

            const hue =
                Math.round(
                    (360 / count) * i
                );

            colors.push(
                `hsl(${hue}, 70%, 55%)`
            );
        }

        return colors;
    }


    // ==========================================
    // Convert CSV Data
    // ==========================================

    function csvToChartData(
        rows,
        labelColumn,
        valueColumns
    ) {

        if (!Array.isArray(rows)) {
            return {
                labels: [],
                datasets: []
            };
        }


        const labels = rows.map(
            row => row[labelColumn]
        );


        const datasets =
            valueColumns.map(
                column => {

                    return {
                        label: column,
                        data: rows.map(
                            row =>
                                Number(
                                    row[column]
                                ) || 0
                        )
                    };
                }
            );


        return {
            labels,
            datasets
        };
    }


    // ==========================================
    // Convert Object Data
    // ==========================================

    function objectToChartData(
        data,
        labelKey,
        valueKey
    ) {

        if (!Array.isArray(data)) {

            return {
                labels: [],
                datasets: []
            };
        }


        return {

            labels: data.map(
                item => item[labelKey]
            ),

            datasets: [
                {
                    label: valueKey,

                    data: data.map(
                        item =>
                            Number(
                                item[valueKey]
                            ) || 0
                    )
                }
            ]
        };
    }


    // ==========================================
    // Resize Chart
    // ==========================================

    function resize(canvasId) {

        const chart = charts[canvasId];

        if (!chart) return;

        chart.resize();
    }


    // ==========================================
    // Resize All Charts
    // ==========================================

    function resizeAll() {

        Object.values(charts)
            .forEach(chart => {
                chart.resize();
            });
    }


    // ==========================================
    // Export Chart as Image
    // ==========================================

    function exportImage(
        canvasId,
        fileName = "velocity-bi-chart.png"
    ) {

        const chart = charts[canvasId];

        if (!chart) {

            console.error(
                "Chart not found."
            );

            return;
        }


        const link =
            document.createElement("a");

        link.href =
            chart.toBase64Image();

        link.download =
            fileName;

        link.click();
    }


    // ==========================================
    // Print Chart
    // ==========================================

    function print(canvasId) {

        const chart = charts[canvasId];

        if (!chart) return;


        const image =
            chart.toBase64Image();


        const printWindow =
            window.open(
                "",
                "_blank"
            );


        if (!printWindow) {
            return;
        }


        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Velocity BI Chart</title>

                <style>
                    body {
                        margin: 0;
                        padding: 40px;
                        text-align: center;
                        font-family: Arial, sans-serif;
                    }

                    img {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>

            <body>

                <img
                    src="${image}"
                    alt="Velocity BI Chart"
                >

                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                <\/script>

            </body>
            </html>
        `);

        printWindow.document.close();
    }


    // ==========================================
    // Public API
    // ==========================================

    return {

        create,

        createBar,

        createLine,

        createPie,

        createDoughnut,

        createScatter,

        update,

        updateLabels,

        updateDataset,

        addDataset,

        removeDataset,

        clear,

        destroy,

        destroyAll,

        get,

        exists,

        generateColors,

        csvToChartData,

        objectToChartData,

        resize,

        resizeAll,

        exportImage,

        print
    };

})();


// ==========================================
// Global Access
// ==========================================

window.VelocityBICharts =
    VelocityBICharts;


// ==========================================
// Window Resize Handler
// ==========================================

window.addEventListener(
    "resize",
    () => {

        VelocityBICharts.resizeAll();

    }
);