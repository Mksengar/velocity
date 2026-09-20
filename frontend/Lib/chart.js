// ============================================================
// Velocity BI - Chart Library
// File: frontend/lib/chart.js
// Description: Reusable Chart.js helper functions
// ============================================================

"use strict";

// ============================================================
// Chart Manager
// ============================================================

const VelocityCharts = (() => {
    const charts = new Map();

    // --------------------------------------------------------
    // Check Chart.js
    // --------------------------------------------------------

    function isChartJSLoaded() {
        if (typeof Chart === "undefined") {
            console.error(
                "Velocity BI: Chart.js is not loaded. " +
                "Include Chart.js before chart.js."
            );
            return false;
        }

        return true;
    }

    // --------------------------------------------------------
    // Get Canvas
    // --------------------------------------------------------

    function getCanvas(canvas) {
        if (typeof canvas === "string") {
            return document.getElementById(canvas) ||
                   document.querySelector(canvas);
        }

        if (canvas instanceof HTMLCanvasElement) {
            return canvas;
        }

        return null;
    }

    // --------------------------------------------------------
    // Generate Unique ID
    // --------------------------------------------------------

    function generateId(prefix = "chart") {
        return `${prefix}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`;
    }

    // --------------------------------------------------------
    // Default Options
    // --------------------------------------------------------

    function getDefaultOptions(type = "bar") {
        return {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 700,
                easing: "easeOutQuart"
            },

            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },

                tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false
                }
            },

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: type === "pie" || type === "doughnut"
                ? {}
                : {
                    x: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },

                    y: {
                        beginAtZero: true
                    }
                }
        };
    }

    // --------------------------------------------------------
    // Merge Objects
    // --------------------------------------------------------

    function mergeOptions(defaults, custom) {
        if (!custom) {
            return defaults;
        }

        const result = {
            ...defaults,
            ...custom
        };

        if (defaults.plugins || custom.plugins) {
            result.plugins = {
                ...(defaults.plugins || {}),
                ...(custom.plugins || {})
            };
        }

        if (defaults.scales || custom.scales) {
            result.scales = {
                ...(defaults.scales || {}),
                ...(custom.scales || {})
            };
        }

        return result;
    }

    // ========================================================
    // Create Chart
    // ========================================================

    function create(canvas, config, chartId = null) {
        if (!isChartJSLoaded()) {
            return null;
        }

        const canvasElement = getCanvas(canvas);

        if (!canvasElement) {
            console.error(
                "Velocity BI: Canvas element not found.",
                canvas
            );

            return null;
        }

        const id = chartId || canvasElement.id || generateId();

        // Destroy existing chart on same canvas
        destroy(canvasElement);

        const chartType = config.type || "bar";

        const options = mergeOptions(
            getDefaultOptions(chartType),
            config.options
        );

        const chart = new Chart(canvasElement, {
            type: chartType,

            data: config.data || {
                labels: [],
                datasets: []
            },

            options
        });

        charts.set(id, chart);

        return chart;
    }

    // ========================================================
    // Bar Chart
    // ========================================================

    function bar(canvas, labels, data, options = {}) {
        return create(canvas, {
            type: "bar",

            data: {
                labels,

                datasets: [
                    {
                        label: options.label || "Values",
                        data,

                        backgroundColor:
                            options.backgroundColor ||
                            "rgba(245, 200, 66, 0.75)",

                        borderColor:
                            options.borderColor ||
                            "#f5c842",

                        borderWidth:
                            options.borderWidth || 1,

                        borderRadius:
                            options.borderRadius || 6
                    }
                ]
            },

            options
        }, options.chartId);
    }

    // ========================================================
    // Line Chart
    // ========================================================

    function line(canvas, labels, data, options = {}) {
        return create(canvas, {
            type: "line",

            data: {
                labels,

                datasets: [
                    {
                        label: options.label || "Values",
                        data,

                        borderColor:
                            options.borderColor ||
                            "#f5c842",

                        backgroundColor:
                            options.backgroundColor ||
                            "rgba(245, 200, 66, 0.15)",

                        borderWidth:
                            options.borderWidth || 2,

                        fill:
                            options.fill !== undefined
                                ? options.fill
                                : true,

                        tension:
                            options.tension !== undefined
                                ? options.tension
                                : 0.35,

                        pointRadius:
                            options.pointRadius || 3,

                        pointHoverRadius:
                            options.pointHoverRadius || 6
                    }
                ]
            },

            options
        }, options.chartId);
    }

    // ========================================================
    // Area Chart
    // ========================================================

    function area(canvas, labels, data, options = {}) {
        return line(
            canvas,
            labels,
            data,
            {
                ...options,
                fill: true
            }
        );
    }

    // ========================================================
    // Doughnut Chart
    // ========================================================

    function doughnut(canvas, labels, data, options = {}) {
        return create(canvas, {
            type: "doughnut",

            data: {
                labels,

                datasets: [
                    {
                        label: options.label || "Distribution",

                        data,

                        backgroundColor:
                            options.backgroundColor ||
                            [
                                "#f5c842",
                                "#4f46e5",
                                "#22c55e",
                                "#ef4444",
                                "#06b6d4",
                                "#a855f7"
                            ],

                        borderWidth:
                            options.borderWidth || 2
                    }
                ]
            },

            options: {
                ...options,

                cutout:
                    options.cutout || "65%"
            }

        }, options.chartId);
    }

    // ========================================================
    // Pie Chart
    // ========================================================

    function pie(canvas, labels, data, options = {}) {
        return create(canvas, {
            type: "pie",

            data: {
                labels,

                datasets: [
                    {
                        label: options.label || "Distribution",

                        data,

                        backgroundColor:
                            options.backgroundColor ||
                            [
                                "#f5c842",
                                "#4f46e5",
                                "#22c55e",
                                "#ef4444",
                                "#06b6d4",
                                "#a855f7"
                            ],

                        borderWidth:
                            options.borderWidth || 2
                    }
                ]
            },

            options
        }, options.chartId);
    }

    // ========================================================
    // Scatter Chart
    // ========================================================

    function scatter(canvas, data, options = {}) {
        return create(canvas, {
            type: "scatter",

            data: {
                datasets: [
                    {
                        label: options.label || "Data",

                        data,

                        backgroundColor:
                            options.backgroundColor ||
                            "#f5c842",

                        borderColor:
                            options.borderColor ||
                            "#f5c842",

                        pointRadius:
                            options.pointRadius || 5
                    }
                ]
            },

            options
        }, options.chartId);
    }

    // ========================================================
    // Multi Dataset Chart
    // ========================================================

    function multiDataset(
        canvas,
        type,
        labels,
        datasets,
        options = {}
    ) {
        return create(canvas, {
            type,

            data: {
                labels,
                datasets
            },

            options
        }, options.chartId);
    }

    // ========================================================
    // Update Chart
    // ========================================================

    function update(chartOrId, data, options = {}) {
        let chart = chartOrId;

        if (typeof chartOrId === "string") {
            chart = charts.get(chartOrId);
        }

        if (!chart) {
            console.warn(
                "Velocity BI: Chart not found."
            );

            return null;
        }

        if (data) {
            chart.data = data;
        }

        if (options) {
            chart.options = mergeOptions(
                chart.options,
                options
            );
        }

        chart.update();

        return chart;
    }

    // ========================================================
    // Add Dataset
    // ========================================================

    function addDataset(chartOrId, dataset) {
        let chart = chartOrId;

        if (typeof chartOrId === "string") {
            chart = charts.get(chartOrId);
        }

        if (!chart) {
            return null;
        }

        chart.data.datasets.push(dataset);

        chart.update();

        return chart;
    }

    // ========================================================
    // Remove Dataset
    // ========================================================

    function removeDataset(chartOrId, index) {
        let chart = chartOrId;

        if (typeof chartOrId === "string") {
            chart = charts.get(chartOrId);
        }

        if (!chart) {
            return null;
        }

        if (
            index >= 0 &&
            index < chart.data.datasets.length
        ) {
            chart.data.datasets.splice(index, 1);
            chart.update();
        }

        return chart;
    }

    // ========================================================
    // Destroy Chart
    // ========================================================

    function destroy(chartOrCanvas) {
        let chart = null;
        let chartId = null;

        if (typeof chartOrCanvas === "string") {
            chartId = chartOrCanvas;

            chart = charts.get(chartId);

            if (!chart) {
                const canvas = getCanvas(chartOrCanvas);

                if (canvas) {
                    chart = Chart.getChart(canvas);
                }
            }
        } else if (
            chartOrCanvas instanceof HTMLCanvasElement
        ) {
            chart = Chart.getChart(chartOrCanvas);
        }

        if (chart) {
            chart.destroy();

            for (const [id, storedChart] of charts.entries()) {
                if (storedChart === chart) {
                    charts.delete(id);
                }
            }
        }

        if (chartId) {
            charts.delete(chartId);
        }
    }

    // ========================================================
    // Destroy All Charts
    // ========================================================

    function destroyAll() {
        charts.forEach(chart => {
            chart.destroy();
        });

        charts.clear();
    }

    // ========================================================
    // Get Chart
    // ========================================================

    function get(chartId) {
        return charts.get(chartId) || null;
    }

    // ========================================================
    // Check Existing Chart
    // ========================================================

    function exists(chartId) {
        return charts.has(chartId);
    }

    // ========================================================
    // Resize Chart
    // ========================================================

    function resize(chartOrId) {
        let chart = chartOrId;

        if (typeof chartOrId === "string") {
            chart = charts.get(chartOrId);
        }

        if (chart) {
            chart.resize();
        }
    }

    // ========================================================
    // Export Public API
    // ========================================================

    return {
        create,

        bar,
        line,
        area,
        pie,
        doughnut,
        scatter,

        multiDataset,

        update,
        addDataset,
        removeDataset,

        destroy,
        destroyAll,

        get,
        exists,
        resize
    };
})();

// ============================================================
// Global Access
// ============================================================

window.VelocityCharts = VelocityCharts;
