// ============================================================
// Velocity BI - Plotly.js Library
// File: frontend/lib/plotly.js
// Description: Reusable Plotly chart utilities
// ============================================================

"use strict";

const VelocityPlotly = (() => {

    // ========================================================
    // Configuration
    // ========================================================

    const defaultConfig = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            "lasso2d",
            "select2d"
        ]
    };

    const defaultLayout = {
        autosize: true,

        margin: {
            l: 55,
            r: 25,
            t: 55,
            b: 55
        },

        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",

        font: {
            family: "DM Sans, Arial, sans-serif",
            size: 13
        },

        hovermode: "closest",

        xaxis: {
            showgrid: true,
            zeroline: false
        },

        yaxis: {
            showgrid: true,
            zeroline: false
        }
    };

    // ========================================================
    // Check Plotly
    // ========================================================

    function isLoaded() {
        if (typeof Plotly === "undefined") {
            console.error(
                "Velocity BI: Plotly.js is not loaded."
            );

            return false;
        }

        return true;
    }

    // ========================================================
    // Get Element
    // ========================================================

    function getElement(element) {

        if (typeof element === "string") {
            return (
                document.getElementById(element) ||
                document.querySelector(element)
            );
        }

        if (element instanceof HTMLElement) {
            return element;
        }

        return null;
    }

    // ========================================================
    // Deep Merge
    // ========================================================

    function mergeObjects(base, custom) {

        const result = {
            ...base
        };

        if (!custom) {
            return result;
        }

        Object.keys(custom).forEach(key => {

            if (
                typeof custom[key] === "object" &&
                custom[key] !== null &&
                !Array.isArray(custom[key]) &&
                typeof base[key] === "object"
            ) {
                result[key] = mergeObjects(
                    base[key],
                    custom[key]
                );
            } else {
                result[key] = custom[key];
            }

        });

        return result;
    }

    // ========================================================
    // Create Plot
    // ========================================================

    function create(
        element,
        traces = [],
        layout = {},
        config = {}
    ) {

        if (!isLoaded()) {
            return null;
        }

        const target = getElement(element);

        if (!target) {
            console.error(
                "Velocity BI: Plotly container not found.",
                element
            );

            return null;
        }

        const finalLayout = mergeObjects(
            defaultLayout,
            layout
        );

        const finalConfig = mergeObjects(
            defaultConfig,
            config
        );

        return Plotly.newPlot(
            target,
            traces,
            finalLayout,
            finalConfig
        );
    }

    // ========================================================
    // Bar Chart
    // ========================================================

    function bar(
        element,
        x,
        y,
        options = {}
    ) {

        const trace = {
            x,
            y,

            type: "bar",

            name: options.name || "Values",

            marker: {
                color:
                    options.color ||
                    "#f5c842",

                line: {
                    width: 0
                }
            },

            hovertemplate:
                options.hovertemplate ||
                "%{x}<br>Value: %{y}<extra></extra>"
        };

        return create(
            element,
            [trace],
            {
                title: options.title || "Bar Chart",

                xaxis: {
                    title: options.xTitle || ""
                },

                yaxis: {
                    title: options.yTitle || ""
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Line Chart
    // ========================================================

    function line(
        element,
        x,
        y,
        options = {}
    ) {

        const trace = {
            x,
            y,

            type: "scatter",

            mode: options.mode || "lines+markers",

            name: options.name || "Values",

            line: {
                width:
                    options.lineWidth || 3,

                shape:
                    options.shape || "linear",

                color:
                    options.color || "#f5c842"
            },

            marker: {
                size:
                    options.markerSize || 6
            },

            hovertemplate:
                options.hovertemplate ||
                "%{x}<br>Value: %{y}<extra></extra>"
        };

        return create(
            element,
            [trace],
            {
                title: options.title || "Line Chart",

                xaxis: {
                    title: options.xTitle || ""
                },

                yaxis: {
                    title: options.yTitle || ""
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Area Chart
    // ========================================================

    function area(
        element,
        x,
        y,
        options = {}
    ) {

        const trace = {
            x,
            y,

            type: "scatter",

            mode: "lines",

            fill: "tozeroy",

            name: options.name || "Values",

            line: {
                width: options.lineWidth || 2,

                color:
                    options.color || "#f5c842"
            },

            hovertemplate:
                options.hovertemplate ||
                "%{x}<br>Value: %{y}<extra></extra>"
        };

        return create(
            element,
            [trace],
            {
                title: options.title || "Area Chart",

                xaxis: {
                    title: options.xTitle || ""
                },

                yaxis: {
                    title: options.yTitle || ""
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Pie Chart
    // ========================================================

    function pie(
        element,
        labels,
        values,
        options = {}
    ) {

        const trace = {
            labels,
            values,

            type: "pie",

            hole:
                options.hole !== undefined
                    ? options.hole
                    : 0,

            textinfo:
                options.textinfo || "label+percent",

            hovertemplate:
                "%{label}<br>" +
                "Value: %{value}<br>" +
                "Percent: %{percent}" +
                "<extra></extra>"
        };

        return create(
            element,
            [trace],
            {
                title: options.title || "Pie Chart",

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Doughnut Chart
    // ========================================================

    function doughnut(
        element,
        labels,
        values,
        options = {}
    ) {

        return pie(
            element,
            labels,
            values,
            {
                ...options,
                hole:
                    options.hole !== undefined
                        ? options.hole
                        : 0.55
            }
        );
    }

    // ========================================================
    // Scatter Chart
    // ========================================================

    function scatter(
        element,
        x,
        y,
        options = {}
    ) {

        const trace = {
            x,
            y,

            type: "scatter",

            mode:
                options.mode ||
                "markers",

            name:
                options.name ||
                "Data",

            marker: {
                size:
                    options.markerSize || 9,

                opacity:
                    options.opacity || 0.8,

                color:
                    options.color || "#f5c842"
            },

            hovertemplate:
                options.hovertemplate ||
                "X: %{x}<br>Y: %{y}<extra></extra>"
        };

        return create(
            element,
            [trace],
            {
                title:
                    options.title ||
                    "Scatter Plot",

                xaxis: {
                    title:
                        options.xTitle ||
                        ""
                },

                yaxis: {
                    title:
                        options.yTitle ||
                        ""
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Histogram
    // ========================================================

    function histogram(
        element,
        values,
        options = {}
    ) {

        const trace = {
            x: values,

            type: "histogram",

            name:
                options.name ||
                "Distribution",

            nbinsx:
                options.bins ||
                20,

            marker: {
                color:
                    options.color ||
                    "#f5c842"
            }
        };

        return create(
            element,
            [trace],
            {
                title:
                    options.title ||
                    "Histogram",

                xaxis: {
                    title:
                        options.xTitle ||
                        ""
                },

                yaxis: {
                    title:
                        options.yTitle ||
                        "Count"
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Box Plot
    // ========================================================

    function box(
        element,
        values,
        options = {}
    ) {

        const trace = {
            y: values,

            type: "box",

            name:
                options.name ||
                "Distribution",

            boxpoints:
                options.boxpoints ||
                "outliers",

            marker: {
                color:
                    options.color ||
                    "#f5c842"
            }
        };

        return create(
            element,
            [trace],
            {
                title:
                    options.title ||
                    "Box Plot",

                yaxis: {
                    title:
                        options.yTitle ||
                        ""
                },

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Multiple Series
    // ========================================================

    function multiple(
        element,
        traces,
        options = {}
    ) {

        return create(
            element,
            traces,
            {
                title:
                    options.title ||
                    "",

                ...options.layout
            },
            options.config
        );
    }

    // ========================================================
    // Update Plot
    // ========================================================

    function update(
        element,
        traces,
        layout = {},
        config = {}
    ) {

        if (!isLoaded()) {
            return null;
        }

        const target = getElement(element);

        if (!target) {
            return null;
        }

        return Plotly.react(
            target,
            traces,
            mergeObjects(
                defaultLayout,
                layout
            ),
            mergeObjects(
                defaultConfig,
                config
            )
        );
    }

    // ========================================================
    // Add Trace
    // ========================================================

    function addTrace(
        element,
        trace
    ) {

        if (!isLoaded()) {
            return null;
        }

        const target = getElement(element);

        if (!target) {
            return null;
        }

        return Plotly.addTraces(
            target,
            trace
        );
    }

    // ========================================================
    // Remove Trace
    // ========================================================

    function removeTrace(
        element,
        index
    ) {

        if (!isLoaded()) {
            return null;
        }

        const target = getElement(element);

        if (!target) {
            return null;
        }

        return Plotly.deleteTraces(
            target,
            index
        );
    }

    // ========================================================
    // Resize
    // ========================================================

    function resize(element) {

        if (!isLoaded()) {
            return;
        }

        const target = getElement(element);

        if (target) {
            Plotly.Plots.resize(target);
        }
    }

    // ========================================================
    // Clear Plot
    // ========================================================

    function clear(element) {

        if (!isLoaded()) {
            return;
        }

        const target = getElement(element);

        if (target) {
            Plotly.purge(target);
        }
    }

    // ========================================================
    // Download PNG
    // ========================================================

    function downloadPNG(
        element,
        filename = "velocity-bi-chart.png"
    ) {

        if (!isLoaded()) {
            return;
        }

        const target = getElement(element);

        if (!target) {
            return;
        }

        Plotly.downloadImage(
            target,
            {
                format: "png",
                filename,
                height: 700,
                width: 1200,
                scale: 2
            }
        );
    }

    // ========================================================
    // Download SVG
    // ========================================================

    function downloadSVG(
        element,
        filename = "velocity-bi-chart.svg"
    ) {

        if (!isLoaded()) {
            return;
        }

        const target = getElement(element);

        if (!target) {
            return;
        }

        Plotly.downloadImage(
            target,
            {
                format: "svg",
                filename,
                height: 700,
                width: 1200
            }
        );
    }

    // ========================================================
    // Export CSV from Plot Data
    // ========================================================

    function exportCSV(
        element,
        filename = "velocity-bi-data.csv"
    ) {

        const target = getElement(element);

        if (!target || !target.data) {
            return;
        }

        const rows = [];

        target.data.forEach(trace => {

            const x = trace.x || [];
            const y = trace.y || [];

            const length =
                Math.max(
                    x.length,
                    y.length
                );

            for (let i = 0; i < length; i++) {

                rows.push({
                    series:
                        trace.name || "Series",

                    x:
                        x[i] !== undefined
                            ? x[i]
                            : "",

                    y:
                        y[i] !== undefined
                            ? y[i]
                            : ""
                });

            }
        });

        if (!rows.length) {
            return;
        }

        const header =
            "Series,X,Y\n";

        const body = rows
            .map(row =>
                `"${String(row.series).replace(/"/g, '""')}",` +
                `"${String(row.x).replace(/"/g, '""')}",` +
                `"${String(row.y).replace(/"/g, '""')}"`
            )
            .join("\n");

        const blob = new Blob(
            [header + body],
            {
                type: "text/csv;charset=utf-8;"
            }
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

    // ========================================================
    // Public API
    // ========================================================

    return {

        create,

        bar,
        line,
        area,

        pie,
        doughnut,

        scatter,
        histogram,
        box,

        multiple,

        update,
        addTrace,
        removeTrace,

        resize,
        clear,

        downloadPNG,
        downloadSVG,
        exportCSV
    };

})();

// ============================================================
// Global Access
// ============================================================

window.VelocityPlotly = VelocityPlotly;
