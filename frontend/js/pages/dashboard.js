// ==========================================
// Velocity BI - Dashboard JavaScript
// File: frontend/js/dashboard.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // Configuration
    // ==========================================

    const API_BASE_URL = "http://127.0.0.1:5000/api";

    const TOKEN_KEY = "velocity_bi_token";
    const USER_KEY = "velocity_bi_user";


    // ==========================================
    // DOM Helpers
    // ==========================================

    function getElement(id) {
        return document.getElementById(id);
    }


    // ==========================================
    // DOM Elements
    // ==========================================

    const userName =
        getElement("userName");

    const userEmail =
        getElement("userEmail");

    const userAvatar =
        getElement("userAvatar");

    const totalDatasets =
        getElement("totalDatasets");

    const totalReports =
        getElement("totalReports");

    const totalCharts =
        getElement("totalCharts");

    const totalAnalyses =
        getElement("totalAnalyses");

    const recentDatasets =
        getElement("recentDatasets");

    const logoutButton =
        getElement("logoutButton");

    const sidebarToggle =
        getElement("sidebarToggle");

    const sidebar =
        getElement("sidebar");

    const pageLoader =
        getElement("pageLoader");


    // ==========================================
    // Safe Storage Functions
    // ==========================================

    function getStorageItem(key) {

        try {
            return localStorage.getItem(key);
        } catch (error) {

            console.warn(
                "Unable to access localStorage:",
                error
            );

            return null;
        }
    }


    function setStorageItem(key, value) {

        try {
            localStorage.setItem(
                key,
                value
            );

            return true;

        } catch (error) {

            console.warn(
                "Unable to save data:",
                error
            );

            return false;
        }
    }


    function removeStorageItem(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            console.warn(
                "Unable to remove storage item:",
                error
            );
        }
    }


    // ==========================================
    // Get Authentication Token
    // ==========================================

    function getToken() {

        return getStorageItem(
            TOKEN_KEY
        );
    }


    // ==========================================
    // Get Saved User
    // ==========================================

    function getSavedUser() {

        const userData =
            getStorageItem(USER_KEY);

        if (!userData) {
            return null;
        }

        try {

            return JSON.parse(userData);

        } catch (error) {

            console.warn(
                "Invalid saved user data."
            );

            return null;
        }
    }


    // ==========================================
    // Authentication Check
    // ==========================================

    function checkAuthentication() {

        const token =
            getToken();

        if (!token) {

            window.location.href =
                "login.html";

            return false;
        }

        return true;
    }


    // ==========================================
    // Display User Information
    // ==========================================

    function displayUser(user) {

        if (!user) {
            return;
        }


        const name =
            user.name ||
            user.full_name ||
            "Velocity User";


        const email =
            user.email ||
            "";


        if (userName) {
            userName.textContent =
                name;
        }


        if (userEmail) {
            userEmail.textContent =
                email;
        }


        if (userAvatar) {

            const firstLetter =
                name
                    .charAt(0)
                    .toUpperCase();

            userAvatar.textContent =
                firstLetter;
        }
    }


    // ==========================================
    // API Request Helper
    // ==========================================

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const token =
            getToken();


        const headers = {
            "Content-Type":
                "application/json",

            ...(options.headers || {})
        };


        if (token) {

            headers[
                "Authorization"
            ] = `Bearer ${token}`;
        }


        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers: headers
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logout();

            throw new Error(
                "Your session has expired."
            );
        }


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Request failed."
            );
        }


        return data;
    }


    // ==========================================
    // Load Dashboard Data
    // ==========================================

    async function loadDashboardData() {

        try {

            /*
             * Expected backend endpoint:
             *
             * GET /api/dashboard
             */

            const data =
                await apiRequest(
                    "/dashboard/overview"
                );


            updateDashboardStats(
                data
            );


            if (data.datasets) {

                displayRecentDatasets(
                    data.datasets
                );
            }


        } catch (error) {

            console.warn(
                "Dashboard API error:",
                error.message
            );

            /*
             * If backend endpoint is not
             * available yet, display default
             * values instead of breaking UI.
             */

            updateDashboardStats({
                total_datasets: 0,
                total_reports: 0,
                total_charts: 0,
                total_analyses: 0
            });
        }
    }


    // ==========================================
    // Update Dashboard Statistics
    // ==========================================

    function updateDashboardStats(data) {

        if (totalDatasets) {

            totalDatasets.textContent =
                data.total_datasets ??
                data.datasets_count ??
                0;
        }


        if (totalReports) {

            totalReports.textContent =
                data.total_reports ??
                data.reports_count ??
                0;
        }


        if (totalCharts) {

            totalCharts.textContent =
                data.total_charts ??
                data.charts_count ??
                0;
        }


        if (totalAnalyses) {

            totalAnalyses.textContent =
                data.total_analyses ??
                data.analyses_count ??
                0;
        }
    }


    // ==========================================
    // Display Recent Datasets
    // ==========================================

    function displayRecentDatasets(
        datasets
    ) {

        if (!recentDatasets) {
            return;
        }


        recentDatasets.innerHTML = "";


        if (
            !Array.isArray(datasets) ||
            datasets.length === 0
        ) {

            recentDatasets.innerHTML = `
                <div class="empty-state">
                    <p>No datasets uploaded yet.</p>
                    <a href="dataset-upload.html">
                        Upload Dataset
                    </a>
                </div>
            `;

            return;
        }


        datasets
            .slice(0, 5)
            .forEach((dataset) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "dataset-item";


                const name =
                    dataset.name ||
                    dataset.filename ||
                    "Unnamed Dataset";


                const type =
                    dataset.type ||
                    dataset.file_type ||
                    "Dataset";


                const date =
                    dataset.created_at ||
                    dataset.uploaded_at ||
                    "";


                item.innerHTML = `
                    <div class="dataset-info">
                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${escapeHTML(type)}
                        </span>
                    </div>

                    <div class="dataset-date">
                        ${escapeHTML(date)}
                    </div>
                `;


                recentDatasets.appendChild(
                    item
                );
            });
    }


    // ==========================================
    // HTML Escape
    // ==========================================

    function escapeHTML(value) {

        if (value === null ||
            value === undefined) {

            return "";
        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ==========================================
    // Logout
    // ==========================================

    function logout() {

        removeStorageItem(
            TOKEN_KEY
        );

        removeStorageItem(
            USER_KEY
        );


        window.location.href =
            "login.html";
    }


    // ==========================================
    // Logout Button
    // ==========================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                logout();
            }
        );
    }


    // ==========================================
    // Sidebar Toggle
    // ==========================================

    if (
        sidebarToggle &&
        sidebar
    ) {

        sidebarToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "active"
                );
            }
        );
    }


    // ==========================================
    // Close Sidebar When Link Is Clicked
    // ==========================================

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll(
                "a"
            );


        sidebarLinks.forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList.remove(
                            "active"
                        );
                    }
                );
            }
        );
    }


    // ==========================================
    // Navigation Helpers
    // ==========================================

    function setupNavigation() {

        const navigationButtons =
            document.querySelectorAll(
                "[data-page]"
            );


        navigationButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;


                        if (page) {

                            window.location.href =
                                page;
                        }
                    }
                );
            }
        );
    }


    // ==========================================
    // Quick Action Buttons
    // ==========================================

    function setupQuickActions() {

        const uploadButton =
            getElement(
                "uploadDatasetButton"
            );

        const reportButton =
            getElement(
                "createReportButton"
            );

        const analysisButton =
            getElement(
                "analysisButton"
            );

        const visualizationButton =
            getElement(
                "visualizationButton"
            );


        if (uploadButton) {

            uploadButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dataset-upload.html";
                }
            );
        }


        if (reportButton) {

            reportButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dashboard-builder.html";
                }
            );
        }


        if (analysisButton) {

            analysisButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "eda.html";
                }
            );
        }


        if (visualizationButton) {

            visualizationButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "visualization.html";
                }
            );
        }
    }


    // ==========================================
    // Set Active Navigation
    // ==========================================

    function setActiveNavigation() {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();


        const links =
            document.querySelectorAll(
                ".sidebar a"
            );


        links.forEach(
            (link) => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    href === currentPage
                ) {

                    link.classList.add(
                        "active"
                    );

                } else {

                    link.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    // ==========================================
    // Hide Loader
    // ==========================================

    function hideLoader() {

        if (!pageLoader) {
            return;
        }


        pageLoader.classList.add(
            "hidden"
        );


        setTimeout(() => {

            pageLoader.style.display =
                "none";

        }, 300);
    }


    // ==========================================
    // Initialize Dashboard
    // ==========================================

    async function initializeDashboard() {

        // Check login
        if (!checkAuthentication()) {
            return;
        }


        // Display saved user
        const user =
            getSavedUser();


        if (user) {

            displayUser(
                user
            );
        }


        // Setup UI
        setupNavigation();

        setupQuickActions();

        setActiveNavigation();


        // Load backend data
        await loadDashboardData();


        // Hide loader
        hideLoader();
    }


    // ==========================================
    // Start Dashboard
    // ==========================================

    initializeDashboard();

});