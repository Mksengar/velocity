// ==========================================
// Velocity BI - Notifications Manager
// File: frontend/js/notifications.js
// ==========================================

(function () {
    "use strict";

    const Notifications = {

        // ==========================================
        // Configuration
        // ==========================================

        storageKey: "velocityBI_notifications",
        maxNotifications: 100,

        notifications: [],


        // ==========================================
        // Initialize
        // ==========================================

        init() {

            this.load();

            this.bindEvents();

            this.render();

            this.updateBadge();

        },


        // ==========================================
        // Load Notifications
        // ==========================================

        load() {

            try {

                const stored =
                    localStorage.getItem(
                        this.storageKey
                    );


                if (stored) {

                    const parsed =
                        JSON.parse(stored);


                    if (Array.isArray(parsed)) {

                        this.notifications = parsed;

                    }

                }

            } catch (error) {

                console.warn(
                    "Velocity BI: Unable to load notifications.",
                    error
                );

                this.notifications = [];

            }

        },


        // ==========================================
        // Save Notifications
        // ==========================================

        save() {

            try {

                localStorage.setItem(
                    this.storageKey,
                    JSON.stringify(
                        this.notifications
                    )
                );

            } catch (error) {

                console.warn(
                    "Velocity BI: Unable to save notifications.",
                    error
                );

            }

        },


        // ==========================================
        // Bind Events
        // ==========================================

        bindEvents() {

            // Notification button
            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-notification-toggle]"
                        );


                    if (button) {

                        event.preventDefault();

                        this.togglePanel();

                    }

                }
            );


            // Mark all as read
            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-mark-all-read]"
                        );


                    if (button) {

                        event.preventDefault();

                        this.markAllAsRead();

                    }

                }
            );


            // Clear all
            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-clear-notifications]"
                        );


                    if (button) {

                        event.preventDefault();

                        this.clearAll();

                    }

                }
            );


            // Notification item
            document.addEventListener(
                "click",
                event => {

                    const item =
                        event.target.closest(
                            "[data-notification-id]"
                        );


                    if (!item) {
                        return;
                    }


                    // Ignore action buttons
                    if (
                        event.target.closest(
                            "[data-notification-action]"
                        )
                    ) {
                        return;
                    }


                    const id =
                        item.dataset.notificationId;


                    this.markAsRead(id);

                }
            );


            // Delete notification
            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-delete-notification]"
                        );


                    if (!button) {
                        return;
                    }


                    event.preventDefault();
                    event.stopPropagation();


                    const item =
                        button.closest(
                            "[data-notification-id]"
                        );


                    if (!item) {
                        return;
                    }


                    this.remove(
                        item.dataset.notificationId
                    );

                }
            );


            // Filter buttons
            document.addEventListener(
                "click",
                event => {

                    const filter =
                        event.target.closest(
                            "[data-notification-filter]"
                        );


                    if (!filter) {
                        return;
                    }


                    event.preventDefault();


                    const value =
                        filter.dataset.notificationFilter;


                    this.filter(value);


                    document
                        .querySelectorAll(
                            "[data-notification-filter]"
                        )
                        .forEach(button => {

                            button.classList.remove(
                                "active"
                            );

                        });


                    filter.classList.add(
                        "active"
                    );

                }
            );

        },


        // ==========================================
        // Toggle Panel
        // ==========================================

        togglePanel() {

            const panel =
                document.querySelector(
                    "[data-notification-panel]"
                );


            if (!panel) {
                return;
            }


            const isOpen =
                panel.classList.toggle(
                    "active"
                );


            const button =
                document.querySelector(
                    "[data-notification-toggle]"
                );


            if (button) {

                button.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }

        },


        // ==========================================
        // Close Panel
        // ==========================================

        closePanel() {

            const panel =
                document.querySelector(
                    "[data-notification-panel]"
                );


            if (panel) {

                panel.classList.remove(
                    "active"
                );

            }


            const button =
                document.querySelector(
                    "[data-notification-toggle]"
                );


            if (button) {

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        },


        // ==========================================
        // Add Notification
        // ==========================================

        add(options = {}) {

            const notification = {

                id:
                    options.id ||
                    this.generateId(),

                title:
                    options.title ||
                    "New Notification",

                message:
                    options.message ||
                    "",

                type:
                    options.type ||
                    "info",

                icon:
                    options.icon ||
                    this.getIcon(
                        options.type || "info"
                    ),

                time:
                    options.time ||
                    new Date().toISOString(),

                read:
                    options.read === true,

                link:
                    options.link ||
                    null,

                data:
                    options.data ||
                    {}

            };


            this.notifications.unshift(
                notification
            );


            // Limit notifications
            if (
                this.notifications.length >
                this.maxNotifications
            ) {

                this.notifications =
                    this.notifications.slice(
                        0,
                        this.maxNotifications
                    );

            }


            this.save();

            this.render();

            this.updateBadge();


            // Optional browser notification
            if (
                options.browserNotification === true
            ) {

                this.showBrowserNotification(
                    notification
                );

            }


            return notification;

        },


        // ==========================================
        // Generate ID
        // ==========================================

        generateId() {

            return (
                "notification-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 9)
            );

        },


        // ==========================================
        // Mark as Read
        // ==========================================

        markAsRead(id) {

            const notification =
                this.notifications.find(
                    item => item.id === id
                );


            if (!notification) {
                return;
            }


            notification.read = true;


            this.save();

            this.render();

            this.updateBadge();

        },


        // ==========================================
        // Mark All as Read
        // ==========================================

        markAllAsRead() {

            this.notifications.forEach(
                notification => {

                    notification.read = true;

                }
            );


            this.save();

            this.render();

            this.updateBadge();

        },


        // ==========================================
        // Remove Notification
        // ==========================================

        remove(id) {

            this.notifications =
                this.notifications.filter(
                    notification =>
                        notification.id !== id
                );


            this.save();

            this.render();

            this.updateBadge();

        },


        // ==========================================
        // Clear All
        // ==========================================

        clearAll() {

            if (
                this.notifications.length === 0
            ) {
                return;
            }


            const confirmed =
                window.confirm(
                    "Clear all notifications?"
                );


            if (!confirmed) {
                return;
            }


            this.notifications = [];


            this.save();

            this.render();

            this.updateBadge();

        },


        // ==========================================
        // Get Unread Notifications
        // ==========================================

        getUnread() {

            return this.notifications.filter(
                notification =>
                    !notification.read
            );

        },


        // ==========================================
        // Get Unread Count
        // ==========================================

        getUnreadCount() {

            return this.getUnread().length;

        },


        // ==========================================
        // Update Notification Badge
        // ==========================================

        updateBadge() {

            const count =
                this.getUnreadCount();


            const badges =
                document.querySelectorAll(
                    "[data-notification-count]"
                );


            badges.forEach(badge => {

                if (count > 0) {

                    badge.textContent =
                        count > 99
                            ? "99+"
                            : count;

                    badge.classList.add(
                        "active"
                    );

                } else {

                    badge.textContent = "";

                    badge.classList.remove(
                        "active"
                    );

                }

            });

        },


        // ==========================================
        // Render Notifications
        // ==========================================

        render(
            filter = "all"
        ) {

            const containers =
                document.querySelectorAll(
                    "[data-notification-list]"
                );


            if (
                containers.length === 0
            ) {
                return;
            }


            let list =
                [...this.notifications];


            // Filter
            if (filter === "unread") {

                list =
                    list.filter(
                        notification =>
                            !notification.read
                    );

            }


            containers.forEach(container => {

                if (list.length === 0) {

                    container.innerHTML = `
                        <div class="notification-empty">

                            <div class="notification-empty-icon">
                                🔔
                            </div>

                            <p>
                                No notifications
                            </p>

                        </div>
                    `;

                    return;

                }


                container.innerHTML =
                    list.map(
                        notification =>
                            this.createNotificationHTML(
                                notification
                            )
                    ).join("");

            });

        },


        // ==========================================
        // Create Notification HTML
        // ==========================================

        createNotificationHTML(
            notification
        ) {

            const unreadClass =
                notification.read
                    ? ""
                    : "unread";


            const time =
                this.formatTime(
                    notification.time
                );


            const link =
                notification.link
                    ? `
                        <a
                            href="${this.escapeHTML(
                                notification.link
                            )}"
                            class="notification-link">
                            View
                        </a>
                    `
                    : "";


            return `
                <div
                    class="notification-item ${unreadClass}"
                    data-notification-id="${this.escapeHTML(
                        notification.id
                    )}">

                    <div class="notification-icon type-${this.escapeHTML(
                        notification.type
                    )}">

                        ${this.escapeHTML(
                            notification.icon
                        )}

                    </div>


                    <div class="notification-content">

                        <h4>
                            ${this.escapeHTML(
                                notification.title
                            )}
                        </h4>

                        <p>
                            ${this.escapeHTML(
                                notification.message
                            )}
                        </p>

                        <small>
                            ${this.escapeHTML(time)}
                        </small>

                        ${link}

                    </div>


                    <button
                        type="button"
                        class="notification-delete"
                        data-delete-notification
                        aria-label="Delete notification">

                        &times;

                    </button>

                </div>
            `;

        },


        // ==========================================
        // Filter Notifications
        // ==========================================

        filter(type = "all") {

            this.render(type);

        },


        // ==========================================
        // Format Time
        // ==========================================

        formatTime(timestamp) {

            const date =
                new Date(timestamp);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "";
            }


            const now =
                new Date();


            const difference =
                now.getTime() -
                date.getTime();


            const seconds =
                Math.floor(
                    difference / 1000
                );


            if (seconds < 60) {
                return "Just now";
            }


            const minutes =
                Math.floor(
                    seconds / 60
                );


            if (minutes < 60) {

                return (
                    minutes +
                    (minutes === 1
                        ? " minute ago"
                        : " minutes ago")
                );

            }


            const hours =
                Math.floor(
                    minutes / 60
                );


            if (hours < 24) {

                return (
                    hours +
                    (hours === 1
                        ? " hour ago"
                        : " hours ago")
                );

            }


            const days =
                Math.floor(
                    hours / 24
                );


            if (days < 7) {

                return (
                    days +
                    (days === 1
                        ? " day ago"
                        : " days ago")
                );

            }


            return date.toLocaleDateString();

        },


        // ==========================================
        // Notification Icons
        // ==========================================

        getIcon(type) {

            const icons = {

                success: "✓",
                error: "✕",
                warning: "⚠",
                info: "i",
                dataset: "📁",
                report: "📄",
                analytics: "📊",
                system: "⚙"

            };


            return (
                icons[type] ||
                icons.info
            );

        },


        // ==========================================
        // Browser Notification Permission
        // ==========================================

        requestPermission() {

            if (
                !("Notification" in window)
            ) {

                console.warn(
                    "Browser notifications are not supported."
                );

                return Promise.resolve(
                    "unsupported"
                );

            }


            if (
                Notification.permission ===
                "granted"
            ) {

                return Promise.resolve(
                    "granted"
                );

            }


            return Notification.requestPermission();

        },


        // ==========================================
        // Browser Notification
        // ==========================================

        showBrowserNotification(
            notification
        ) {

            if (
                !("Notification" in window)
            ) {
                return;
            }


            if (
                Notification.permission !==
                "granted"
            ) {
                return;
            }


            new Notification(
                notification.title,
                {
                    body:
                        notification.message,

                    icon:
                        "assets/images/logo.png"
                }
            );

        },


        // ==========================================
        // Success Notification
        // ==========================================

        success(
            title,
            message,
            options = {}
        ) {

            return this.add({

                ...options,

                title,
                message,

                type: "success",

                icon: "✓"

            });

        },


        // ==========================================
        // Error Notification
        // ==========================================

        error(
            title,
            message,
            options = {}
        ) {

            return this.add({

                ...options,

                title,
                message,

                type: "error",

                icon: "✕"

            });

        },


        // ==========================================
        // Warning Notification
        // ==========================================

        warning(
            title,
            message,
            options = {}
        ) {

            return this.add({

                ...options,

                title,
                message,

                type: "warning",

                icon: "⚠"

            });

        },


        // ==========================================
        // Info Notification
        // ==========================================

        info(
            title,
            message,
            options = {}
        ) {

            return this.add({

                ...options,

                title,
                message,

                type: "info",

                icon: "i"

            });

        },


        // ==========================================
        // Escape HTML
        // ==========================================

        escapeHTML(value) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                String(value ?? "");


            return div.innerHTML;

        }

    };


    // ==========================================
    // Global Access
    // ==========================================

    window.Notifications =
        Notifications;


    // ==========================================
    // Initialize
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => Notifications.init()
        );

    } else {

        Notifications.init();

    }

})();