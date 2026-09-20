// ==========================================
// Velocity BI - Sidebar Manager
// File: frontend/js/sidebar.js
// ==========================================

(function () {
    "use strict";

    // ==========================================
    // Sidebar Configuration
    // ==========================================

    const Sidebar = {

        sidebar: null,
        overlay: null,
        toggleButton: null,
        collapseButton: null,

        // ==========================================
        // Initialize
        // ==========================================

        init() {

            this.sidebar =
                document.querySelector(".sidebar");

            this.overlay =
                document.querySelector(".sidebar-overlay");

            this.toggleButton =
                document.querySelector("[data-sidebar-toggle]");

            this.collapseButton =
                document.querySelector("[data-sidebar-collapse]");


            if (!this.sidebar) {
                console.warn("Velocity BI: Sidebar not found.");
                return;
            }


            this.setupEvents();
            this.restoreState();
            this.setActiveLink();
            this.setupDropdowns();

        },


        // ==========================================
        // Setup Events
        // ==========================================

        setupEvents() {

            // Sidebar toggle button
            if (this.toggleButton) {

                this.toggleButton.addEventListener(
                    "click",
                    () => this.toggle()
                );

            }


            // Collapse button
            if (this.collapseButton) {

                this.collapseButton.addEventListener(
                    "click",
                    () => this.toggleCollapse()
                );

            }


            // Overlay click
            if (this.overlay) {

                this.overlay.addEventListener(
                    "click",
                    () => this.close()
                );

            }


            // Navigation links
            const links =
                this.sidebar.querySelectorAll(
                    "a[href]"
                );

            links.forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        // Close mobile sidebar
                        if (this.isMobile()) {
                            this.close();
                        }

                    }
                );

            });


            // Keyboard support
            document.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Escape") {
                        this.close();
                    }

                }
            );


            // Window resize
            window.addEventListener(
                "resize",
                () => {

                    if (!this.isMobile()) {
                        this.removeMobileState();
                    }

                }
            );

        },


        // ==========================================
        // Open Sidebar
        // ==========================================

        open() {

            if (!this.sidebar) {
                return;
            }

            this.sidebar.classList.add(
                "sidebar-open"
            );

            document.body.classList.add(
                "sidebar-is-open"
            );


            if (this.overlay) {

                this.overlay.classList.add(
                    "active"
                );

            }

        },


        // ==========================================
        // Close Sidebar
        // ==========================================

        close() {

            if (!this.sidebar) {
                return;
            }

            this.sidebar.classList.remove(
                "sidebar-open"
            );

            document.body.classList.remove(
                "sidebar-is-open"
            );


            if (this.overlay) {

                this.overlay.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Toggle Sidebar
        // ==========================================

        toggle() {

            if (
                this.sidebar &&
                this.sidebar.classList.contains(
                    "sidebar-open"
                )
            ) {

                this.close();

            } else {

                this.open();

            }

        },


        // ==========================================
        // Collapse Sidebar
        // ==========================================

        toggleCollapse() {

            if (!this.sidebar) {
                return;
            }


            const collapsed =
                this.sidebar.classList.toggle(
                    "sidebar-collapsed"
                );


            // Save state
            this.saveState(collapsed);


            // Update button
            if (this.collapseButton) {

                this.collapseButton.setAttribute(
                    "aria-expanded",
                    String(!collapsed)
                );

            }

        },


        // ==========================================
        // Save Sidebar State
        // ==========================================

        saveState(collapsed) {

            try {

                localStorage.setItem(
                    "velocityBI_sidebar_collapsed",
                    collapsed ? "true" : "false"
                );

            } catch (error) {

                console.warn(
                    "Unable to save sidebar state.",
                    error
                );

            }

        },


        // ==========================================
        // Restore Sidebar State
        // ==========================================

        restoreState() {

            try {

                const state =
                    localStorage.getItem(
                        "velocityBI_sidebar_collapsed"
                    );


                if (
                    state === "true" &&
                    !this.isMobile()
                ) {

                    this.sidebar.classList.add(
                        "sidebar-collapsed"
                    );

                }

            } catch (error) {

                console.warn(
                    "Unable to restore sidebar state.",
                    error
                );

            }

        },


        // ==========================================
        // Active Navigation Link
        // ==========================================

        setActiveLink() {

            const currentPage =
                window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();


            const links =
                this.sidebar.querySelectorAll(
                    "a[href]"
                );


            links.forEach(link => {

                const href =
                    link.getAttribute("href");


                if (
                    !href ||
                    href === "#" ||
                    href.startsWith("javascript:")
                ) {
                    return;
                }


                const linkPage =
                    href
                        .split("/")
                        .pop()
                        .split("?")[0]
                        .split("#")[0]
                        .toLowerCase();


                if (
                    linkPage &&
                    linkPage === currentPage
                ) {

                    link.classList.add(
                        "active"
                    );

                    link.setAttribute(
                        "aria-current",
                        "page"
                    );

                } else {

                    link.classList.remove(
                        "active"
                    );

                    link.removeAttribute(
                        "aria-current"
                    );

                }

            });

        },


        // ==========================================
        // Dropdown Menus
        // ==========================================

        setupDropdowns() {

            const dropdownButtons =
                this.sidebar.querySelectorAll(
                    "[data-sidebar-dropdown]"
                );


            dropdownButtons.forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const dropdown =
                            button.closest(
                                ".sidebar-dropdown"
                            );


                        if (!dropdown) {
                            return;
                        }


                        const isOpen =
                            dropdown.classList.toggle(
                                "open"
                            );


                        button.setAttribute(
                            "aria-expanded",
                            String(isOpen)
                        );

                    }
                );

            });

        },


        // ==========================================
        // Mobile Detection
        // ==========================================

        isMobile() {

            return window.matchMedia(
                "(max-width: 768px)"
            ).matches;

        },


        // ==========================================
        // Remove Mobile State
        // ==========================================

        removeMobileState() {

            if (!this.sidebar) {
                return;
            }


            this.sidebar.classList.remove(
                "sidebar-open"
            );

            document.body.classList.remove(
                "sidebar-is-open"
            );


            if (this.overlay) {

                this.overlay.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Refresh Active Link
        // ==========================================

        refresh() {

            this.setActiveLink();

        }

    };


    // ==========================================
    // Global Access
    // ==========================================

    window.Sidebar = Sidebar;


    // ==========================================
    // Initialize
    // ==========================================

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => Sidebar.init()
        );

    } else {

        Sidebar.init();

    }

})();