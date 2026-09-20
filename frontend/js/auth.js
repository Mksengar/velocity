// ==========================================
// Velocity BI - Authentication Module
// File: frontend/js/auth.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------
    // Login Form
    // ------------------------------------------

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const usernameInput =
                document.getElementById("username");

            const emailInput =
                document.getElementById("email");

            const username =
                (usernameInput?.value || emailInput?.value || "").trim();

            const password =
                document.getElementById("password")?.value;

            if (!username || !password) {
                showAuthMessage(
                    "Please enter your username/email and password.",
                    "error"
                );
                return;
            }

            setAuthButtonLoading(true);

            try {

                const response = await apiRequest(
                    CONFIG.API.AUTH.LOGIN,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            email: username,
                            password: password
                        })
                    }
                );

                if (!response) {
                    return;
                }

                if (response.status === "error") {
                    throw new Error(response.message || "Invalid username or password.");
                }

                // Save JWT token
                if (response.token) {
                    saveAuthToken(response.token);
                } else if (response.access_token) {
                    saveAuthToken(response.access_token);
                }

                // Save user information
                if (response.user) {
                    saveCurrentUser(response.user);
                }

                showAuthMessage(
                    "Login successful! Redirecting...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 800);

            } catch (error) {

                showAuthMessage(
                    error.message || "Invalid email or password.",
                    "error"
                );

            } finally {

                setAuthButtonLoading(false);
            }
        });
    }


    // ------------------------------------------
    // Registration Form
    // ------------------------------------------

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const name =
                    document.getElementById("name")?.value.trim();

                const email =
                    document.getElementById("email")?.value.trim();

                const password =
                    document.getElementById("password")?.value;

                const confirmPassword =
                    document.getElementById(
                        "confirmPassword"
                    )?.value;

                const rawUsername =
                    document.getElementById("username")?.value.trim();

                // Validate fields
                if (!name || !email || !password) {

                    showAuthMessage(
                        "Please fill all required fields.",
                        "error"
                    );

                    return;
                }

                const username =
                    (rawUsername || name.replace(/\s+/g, "_")).replace(/[^a-zA-Z0-9_-]/g, "") || email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");

                if (username.length < 3) {
                    showAuthMessage(
                        "Username must be at least 3 characters long.",
                        "error"
                    );
                    return;
                }

                // Validate password
                if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {

                    showAuthMessage(
                        "Password must be at least 8 characters, including uppercase, lowercase, and numbers.",
                        "error"
                    );

                    return;
                }


                // Confirm password
                if (password !== confirmPassword) {

                    showAuthMessage(
                        "Passwords do not match.",
                        "error"
                    );

                    return;
                }


                setAuthButtonLoading(true);

                try {

                    const response = await apiRequest(
                        CONFIG.API.AUTH.REGISTER,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                username: username,
                                email: email,
                                password: password,
                                first_name: name.split(/\s+/)[0] || "",
                                last_name: name.split(/\s+/).slice(1).join(" ") || ""
                            })
                        }
                    );


                    if (!response) {
                        return;
                    }


                    showAuthMessage(
                        "Registration successful! Redirecting to login...",
                        "success"
                    );


                    setTimeout(() => {

                        window.location.href =
                            "login.html";

                    }, 1000);


                } catch (error) {

                    showAuthMessage(
                        error.message ||
                        "Registration failed. Please try again.",
                        "error"
                    );

                } finally {

                    setAuthButtonLoading(false);
                }
            }
        );
    }


    // ------------------------------------------
    // Logout Buttons
    // ------------------------------------------

    const logoutButtons =
        document.querySelectorAll(
            "[data-action='logout'], .logout-btn"
        );

    logoutButtons.forEach(button => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            logoutUser();

        });

    });


    // ------------------------------------------
    // Password Toggle
    // ------------------------------------------

    const passwordToggle =
        document.querySelectorAll(
            ".password-toggle"
        );

    passwordToggle.forEach(button => {

        button.addEventListener("click", () => {

            const targetId =
                button.getAttribute("data-target");

            const passwordInput =
                document.getElementById(targetId);

            if (!passwordInput) {
                return;
            }

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                button.textContent = "Hide";

            } else {

                passwordInput.type = "password";

                button.textContent = "Show";
            }
        });
    });


    // ------------------------------------------
    // Password Strength
    // ------------------------------------------

    const passwordInput =
        document.getElementById("password");

    const strengthBar =
        document.getElementById("passwordStrength");

    if (passwordInput && strengthBar) {

        passwordInput.addEventListener(
            "input",
            () => {

                const password =
                    passwordInput.value;

                const strength =
                    calculatePasswordStrength(password);

                strengthBar.textContent =
                    strength.text;

                strengthBar.className =
                    `password-strength ${strength.className}`;
            }
        );
    }

});


// ==========================================
// Show Authentication Message
// ==========================================

function showAuthMessage(message, type = "error") {

    let messageElement =
        document.getElementById("authMessage");

    if (!messageElement) {

        messageElement =
            document.createElement("div");

        messageElement.id =
            "authMessage";

        messageElement.className =
            "auth-message";

        const form =
            document.querySelector(
                "#loginForm, #registerForm"
            );

        if (form) {
            form.prepend(messageElement);
        }
    }

    messageElement.textContent = message;

    messageElement.className =
        `auth-message ${type}`;

    messageElement.style.display =
        "block";
}


// ==========================================
// Button Loading State
// ==========================================

function setAuthButtonLoading(isLoading) {

    const button =
        document.querySelector(
            "#loginForm button[type='submit'], " +
            "#registerForm button[type='submit']"
        );

    if (!button) {
        return;
    }

    if (isLoading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Please wait...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Submit";
    }
}


// ==========================================
// Password Strength Calculator
// ==========================================

function calculatePasswordStrength(password) {

    if (!password) {

        return {
            text: "",
            className: ""
        };
    }

    let score = 0;

    // Length
    if (password.length >= 8) {
        score++;
    }

    if (password.length >= 12) {
        score++;
    }

    // Lowercase
    if (/[a-z]/.test(password)) {
        score++;
    }

    // Uppercase
    if (/[A-Z]/.test(password)) {
        score++;
    }

    // Number
    if (/[0-9]/.test(password)) {
        score++;
    }

    // Special character
    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    if (score <= 2) {

        return {
            text: "Weak password",
            className: "weak"
        };

    } else if (score <= 4) {

        return {
            text: "Medium password",
            className: "medium"
        };

    } else {

        return {
            text: "Strong password",
            className: "strong"
        };
    }
}


// ==========================================
// Protect Dashboard / Private Pages
// ==========================================

function protectPage() {

    if (!isLoggedIn()) {

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


// ==========================================
// Redirect Logged-In Users
// ==========================================

function redirectAuthenticatedUser() {

    if (isLoggedIn()) {

        window.location.href =
            "dashboard.html";
    }
}


// ==========================================
// Get Logged-In User
// ==========================================

function getLoggedInUser() {

    return getCurrentUser();
}


// ==========================================
// Check User Role
// ==========================================

function hasRole(requiredRole) {

    const user =
        getCurrentUser();

    if (!user) {
        return false;
    }

    return user.role === requiredRole;
}


// ==========================================
// Protect Admin Pages
// ==========================================

function protectAdminPage() {

    if (!isLoggedIn()) {

        window.location.href =
            "admin-login.html";

        return false;
    }

    const user =
        getCurrentUser();

    if (
        user &&
        user.role &&
        user.role.toLowerCase() !== "admin"
    ) {

        alert(
            "Access denied. Admin privileges required."
        );

        window.location.href =
            "dashboard.html";

        return false;
    }

    return true;
}


// ==========================================
// Logout
// ==========================================

function handleLogout() {

    if (
        confirm(
            "Are you sure you want to logout?"
        )
    ) {

        logoutUser();
    }
}
