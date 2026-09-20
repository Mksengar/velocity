// ==========================================
// Velocity BI - Registration JavaScript
// File: frontend/js/register.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------
    // DOM Elements
    // ------------------------------------------

    const registerForm =
        document.getElementById("registerForm");

    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const registerButton =
        document.getElementById("registerButton");

    const termsCheckbox =
        document.getElementById("terms");

    const errorMessage =
        document.getElementById("errorMessage");

    const successMessage =
        document.getElementById("successMessage");

    const togglePassword =
        document.getElementById("togglePassword");

    const toggleConfirmPassword =
        document.getElementById("toggleConfirmPassword");


    // ------------------------------------------
    // API Configuration
    // ------------------------------------------

    const API_BASE_URL =
        "http://127.0.0.1:5000/api";


    // ------------------------------------------
    // Show / Hide Password
    // ------------------------------------------

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener(
            "click",
            () => {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword ? "text" : "password";

                togglePassword.textContent =
                    isPassword ? "Hide" : "Show";
            }
        );
    }


    if (
        toggleConfirmPassword &&
        confirmPasswordInput
    ) {

        toggleConfirmPassword.addEventListener(
            "click",
            () => {

                const isPassword =
                    confirmPasswordInput.type ===
                    "password";

                confirmPasswordInput.type =
                    isPassword ? "text" : "password";

                toggleConfirmPassword.textContent =
                    isPassword ? "Hide" : "Show";
            }
        );
    }


    // ------------------------------------------
    // Message Functions
    // ------------------------------------------

    function showError(message) {

        if (errorMessage) {

            errorMessage.textContent =
                message;

            errorMessage.style.display =
                "block";
        }

        if (successMessage) {
            successMessage.style.display =
                "none";
        }
    }


    function showSuccess(message) {

        if (successMessage) {

            successMessage.textContent =
                message;

            successMessage.style.display =
                "block";
        }

        if (errorMessage) {
            errorMessage.style.display =
                "none";
        }
    }


    function clearMessages() {

        if (errorMessage) {

            errorMessage.textContent = "";

            errorMessage.style.display =
                "none";
        }

        if (successMessage) {

            successMessage.textContent = "";

            successMessage.style.display =
                "none";
        }
    }


    // ------------------------------------------
    // Loading State
    // ------------------------------------------

    function setLoading(isLoading) {

        if (!registerButton) return;

        registerButton.disabled =
            isLoading;

        if (isLoading) {

            registerButton.dataset
                .originalText =
                registerButton.textContent;

            registerButton.textContent =
                "Creating Account...";

        } else {

            registerButton.textContent =
                registerButton.dataset
                    .originalText ||
                "Create Account";
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
    // Password Validation
    // ------------------------------------------

    function isStrongPassword(password) {

        /*
         * Password requirements:
         * - Minimum 8 characters
         * - At least one uppercase letter
         * - At least one lowercase letter
         * - At least one number
         */

        return (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password)
        );
    }


    // ------------------------------------------
    // Form Validation
    // ------------------------------------------

    function validateForm(
        name,
        email,
        password,
        confirmPassword
    ) {

        if (!name) {

            showError(
                "Please enter your full name."
            );

            nameInput?.focus();

            return false;
        }


        if (name.length < 2) {

            showError(
                "Name must contain at least 2 characters."
            );

            nameInput?.focus();

            return false;
        }


        if (!email) {

            showError(
                "Please enter your email address."
            );

            emailInput?.focus();

            return false;
        }


        if (!isValidEmail(email)) {

            showError(
                "Please enter a valid email address."
            );

            emailInput?.focus();

            return false;
        }


        if (!password) {

            showError(
                "Please enter a password."
            );

            passwordInput?.focus();

            return false;
        }


        if (!isStrongPassword(password)) {

            showError(
                "Password must be at least 8 characters and contain uppercase, lowercase, and a number."
            );

            passwordInput?.focus();

            return false;
        }


        if (!confirmPassword) {

            showError(
                "Please confirm your password."
            );

            confirmPasswordInput?.focus();

            return false;
        }


        if (password !== confirmPassword) {

            showError(
                "Passwords do not match."
            );

            confirmPasswordInput?.focus();

            return false;
        }


        if (
            termsCheckbox &&
            !termsCheckbox.checked
        ) {

            showError(
                "Please accept the Terms and Conditions."
            );

            termsCheckbox.focus();

            return false;
        }


        return true;
    }


    // ------------------------------------------
    // Register API
    // ------------------------------------------

    async function registerUser(
        name,
        email,
        password
    ) {

        const response = await fetch(
            `${API_BASE_URL}/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name: name,

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
                "Registration failed."
            );
        }


        return data;
    }


    // ------------------------------------------
    // Save User Information
    // ------------------------------------------

    function saveUserData(data) {

        try {

            if (data.user) {

                localStorage.setItem(
                    "velocity_bi_user",
                    JSON.stringify(
                        data.user
                    )
                );
            }


            /*
             * Some APIs return a token
             * immediately after registration.
             */

            if (data.token) {

                localStorage.setItem(
                    "velocity_bi_token",
                    data.token
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
    // Registration Form Submit
    // ------------------------------------------

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessages();


                // Get form values

                const name =
                    nameInput?.value.trim() || "";

                const email =
                    emailInput?.value
                        .trim()
                        .toLowerCase() || "";

                const password =
                    passwordInput?.value || "";

                const confirmPassword =
                    confirmPasswordInput?.value ||
                    "";


                // Validate

                const isValid =
                    validateForm(
                        name,
                        email,
                        password,
                        confirmPassword
                    );


                if (!isValid) {
                    return;
                }


                // Start loading

                setLoading(true);


                try {

                    const data =
                        await registerUser(
                            name,
                            email,
                            password
                        );


                    // Save user information

                    saveUserData(data);


                    showSuccess(
                        "Account created successfully! Redirecting to login..."
                    );


                    // Redirect to login

                    setTimeout(() => {

                        window.location.href =
                            "login.html";

                    }, 1200);


                } catch (error) {

                    console.error(
                        "Registration error:",
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
                            "Registration failed. Please try again."
                        );
                    }


                } finally {

                    setLoading(false);
                }
            }
        );
    }


    // ------------------------------------------
    // Clear Messages While Typing
    // ------------------------------------------

    [
        nameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput
    ].forEach((input) => {

        if (!input) return;

        input.addEventListener(
            "input",
            () => {

                clearMessages();
            }
        );
    });


    // ------------------------------------------
    // Password Match Indicator
    // ------------------------------------------

    if (confirmPasswordInput) {

        confirmPasswordInput.addEventListener(
            "input",
            () => {

                if (
                    !passwordInput ||
                    !confirmPasswordInput
                ) {
                    return;
                }


                if (
                    confirmPasswordInput.value
                        .length === 0
                ) {
                    return;
                }


                if (
                    passwordInput.value ===
                    confirmPasswordInput.value
                ) {

                    confirmPasswordInput.style
                        .borderColor = "green";

                } else {

                    confirmPasswordInput.style
                        .borderColor = "red";
                }
            }
        );
    }

});