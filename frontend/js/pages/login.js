// ==========================================
// Velocity BI - Login JavaScript
// File: frontend/js/login.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rememberMe = document.getElementById("rememberMe");
    const loginButton = document.getElementById("loginButton");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    const togglePassword = document.getElementById("togglePassword");

    // ------------------------------------------
    // API Configuration
    // ------------------------------------------

    const API_BASE_URL = window.location.port === "5500"
        ? "http://127.0.0.1:5000/api"
        : `${window.location.origin}/api`;

    // ------------------------------------------
    // Show / Hide Password
    // ------------------------------------------

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            togglePassword.textContent = isPassword ? "Hide" : "Show";
        });
    }

    // ------------------------------------------
    // Utility Functions
    // ------------------------------------------

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = "block";
        }

        if (successMessage) {
            successMessage.style.display = "none";
        }
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = "block";
        }

        if (errorMessage) {
            errorMessage.style.display = "none";
        }
    }

    function clearMessages() {
        if (errorMessage) {
            errorMessage.textContent = "";
            errorMessage.style.display = "none";
        }

        if (successMessage) {
            successMessage.textContent = "";
            successMessage.style.display = "none";
        }
    }

    function setLoading(isLoading) {
        if (!loginButton) return;

        loginButton.disabled = isLoading;

        if (isLoading) {
            loginButton.dataset.originalText =
                loginButton.textContent;

            loginButton.textContent = "Logging in...";
        } else {
            loginButton.textContent =
                loginButton.dataset.originalText || "Login";
        }
    }

    // ------------------------------------------
    // Email Validation
    // ------------------------------------------

    function isValidEmail(email) {
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailPattern.test(email);
    }

    // ------------------------------------------
    // Form Validation
    // ------------------------------------------

    function validateLoginForm(email, password) {

        if (!email) {
            showError("Please enter your email address.");
            emailInput?.focus();
            return false;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.");
            emailInput?.focus();
            return false;
        }

        if (!password) {
            showError("Please enter your password.");
            passwordInput?.focus();
            return false;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters.");
            passwordInput?.focus();
            return false;
        }

        return true;
    }

    // ------------------------------------------
    // Save Login Data
    // ------------------------------------------

    function saveLoginData(data, email) {

        try {
            if (data.token) {
                localStorage.setItem(
                    "velocity_bi_token",
                    data.token
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "velocity_bi_user",
                    JSON.stringify(data.user)
                );
            }

            if (rememberMe?.checked) {
                localStorage.setItem(
                    "velocity_bi_email",
                    email
                );
            } else {
                localStorage.removeItem(
                    "velocity_bi_email"
                );
            }

        } catch (error) {
            console.warn(
                "Browser storage is unavailable:",
                error
            );
        }
    }

    // ------------------------------------------
    // Login API
    // ------------------------------------------

    async function loginUser(email, password) {

        const response = await fetch(
            `${API_BASE_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                "Invalid email or password."
            );
        }

        return data;
    }

    // ------------------------------------------
    // Login Form Submit
    // ------------------------------------------

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessages();

                const email =
                    emailInput?.value.trim() || "";

                const password =
                    passwordInput?.value || "";

                // Validate form
                if (
                    !validateLoginForm(
                        email,
                        password
                    )
                ) {
                    return;
                }

                setLoading(true);

                try {

                    const data =
                        await loginUser(
                            email,
                            password
                        );

                    // Save token and user
                    saveLoginData(
                        data,
                        email
                    );

                    showSuccess(
                        "Login successful! Redirecting..."
                    );

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href =
                            "dashboard.html";
                    }, 800);

                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    if (
                        error instanceof TypeError
                    ) {
                        showError(
                            "Unable to connect to the server. Please make sure the Flask backend is running."
                        );
                    } else {
                        showError(
                            error.message ||
                            "Login failed. Please try again."
                        );
                    }

                } finally {
                    setLoading(false);
                }
            }
        );
    }

    // ------------------------------------------
    // Load Remembered Email
    // ------------------------------------------

    try {

        const savedEmail =
            localStorage.getItem(
                "velocity_bi_email"
            );

        if (
            savedEmail &&
            emailInput
        ) {
            emailInput.value = savedEmail;

            if (rememberMe) {
                rememberMe.checked = true;
            }
        }

    } catch (error) {
        console.warn(
            "Unable to access saved email."
        );
    }

    // ------------------------------------------
    // Clear Error While Typing
    // ------------------------------------------

    [emailInput, passwordInput].forEach(
        (input) => {

            if (!input) return;

            input.addEventListener(
                "input",
                () => {
                    clearMessages();
                }
            );
        }
    );
});