// ==========================================
// Velocity BI - Navbar Manager
// File: frontend/js/navbar.js
// ==========================================

(function () {
    "use strict";

    const Navbar = {

        navbar: null,
        menuButton: null,
        mobileMenu: null,
        userButton: null,
        userDropdown: null,
        notificationButton: null,
        notificationPanel: null,
        searchInput: null,

        // ==========================================
        // Initialize
        // ==========================================

        init() {

            this.navbar =
                document.querySelector(".navbar");

            if (!this.navbar) {
                console.warn("Velocity BI: Navbar not found.");
                return;
            }

            this.menuButton =
                document.querySelector("[data-navbar-toggle]");

            this.mobileMenu =
                document.querySelector("[data-navbar-menu]");

            this.userButton =
                document.querySelector("[data-user-menu]");

            this.userDropdown =
                document.querySelector("[data-user-dropdown]");

            this.notificationButton =
                document.querySelector("[data-notification-toggle]");

            this.notificationPanel =
                document.querySelector("[data-notification-panel]");

            this.searchInput =
                document.querySelector("[data-navbar-search]");


            this.setupEvents();
            this.setActiveLink();
            this.loadUserData();

        },


        // ==========================================
        // Setup Events
        // ==========================================

        setupEvents() {

            // Mobile menu
            if (this.menuButton) {

                this.menuButton.addEventListener(
                    "click",
                    () => this.toggleMobileMenu()
                );

            }


            // User dropdown
            if (this.userButton) {

                this.userButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        this.toggleUserDropdown();

                    }
                );

            }


            // Notifications
            if (this.notificationButton) {

                this.notificationButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        this.toggleNotifications();

                    }
                );

            }


            // Search
            if (this.searchInput) {

                this.searchInput.addEventListener(
                    "input",
                    event => {

                        this.handleSearch(
                            event.target.value
                        );

                    }
                );


                this.searchInput.addEventListener(
                    "keydown",
                    event => {

                        if (event.key === "Enter") {

                            this.submitSearch(
                                event.target.value
                            );

                        }

                    }
                );

            }


            // Global click
            document.addEventListener(
                "click",
                event => {

                    this.handleOutsideClick(event);

                }
            );


            // Escape key
            document.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Escape") {

                        this.closeAllMenus();

                    }

                }
            );


            // Logout
            document.addEventListener(
                "click",
                event => {

                    const logoutButton =
                        event.target.closest(
                            "[data-logout]"
                        );

                    if (logoutButton) {

                        event.preventDefault();

                        this.logout();

                    }

                }
            );


            // Window resize
            window.addEventListener(
                "resize",
                () => {

                    if (window.innerWidth > 768) {

                        this.closeMobileMenu();

                    }

                }
            );

        },


        // ==========================================
        // Mobile Menu
        // ==========================================

        toggleMobileMenu() {

            if (!this.mobileMenu) {
                return;
            }

            const isOpen =
                this.mobileMenu.classList.toggle(
                    "active"
                );


            if (this.menuButton) {

                this.menuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }

        },


        closeMobileMenu() {

            if (!this.mobileMenu) {
                return;
            }

            this.mobileMenu.classList.remove(
                "active"
            );


            if (this.menuButton) {

                this.menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        },


        // ==========================================
        // User Dropdown
        // ==========================================

        toggleUserDropdown() {

            if (!this.userDropdown) {
                return;
            }


            const isOpen =
                this.userDropdown.classList.toggle(
                    "active"
                );


            if (this.userButton) {

                this.userButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }


            // Close notification panel
            if (this.notificationPanel) {

                this.notificationPanel.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Notifications
        // ==========================================

        toggleNotifications() {

            if (!this.notificationPanel) {
                return;
            }


            const isOpen =
                this.notificationPanel.classList.toggle(
                    "active"
                );


            if (this.notificationButton) {

                this.notificationButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }


            // Close user dropdown
            if (this.userDropdown) {

                this.userDropdown.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Close All Menus
        // ==========================================

        closeAllMenus() {

            this.closeMobileMenu();


            if (this.userDropdown) {

                this.userDropdown.classList.remove(
                    "active"
                );

            }


            if (this.notificationPanel) {

                this.notificationPanel.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Outside Click
        // ==========================================

        handleOutsideClick(event) {

            if (
                this.userDropdown &&
                this.userButton &&
                !this.userDropdown.contains(event.target) &&
                !this.userButton.contains(event.target)
            ) {

                this.userDropdown.classList.remove(
                    "active"
                );

            }


            if (
                this.notificationPanel &&
                this.notificationButton &&
                !this.notificationPanel.contains(event.target) &&
                !this.notificationButton.contains(event.target)
            ) {

                this.notificationPanel.classList.remove(
                    "active"
                );

            }

        },


        // ==========================================
        // Active Navbar Link
        // ==========================================

        setActiveLink() {

            const currentPage =
                window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();


            const links =
                this.navbar.querySelectorAll(
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
        // Search
        // ==========================================

        handleSearch(query) {

            const searchText =
                query.trim().toLowerCase();


            if (!searchText) {
                return;
            }


            // Search elements on current page
            const searchableElements =
                document.querySelectorAll(
                    "[data-searchable]"
                );


            searchableElements.forEach(element => {

                const text =
                    element.textContent
                        .toLowerCase();


                if (
                    text.includes(searchText)
                ) {

                    element.style.display = "";

                } else {

                    element.style.display = "none";

                }

            });

        },


        // ==========================================
        // Submit Search
        // ==========================================

        submitSearch(query) {

            const searchText =
                query.trim();


            if (!searchText) {
                return;
            }


            console.log(
                "Velocity BI Search:",
                searchText
            );


            // Optional:
            // Redirect to a dedicated search page
            //
            // window.location.href =
            //     `search.html?q=${encodeURIComponent(searchText)}`;

        },


        // ==========================================
        // Load User Data
        // ==========================================

        loadUserData() {

            try {

                const userData =
                    localStorage.getItem(
                        "velocityBI_user"
                    );


                if (!userData) {
                    return;
                }


                const user =
                    JSON.parse(userData);


                const name =
                    user.name ||
                    user.username ||
                    "User";


                const email =
                    user.email ||
                    "";


                const nameElements =
                    document.querySelectorAll(
                        "[data-user-name]"
                    );


                nameElements.forEach(element => {

                    element.textContent = name;

                });


                const emailElements =
                    document.querySelectorAll(
                        "[data-user-email]"
                    );


                emailElements.forEach(element => {

                    element.textContent = email;

                });

            } catch (error) {

                console.warn(
                    "Unable to load user data.",
                    error
                );

            }

        },


        // ==========================================
        // Update Notification Count
        // ==========================================

        updateNotificationCount(count) {

            const badge =
                document.querySelector(
                    "[data-notification-count]"
                );


            if (!badge) {
                return;
            }


            const number =
                Number(count) || 0;


            if (number > 0) {

                badge.textContent =
                    number > 99 ? "99+" : number;

                badge.classList.add("active");

            } else {

                badge.textContent = "";

                badge.classList.remove("active");

            }

        },


        // ==========================================
        // Logout
        // ==========================================

        logout() {

            const confirmed =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            // Clear authentication data
            try {

                localStorage.removeItem(
                    "velocityBI_user"
                );

                localStorage.removeItem(
                    "velocityBI_token"
                );

                sessionStorage.removeItem(
                    "velocityBI_user"
                );

                sessionStorage.removeItem(
                    "velocityBI_token"
                );

            } catch (error) {

                console.warn(
                    "Unable to clear authentication data.",
                    error
                );

            }


            // Redirect
            window.location.href =
                "login.html";

        },


        // ==========================================
        // Refresh Navbar
        // ==========================================

        refresh() {

            this.setActiveLink();
            this.loadUserData();

        }

    };


    // ==========================================
    // Global Access
    // ==========================================

    window.Navbar = Navbar;


    // ==========================================
    // Initialize
    // ==========================================

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => Navbar.init()
        );

    } else {

        Navbar.init();

    }

})();