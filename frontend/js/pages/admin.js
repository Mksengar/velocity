"use strict";

// ==========================================
// Velocity BI - Admin Management
// File: frontend/js/admin.js
// ==========================================

const ADMIN_CONFIG = {
    adminKey: "velocity_bi_admin",
    usersKey: "velocity_bi_users",
    datasetsKey: "velocity_bi_datasets",
    reportsKey: "velocity_bi_reports",
    activityKey: "velocity_bi_activity"
};


// ==========================================
// Safe Storage
// ==========================================

const AdminStorage = {

    isAvailable() {
        try {
            const key = "__velocity_admin_test__";

            localStorage.setItem(key, "1");
            localStorage.removeItem(key);

            return true;
        } catch (error) {
            console.warn("localStorage unavailable.");
            return false;
        }
    },

    get(key, defaultValue = null) {
        if (!this.isAvailable()) {
            return defaultValue;
        }

        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return defaultValue;
            }

            return JSON.parse(value);

        } catch (error) {
            console.error("Storage read error:", error);
            return defaultValue;
        }
    },

    set(key, value) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {
            console.error("Storage write error:", error);
            return false;
        }
    }
};


// ==========================================
// DOM Helpers
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}

function query(selector) {
    return document.querySelector(selector);
}


// ==========================================
// Admin State
// ==========================================

const AdminState = {

    admin: null,

    users: [],

    datasets: [],

    reports: [],

    activities: [],

    filteredUsers: [],

    searchTerm: "",

    userFilter: "all"

};


// ==========================================
// Admin Authentication
// ==========================================

function getAdmin() {

    return AdminStorage.get(
        ADMIN_CONFIG.adminKey,
        null
    );
}


function isAdminLoggedIn() {

    const admin =
        getAdmin();

    return !!(
        admin &&
        admin.loggedIn === true
    );
}


function requireAdmin() {

    if (!isAdminLoggedIn()) {

        showAdminNotification(
            "Admin authentication required.",
            "error"
        );

        setTimeout(() => {

            window.location.href =
                "admin-login.html";

        }, 1000);

        return false;
    }

    return true;
}


// ==========================================
// Admin Login
// ==========================================

function adminLogin(event) {

    if (event) {
        event.preventDefault();
    }

    const email =
        getElement("adminEmail")?.value.trim();

    const password =
        getElement("adminPassword")?.value;

    if (!email || !password) {

        showAdminNotification(
            "Enter admin email and password.",
            "error"
        );

        return false;
    }

    /*
     * Demo authentication.
     *
     * Replace this section with:
     * POST /api/admin/login
     *
     * when Flask backend is connected.
     */

    const admin = {

        id: "admin_001",

        name: "Velocity BI Admin",

        email: email,

        role: "Admin",

        loggedIn: true,

        loginTime:
            new Date().toISOString()
    };

    AdminStorage.set(
        ADMIN_CONFIG.adminKey,
        admin
    );

    logAdminActivity(
        "Admin Login",
        `Admin logged in: ${email}`
    );

    showAdminNotification(
        "Admin login successful.",
        "success"
    );

    setTimeout(() => {

        window.location.href =
            "admin-dashboard.html";

    }, 700);

    return true;
}


// ==========================================
// Admin Logout
// ==========================================

function adminLogout() {

    const admin =
        getAdmin();

    if (admin) {

        logAdminActivity(
            "Admin Logout",
            `Admin logged out: ${admin.email}`
        );

    }

    AdminStorage.set(
        ADMIN_CONFIG.adminKey,
        {
            loggedIn: false
        }
    );

    window.location.href =
        "admin-login.html";
}


// ==========================================
// Load Admin Data
// ==========================================

function loadAdminData() {

    AdminState.admin =
        getAdmin();

    AdminState.users =
        AdminStorage.get(
            ADMIN_CONFIG.usersKey,
            []
        );

    AdminState.datasets =
        AdminStorage.get(
            ADMIN_CONFIG.datasetsKey,
            []
        );

    AdminState.reports =
        AdminStorage.get(
            ADMIN_CONFIG.reportsKey,
            []
        );

    AdminState.activities =
        AdminStorage.get(
            ADMIN_CONFIG.activityKey,
            []
        );

    AdminState.filteredUsers =
        [...AdminState.users];
}


// ==========================================
// Dashboard Statistics
// ==========================================

function calculateAdminStats() {

    const totalUsers =
        AdminState.users.length;

    const activeUsers =
        AdminState.users.filter(
            user =>
                user.status === "active" ||
                user.status === "Active"
        ).length;

    const totalDatasets =
        AdminState.datasets.length;

    const totalReports =
        AdminState.reports.length;

    const pendingUsers =
        AdminState.users.filter(
            user =>
                user.status === "pending" ||
                user.status === "Pending"
        ).length;

    const blockedUsers =
        AdminState.users.filter(
            user =>
                user.status === "blocked" ||
                user.status === "Blocked"
        ).length;

    return {

        totalUsers,

        activeUsers,

        totalDatasets,

        totalReports,

        pendingUsers,

        blockedUsers

    };
}


// ==========================================
// Render Dashboard Statistics
// ==========================================

function renderAdminStats() {

    const stats =
        calculateAdminStats();

    setText(
        "totalUsers",
        stats.totalUsers
    );

    setText(
        "activeUsers",
        stats.activeUsers
    );

    setText(
        "totalDatasets",
        stats.totalDatasets
    );

    setText(
        "totalReports",
        stats.totalReports
    );

    setText(
        "pendingUsers",
        stats.pendingUsers
    );

    setText(
        "blockedUsers",
        stats.blockedUsers
    );
}


// ==========================================
// Safe Text
// ==========================================

function setText(id, value) {

    const element =
        getElement(id);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


// ==========================================
// Load Users
// ==========================================

function loadUsers() {

    AdminState.users =
        AdminStorage.get(
            ADMIN_CONFIG.usersKey,
            []
        );

    applyUserFilters();
}


// ==========================================
// Search Users
// ==========================================

function searchUsers(searchTerm) {

    AdminState.searchTerm =
        String(searchTerm || "")
            .trim()
            .toLowerCase();

    applyUserFilters();
}


// ==========================================
// Filter Users
// ==========================================

function filterUsers(status) {

    AdminState.userFilter =
        status || "all";

    applyUserFilters();
}


// ==========================================
// Apply User Filters
// ==========================================

function applyUserFilters() {

    let users =
        [...AdminState.users];

    const search =
        AdminState.searchTerm;

    const filter =
        AdminState.userFilter;

    if (search) {

        users =
            users.filter(user => {

                return (

                    String(user.name || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(user.email || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(user.username || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(user.role || "")
                        .toLowerCase()
                        .includes(search)
                );

            });
    }


    if (filter !== "all") {

        users =
            users.filter(
                user =>
                    String(user.status || "")
                        .toLowerCase() ===
                    filter.toLowerCase()
            );
    }


    AdminState.filteredUsers =
        users;

    renderUsers(users);
}


// ==========================================
// Render Users
// ==========================================

function renderUsers(users) {

    const container =
        getElement("usersContainer") ||
        getElement("usersTableBody") ||
        query(".users-table tbody");

    if (!container) {
        return;
    }


    if (!users.length) {

        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        No users found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    const isTable =
        container.tagName === "TBODY";


    if (isTable) {

        container.innerHTML =
            users.map(user =>
                createUserTableRow(user)
            ).join("");

    } else {

        container.innerHTML =
            users.map(user =>
                createUserCard(user)
            ).join("");
    }
}


// ==========================================
// User Table Row
// ==========================================

function createUserTableRow(user) {

    const status =
        String(user.status || "active")
            .toLowerCase();

    return `
        <tr data-user-id="${escapeHTML(user.id)}">

            <td>
                ${escapeHTML(
                    user.name || "Unknown"
                )}
            </td>

            <td>
                ${escapeHTML(
                    user.email || "N/A"
                )}
            </td>

            <td>
                ${escapeHTML(
                    user.role || "User"
                )}
            </td>

            <td>
                <span class="status ${status}">
                    ${escapeHTML(
                        user.status || "Active"
                    )}
                </span>
            </td>

            <td>
                ${formatDate(user.createdAt)}
            </td>

            <td>

                <button
                    onclick="viewUser('${escapeHTML(user.id)}')"
                    class="btn btn-secondary"
                >
                    View
                </button>

                <button
                    onclick="toggleUserStatus('${escapeHTML(user.id)}')"
                    class="btn btn-primary"
                >
                    ${
                        status === "blocked"
                            ? "Unblock"
                            : "Block"
                    }
                </button>

                <button
                    onclick="deleteUser('${escapeHTML(user.id)}')"
                    class="btn btn-danger"
                >
                    Delete
                </button>

            </td>

        </tr>
    `;
}


// ==========================================
// User Card
// ==========================================

function createUserCard(user) {

    return `
        <div
            class="user-card"
            data-user-id="${escapeHTML(user.id)}"
        >

            <h3>
                ${escapeHTML(
                    user.name || "Unknown"
                )}
            </h3>

            <p>
                ${escapeHTML(
                    user.email || "N/A"
                )}
            </p>

            <span class="status">
                ${escapeHTML(
                    user.status || "Active"
                )}
            </span>

            <div class="user-actions">

                <button
                    onclick="viewUser('${escapeHTML(user.id)}')"
                >
                    View
                </button>

                <button
                    onclick="toggleUserStatus('${escapeHTML(user.id)}')"
                >
                    Change Status
                </button>

                <button
                    onclick="deleteUser('${escapeHTML(user.id)}')"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


// ==========================================
// View User
// ==========================================

function viewUser(userId) {

    const user =
        AdminState.users.find(
            item => item.id === userId
        );

    if (!user) {

        showAdminNotification(
            "User not found.",
            "error"
        );

        return;
    }


    const modal =
        getElement("userViewModal");

    if (!modal) {

        alert(
            `Name: ${user.name}\n` +
            `Email: ${user.email}\n` +
            `Role: ${user.role}\n` +
            `Status: ${user.status}`
        );

        return;
    }


    setText(
        "viewUserName",
        user.name
    );

    setText(
        "viewUserEmail",
        user.email
    );

    setText(
        "viewUserRole",
        user.role
    );

    setText(
        "viewUserStatus",
        user.status
    );

    setText(
        "viewUserCreated",
        formatDate(user.createdAt)
    );

    modal.classList.add("active");
}


// ==========================================
// Close User Modal
// ==========================================

function closeUserModal() {

    const modal =
        getElement("userViewModal");

    if (modal) {
        modal.classList.remove("active");
    }
}


// ==========================================
// Toggle User Status
// ==========================================

function toggleUserStatus(userId) {

    const index =
        AdminState.users.findIndex(
            user => user.id === userId
        );

    if (index === -1) {
        return;
    }


    const user =
        AdminState.users[index];

    const currentStatus =
        String(
            user.status || "active"
        ).toLowerCase();


    if (currentStatus === "blocked") {

        user.status = "active";

    } else {

        user.status = "blocked";

    }


    user.updatedAt =
        new Date().toISOString();


    AdminStorage.set(
        ADMIN_CONFIG.usersKey,
        AdminState.users
    );


    logAdminActivity(
        "User Status Changed",
        `${user.email} status changed to ${user.status}`
    );


    loadAdminData();

    renderAdminStats();

    applyUserFilters();


    showAdminNotification(
        `User status changed to ${user.status}.`,
        "success"
    );
}


// ==========================================
// Delete User
// ==========================================

function deleteUser(userId) {

    const index =
        AdminState.users.findIndex(
            user => user.id === userId
        );

    if (index === -1) {
        return false;
    }


    const user =
        AdminState.users[index];


    const confirmed =
        confirm(
            `Delete user "${user.name}"?`
        );


    if (!confirmed) {
        return false;
    }


    AdminState.users.splice(
        index,
        1
    );


    AdminStorage.set(
        ADMIN_CONFIG.usersKey,
        AdminState.users
    );


    logAdminActivity(
        "User Deleted",
        `Deleted user: ${user.email}`
    );


    loadAdminData();

    renderAdminStats();

    applyUserFilters();


    showAdminNotification(
        "User deleted successfully.",
        "success"
    );


    return true;
}


// ==========================================
// Activity Logging
// ==========================================

function logAdminActivity(
    action,
    description
) {

    const activities =
        AdminStorage.get(
            ADMIN_CONFIG.activityKey,
            []
        );


    const activity = {

        id:
            "activity_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 7),

        action,

        description,

        admin:
            AdminState.admin?.email ||
            getAdmin()?.email ||
            "Admin",

        timestamp:
            new Date().toISOString()
    };


    activities.unshift(
        activity
    );


    AdminStorage.set(
        ADMIN_CONFIG.activityKey,
        activities.slice(0, 500)
    );


    return activity;
}


// ==========================================
// Render Activity
// ==========================================

function renderActivity() {

    const container =
        getElement("activityContainer") ||
        getElement("activityTableBody") ||
        query(".activity-table tbody");

    if (!container) {
        return;
    }


    const activities =
        AdminState.activities;


    if (!activities.length) {

        container.innerHTML = `
            <tr>
                <td colspan="5">
                    No activity available.
                </td>
            </tr>
        `;

        return;
    }


    container.innerHTML =
        activities.map(activity => `
            <tr>

                <td>
                    ${escapeHTML(
                        activity.action
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        activity.description
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        activity.admin
                    )}
                </td>

                <td>
                    ${formatDateTime(
                        activity.timestamp
                    )}
                </td>

            </tr>
        `).join("");
}


// ==========================================
// Render Admin Profile
// ==========================================

function renderAdminProfile() {

    const admin =
        AdminState.admin;

    if (!admin) {
        return;
    }


    setText(
        "adminName",
        admin.name
    );

    setText(
        "adminEmail",
        admin.email
    );

    setText(
        "adminRole",
        admin.role
    );
}


// ==========================================
// Dataset Statistics
// ==========================================

function getDatasetStats() {

    const datasets =
        AdminState.datasets;

    let totalRows = 0;

    datasets.forEach(dataset => {

        const rows =
            Number(
                dataset.rows ||
                dataset.rowCount ||
                0
            );

        totalRows += rows;

    });


    return {

        totalDatasets:
            datasets.length,

        totalRows

    };
}


// ==========================================
// Report Statistics
// ==========================================

function getReportStats() {

    const reports =
        AdminState.reports;

    return {

        totalReports:
            reports.length,

        completed:
            reports.filter(
                report =>
                    String(
                        report.status || ""
                    ).toLowerCase() ===
                    "completed"
            ).length,

        drafts:
            reports.filter(
                report =>
                    String(
                        report.status || ""
                    ).toLowerCase() ===
                    "draft"
            ).length
    };
}


// ==========================================
// Date Helpers
// ==========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "N/A";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateTime(dateValue) {

    if (!dateValue) {
        return "N/A";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "N/A";
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
// Notification
// ==========================================

function showAdminNotification(
    message,
    type = "info"
) {

    let notification =
        getElement(
            "adminNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );

        notification.id =
            "adminNotification";

        notification.className =
            "admin-notification";

        document.body.appendChild(
            notification
        );
    }


    notification.className =
        `admin-notification ${type}`;


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3000);
}


// ==========================================
// Setup Search
// ==========================================

function setupUserSearch() {

    const input =
        getElement("userSearch") ||
        getElement("adminUserSearch");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        event => {

            searchUsers(
                event.target.value
            );

        }
    );
}


// ==========================================
// Setup User Filter
// ==========================================

function setupUserFilter() {

    const filter =
        getElement("userStatusFilter");


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        event => {

            filterUsers(
                event.target.value
            );

        }
    );
}


// ==========================================
// Setup Login Form
// ==========================================

function setupAdminLoginForm() {

    const form =
        getElement("adminLoginForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        adminLogin
    );
}


// ==========================================
// Setup Logout
// ==========================================

function setupLogout() {

    const buttons =
        document.querySelectorAll(
            "[data-admin-logout]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            adminLogout
        );

    });
}


// ==========================================
// Setup Modal
// ==========================================

function setupUserModal() {

    const modal =
        getElement("userViewModal");


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeUserModal();

            }

        }
    );
}


// ==========================================
// Initialize Admin
// ==========================================

function initializeAdmin() {

    console.log(
        "Velocity BI Admin initialized."
    );


    const isLoginPage =
        Boolean(
            getElement(
                "adminLoginForm"
            )
        );


    if (!isLoginPage) {

        if (!requireAdmin()) {
            return;
        }

    }


    loadAdminData();

    renderAdminStats();

    renderAdminProfile();

    applyUserFilters();

    renderActivity();

    setupUserSearch();

    setupUserFilter();

    setupAdminLoginForm();

    setupLogout();

    setupUserModal();

}


// ==========================================
// Public API
// ==========================================

window.VelocityAdmin = {

    login:
        adminLogin,

    logout:
        adminLogout,

    load:
        loadAdminData,

    stats:
        calculateAdminStats,

    searchUsers:
        searchUsers,

    filterUsers:
        filterUsers,

    viewUser:
        viewUser,

    toggleUserStatus:
        toggleUserStatus,

    deleteUser:
        deleteUser,

    logActivity:
        logAdminActivity,

    refresh:
        loadAdminData
};


// ==========================================
// Global Functions
// ==========================================

window.adminLogin =
    adminLogin;

window.adminLogout =
    adminLogout;

window.searchUsers =
    searchUsers;

window.filterUsers =
    filterUsers;

window.viewUser =
    viewUser;

window.closeUserModal =
    closeUserModal;

window.toggleUserStatus =
    toggleUserStatus;

window.deleteUser =
    deleteUser;


// ==========================================
// Start Application
// ==========================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdmin
    );

} else {

    initializeAdmin();

}