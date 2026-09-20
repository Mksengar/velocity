// ==========================================
// Velocity BI - Modal Manager
// File: frontend/js/modal.js
// ==========================================

(function () {
    "use strict";

    // ==========================================
    // Modal Manager
    // ==========================================

    const Modal = {

        // --------------------------------------
        // Open Modal
        // --------------------------------------

        open(modalId) {
            const modal = document.getElementById(modalId);

            if (!modal) {
                console.warn(`Modal not found: ${modalId}`);
                return;
            }

            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");

            // Prevent background scrolling
            document.body.classList.add("modal-open");

            // Focus first available input/button
            setTimeout(() => {
                const focusable = modal.querySelector(
                    "input, textarea, select, button"
                );

                if (focusable) {
                    focusable.focus();
                }
            }, 50);
        },


        // --------------------------------------
        // Close Modal
        // --------------------------------------

        close(modalId) {
            const modal = document.getElementById(modalId);

            if (!modal) {
                return;
            }

            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");

            // Restore scrolling if no modal is open
            const activeModal = document.querySelector(
                ".modal.active"
            );

            if (!activeModal) {
                document.body.classList.remove("modal-open");
            }
        },


        // --------------------------------------
        // Close All Modals
        // --------------------------------------

        closeAll() {
            const modals = document.querySelectorAll(".modal");

            modals.forEach(modal => {
                modal.classList.remove("active");
                modal.setAttribute("aria-hidden", "true");
            });

            document.body.classList.remove("modal-open");
        },


        // --------------------------------------
        // Toggle Modal
        // --------------------------------------

        toggle(modalId) {
            const modal = document.getElementById(modalId);

            if (!modal) {
                console.warn(`Modal not found: ${modalId}`);
                return;
            }

            if (modal.classList.contains("active")) {
                this.close(modalId);
            } else {
                this.open(modalId);
            }
        },


        // --------------------------------------
        // Create Confirmation Modal
        // --------------------------------------

        confirm(options = {}) {

            const {
                title = "Confirm Action",
                message = "Are you sure you want to continue?",
                confirmText = "Confirm",
                cancelText = "Cancel",
                onConfirm = null,
                onCancel = null
            } = options;


            // Remove old temporary modal
            const oldModal =
                document.getElementById("velocityConfirmModal");

            if (oldModal) {
                oldModal.remove();
            }


            // Create modal
            const modal = document.createElement("div");

            modal.id = "velocityConfirmModal";

            modal.className = "modal velocity-confirm-modal";

            modal.setAttribute("aria-hidden", "true");

            modal.innerHTML = `
                <div class="modal-overlay"></div>

                <div class="modal-container">

                    <div class="modal-header">

                        <h3>${this.escapeHTML(title)}</h3>

                        <button
                            type="button"
                            class="modal-close"
                            data-modal-close
                            aria-label="Close modal">
                            &times;
                        </button>

                    </div>

                    <div class="modal-body">

                        <p>
                            ${this.escapeHTML(message)}
                        </p>

                    </div>

                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            id="modalCancelBtn">
                            ${this.escapeHTML(cancelText)}
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary"
                            id="modalConfirmBtn">
                            ${this.escapeHTML(confirmText)}
                        </button>

                    </div>

                </div>
            `;


            document.body.appendChild(modal);


            // Cancel button
            const cancelBtn =
                modal.querySelector("#modalCancelBtn");

            cancelBtn.addEventListener("click", () => {

                if (typeof onCancel === "function") {
                    onCancel();
                }

                this.close("velocityConfirmModal");

                setTimeout(() => {
                    modal.remove();
                }, 200);
            });


            // Confirm button
            const confirmBtn =
                modal.querySelector("#modalConfirmBtn");

            confirmBtn.addEventListener("click", () => {

                if (typeof onConfirm === "function") {
                    onConfirm();
                }

                this.close("velocityConfirmModal");

                setTimeout(() => {
                    modal.remove();
                }, 200);
            });


            this.open("velocityConfirmModal");
        },


        // --------------------------------------
        // Alert Modal
        // --------------------------------------

        alert(message, title = "Velocity BI") {

            const oldModal =
                document.getElementById("velocityAlertModal");

            if (oldModal) {
                oldModal.remove();
            }


            const modal = document.createElement("div");

            modal.id = "velocityAlertModal";

            modal.className = "modal velocity-alert-modal";

            modal.setAttribute("aria-hidden", "true");


            modal.innerHTML = `
                <div class="modal-overlay"></div>

                <div class="modal-container">

                    <div class="modal-header">

                        <h3>
                            ${this.escapeHTML(title)}
                        </h3>

                        <button
                            type="button"
                            class="modal-close"
                            data-modal-close
                            aria-label="Close modal">
                            &times;
                        </button>

                    </div>

                    <div class="modal-body">

                        <p>
                            ${this.escapeHTML(message)}
                        </p>

                    </div>

                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-modal-close>
                            OK
                        </button>

                    </div>

                </div>
            `;


            document.body.appendChild(modal);

            this.open("velocityAlertModal");
        },


        // --------------------------------------
        // Escape HTML
        // --------------------------------------

        escapeHTML(value) {

            const div = document.createElement("div");

            div.textContent = value;

            return div.innerHTML;
        },


        // --------------------------------------
        // Initialize Modals
        // --------------------------------------

        init() {

            // Open modal buttons
            document.addEventListener("click", (event) => {

                const openButton =
                    event.target.closest("[data-modal-open]");

                if (openButton) {

                    const modalId =
                        openButton.getAttribute("data-modal-open");

                    this.open(modalId);

                    return;
                }


                // Close modal buttons
                const closeButton =
                    event.target.closest("[data-modal-close]");

                if (closeButton) {

                    const modal =
                        closeButton.closest(".modal");

                    if (modal) {
                        this.close(modal.id);
                    }

                    return;
                }


                // Backdrop click
                const modal =
                    event.target.closest(".modal");

                if (
                    modal &&
                    event.target.classList.contains("modal-overlay")
                ) {
                    this.close(modal.id);
                }
            });


            // ESC key
            document.addEventListener("keydown", (event) => {

                if (event.key !== "Escape") {
                    return;
                }

                const activeModal =
                    document.querySelector(".modal.active");

                if (activeModal) {
                    this.close(activeModal.id);
                }
            });


            // Set initial ARIA state
            document.querySelectorAll(".modal").forEach(modal => {

                if (!modal.hasAttribute("aria-hidden")) {
                    modal.setAttribute(
                        "aria-hidden",
                        "true"
                    );
                }
            });
        }
    };


    // ==========================================
    // Make Modal Globally Available
    // ==========================================

    window.Modal = Modal;


    // ==========================================
    // Initialize
    // ==========================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            () => Modal.init()
        );

    } else {

        Modal.init();

    }

})();