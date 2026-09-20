// ============================================================
// Velocity BI - Bootstrap Helper Library
// File: frontend/lib/bootstrap.js
// Description: Bootstrap initialization and UI utilities
// ============================================================

"use strict";

const VelocityBootstrap = (() => {

    // ========================================================
    // Configuration
    // ========================================================

    const config = {
        enableTooltips: true,
        enablePopovers: true,
        enableToasts: true,
        enableDropdowns: true,
        enableModals: true,
        enableOffcanvas: true
    };

    // ========================================================
    // Check Bootstrap
    // ========================================================

    function isLoaded() {
        if (typeof bootstrap === "undefined") {
            console.error(
                "Velocity BI: Bootstrap is not loaded. " +
                "Load Bootstrap before bootstrap.js."
            );

            return false;
        }

        return true;
    }

    // ========================================================
    // DOM Ready
    // ========================================================

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                callback
            );
        } else {
            callback();
        }
    }

    // ========================================================
    // Initialize Tooltips
    // ========================================================

    function initTooltips() {

        if (!isLoaded() || !config.enableTooltips) {
            return;
        }

        const elements =
            document.querySelectorAll(
                '[data-bs-toggle="tooltip"]'
            );

        elements.forEach(element => {

            bootstrap.Tooltip.getOrCreateInstance(
                element
            );

        });
    }

    // ========================================================
    // Initialize Popovers
    // ========================================================

    function initPopovers() {

        if (!isLoaded() || !config.enablePopovers) {
            return;
        }

        const elements =
            document.querySelectorAll(
                '[data-bs-toggle="popover"]'
            );

        elements.forEach(element => {

            bootstrap.Popover.getOrCreateInstance(
                element
            );

        });
    }

    // ========================================================
    // Initialize Dropdowns
    // ========================================================

    function initDropdowns() {

        if (!isLoaded() || !config.enableDropdowns) {
            return;
        }

        const elements =
            document.querySelectorAll(
                '[data-bs-toggle="dropdown"]'
            );

        elements.forEach(element => {

            bootstrap.Dropdown.getOrCreateInstance(
                element
            );

        });
    }

    // ========================================================
    // Initialize Modals
    // ========================================================

    function initModals() {

        if (!isLoaded() || !config.enableModals) {
            return;
        }

        const elements =
            document.querySelectorAll(".modal");

        elements.forEach(element => {

            bootstrap.Modal.getOrCreateInstance(
                element
            );

        });
    }

    // ========================================================
    // Initialize Offcanvas
    // ========================================================

    function initOffcanvas() {

        if (!isLoaded() || !config.enableOffcanvas) {
            return;
        }

        const elements =
            document.querySelectorAll(
                ".offcanvas"
            );

        elements.forEach(element => {

            bootstrap.Offcanvas.getOrCreateInstance(
                element
            );

        });
    }

    // ========================================================
    // Initialize Toasts
    // ========================================================

    function initToasts() {

        if (!isLoaded() || !config.enableToasts) {
            return;
        }

        const elements =
            document.querySelectorAll(
                ".toast"
            );

        elements.forEach(element => {

            bootstrap.Toast.getOrCreateInstance(
                element,
                {
                    autohide: true,
                    delay: 4000
                }
            );

        });
    }

    // ========================================================
    // Initialize All Components
    // ========================================================

    function init() {

        if (!isLoaded()) {
            return;
        }

        initTooltips();
        initPopovers();
        initDropdowns();
        initModals();
        initOffcanvas();
        initToasts();

        console.log(
            "Velocity BI: Bootstrap initialized."
        );
    }

    // ========================================================
    // Show Modal
    // ========================================================

    function showModal(id) {

        if (!isLoaded()) {
            return null;
        }

        const element =
            document.getElementById(id);

        if (!element) {
            console.warn(
                `Velocity BI: Modal #${id} not found.`
            );

            return null;
        }

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                element
            );

        modal.show();

        return modal;
    }

    // ========================================================
    // Hide Modal
    // ========================================================

    function hideModal(id) {

        if (!isLoaded()) {
            return;
        }

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        const modal =
            bootstrap.Modal.getInstance(
                element
            );

        if (modal) {
            modal.hide();
        }
    }

    // ========================================================
    // Toggle Modal
    // ========================================================

    function toggleModal(id) {

        if (!isLoaded()) {
            return null;
        }

        const element =
            document.getElementById(id);

        if (!element) {
            return null;
        }

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                element
            );

        modal.toggle();

        return modal;
    }

    // ========================================================
    // Show Toast
    // ========================================================

    function showToast(
        message,
        type = "success",
        duration = 4000
    ) {

        if (!isLoaded()) {
            return null;
        }

        let container =
            document.getElementById(
                "velocity-toast-container"
            );

        // Create toast container
        if (!container) {

            container =
                document.createElement("div");

            container.id =
                "velocity-toast-container";

            container.className =
                "toast-container position-fixed " +
                "top-0 end-0 p-3";

            container.style.zIndex = "1090";

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement("div");

        toast.className =
            "toast align-items-center " +
            "border-0";

        toast.setAttribute(
            "role",
            "alert"
        );

        toast.setAttribute(
            "aria-live",
            "assertive"
        );

        toast.setAttribute(
            "aria-atomic",
            "true"
        );

        // Header color
        const colorMap = {
            success: "text-bg-success",
            danger: "text-bg-danger",
            warning: "text-bg-warning",
            info: "text-bg-info",
            primary: "text-bg-primary",
            secondary: "text-bg-secondary"
        };

        toast.classList.add(
            colorMap[type] ||
            colorMap.primary
        );

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${escapeHTML(message)}
                </div>

                <button
                    type="button"
                    class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast"
                    aria-label="Close">
                </button>
            </div>
        `;

        container.appendChild(toast);

        const instance =
            bootstrap.Toast.getOrCreateInstance(
                toast,
                {
                    delay: duration,
                    autohide: true
                }
            );

        toast.addEventListener(
            "hidden.bs.toast",
            () => {
                toast.remove();
            }
        );

        instance.show();

        return instance;
    }

    // ========================================================
    // Escape HTML
    // ========================================================

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value);

        return div.innerHTML;
    }

    // ========================================================
    // Show Alert
    // ========================================================

    function showAlert(
        container,
        message,
        type = "info",
        dismissible = true
    ) {

        const target =
            typeof container === "string"
                ? document.querySelector(container)
                : container;

        if (!target) {
            console.warn(
                "Velocity BI: Alert container not found."
            );

            return null;
        }

        const alert =
            document.createElement("div");

        alert.className =
            `alert alert-${type} ${
                dismissible
                    ? "alert-dismissible fade show"
                    : ""
            }`;

        alert.setAttribute(
            "role",
            "alert"
        );

        alert.innerHTML = `
            ${escapeHTML(message)}

            ${
                dismissible
                    ? `
                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close">
                        </button>
                    `
                    : ""
            }
        `;

        target.appendChild(alert);

        return alert;
    }

    // ========================================================
    // Hide Element
    // ========================================================

    function hide(element) {

        const target =
            typeof element === "string"
                ? document.querySelector(element)
                : element;

        if (target) {
            target.classList.add("d-none");
        }
    }

    // ========================================================
    // Show Element
    // ========================================================

    function show(element) {

        const target =
            typeof element === "string"
                ? document.querySelector(element)
                : element;

        if (target) {
            target.classList.remove("d-none");
        }
    }

    // ========================================================
    // Toggle Element
    // ========================================================

    function toggle(element) {

        const target =
            typeof element === "string"
                ? document.querySelector(element)
                : element;

        if (target) {
            target.classList.toggle("d-none");
        }
    }

    // ========================================================
    // Toggle Sidebar
    // ========================================================

    function toggleSidebar(
        sidebarId = "sidebar"
    ) {

        const sidebar =
            document.getElementById(
                sidebarId
            );

        if (!sidebar) {
            console.warn(
                `Velocity BI: Sidebar #${sidebarId} not found.`
            );

            return;
        }

        sidebar.classList.toggle(
            "show"
        );

        document.body.classList.toggle(
            "sidebar-open"
        );
    }

    // ========================================================
    // Close Sidebar
    // ========================================================

    function closeSidebar(
        sidebarId = "sidebar"
    ) {

        const sidebar =
            document.getElementById(
                sidebarId
            );

        if (sidebar) {
            sidebar.classList.remove(
                "show"
            );
        }

        document.body.classList.remove(
            "sidebar-open"
        );
    }

    // ========================================================
    // Confirm Dialog
    // ========================================================

    function confirmAction(
        message = "Are you sure?"
    ) {

        return window.confirm(
            message
        );
    }

    // ========================================================
    // Loading Button
    // ========================================================

    function setButtonLoading(
        button,
        loading = true,
        text = "Loading..."
    ) {

        const element =
            typeof button === "string"
                ? document.querySelector(button)
                : button;

        if (!element) {
            return;
        }

        if (loading) {

            if (!element.dataset.originalText) {
                element.dataset.originalText =
                    element.innerHTML;
            }

            element.disabled = true;

            element.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true">
                </span>

                ${escapeHTML(text)}
            `;

        } else {

            element.disabled = false;

            if (element.dataset.originalText) {

                element.innerHTML =
                    element.dataset.originalText;

                delete element.dataset.originalText;
            }
        }
    }

    // ========================================================
    // Initialize on DOM Ready
    // ========================================================

    ready(() => {
        init();
    });

    // ========================================================
    // Public API
    // ========================================================

    return {

        init,

        initTooltips,
        initPopovers,
        initDropdowns,
        initModals,
        initOffcanvas,
        initToasts,

        showModal,
        hideModal,
        toggleModal,

        showToast,
        showAlert,

        hide,
        show,
        toggle,

        toggleSidebar,
        closeSidebar,

        confirmAction,
        setButtonLoading
    };

})();

// ============================================================
// Global Access
// ============================================================

window.VelocityBootstrap = VelocityBootstrap;
