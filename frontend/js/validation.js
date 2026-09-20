// ==========================================
// Velocity BI - Form Validation Utilities
// File: frontend/js/validation.js
// ==========================================


// ==========================================
// Validation Patterns
// ==========================================

const Validation = {

    patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[6-9]\d{9}$/,
        username: /^[a-zA-Z0-9_]{3,30}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        url: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i
    },


    // ==========================================
    // Required Field
    // ==========================================

    required(value) {
        return value !== null &&
               value !== undefined &&
               String(value).trim() !== "";
    },


    // ==========================================
    // Email Validation
    // ==========================================

    email(value) {
        if (!this.required(value)) {
            return false;
        }

        return this.patterns.email.test(String(value).trim());
    },


    // ==========================================
    // Phone Validation
    // ==========================================

    phone(value) {
        if (!this.required(value)) {
            return false;
        }

        return this.patterns.phone.test(String(value).trim());
    },


    // ==========================================
    // Username Validation
    // ==========================================

    username(value) {
        if (!this.required(value)) {
            return false;
        }

        return this.patterns.username.test(String(value).trim());
    },


    // ==========================================
    // Password Validation
    // ==========================================

    password(value) {
        if (!this.required(value)) {
            return false;
        }

        return this.patterns.password.test(String(value));
    },


    // ==========================================
    // Confirm Password
    // ==========================================

    confirmPassword(password, confirmPassword) {
        return this.required(confirmPassword) &&
               password === confirmPassword;
    },


    // ==========================================
    // URL Validation
    // ==========================================

    url(value) {
        if (!this.required(value)) {
            return false;
        }

        return this.patterns.url.test(String(value).trim());
    },


    // ==========================================
    // Minimum Length
    // ==========================================

    minLength(value, length) {
        if (!this.required(value)) {
            return false;
        }

        return String(value).trim().length >= length;
    },


    // ==========================================
    // Maximum Length
    // ==========================================

    maxLength(value, length) {
        if (!this.required(value)) {
            return false;
        }

        return String(value).trim().length <= length;
    },


    // ==========================================
    // Number Validation
    // ==========================================

    number(value) {
        if (!this.required(value)) {
            return false;
        }

        return !isNaN(value) && isFinite(value);
    },


    // ==========================================
    // Positive Number
    // ==========================================

    positiveNumber(value) {
        return this.number(value) && Number(value) > 0;
    },


    // ==========================================
    // Integer Validation
    // ==========================================

    integer(value) {
        if (!this.number(value)) {
            return false;
        }

        return Number.isInteger(Number(value));
    },


    // ==========================================
    // File Validation
    // ==========================================

    file(file, allowedTypes = [], maxSizeMB = 10) {

        if (!file) {
            return {
                valid: false,
                message: "Please select a file."
            };
        }

        // File type validation
        if (allowedTypes.length > 0) {

            const fileName = file.name.toLowerCase();

            const validType = allowedTypes.some(type => {

                const normalizedType = type
                    .toLowerCase()
                    .replace(".", "");

                return fileName.endsWith("." + normalizedType);
            });

            if (!validType) {
                return {
                    valid: false,
                    message: `Allowed file types: ${allowedTypes.join(", ")}`
                };
            }
        }


        // File size validation
        const maxSize = maxSizeMB * 1024 * 1024;

        if (file.size > maxSize) {
            return {
                valid: false,
                message: `File size must be less than ${maxSizeMB} MB.`
            };
        }


        return {
            valid: true,
            message: ""
        };
    },


    // ==========================================
    // Dataset File Validation
    // ==========================================

    datasetFile(file) {

        return this.file(
            file,
            ["csv", "xlsx", "xls", "json"],
            50
        );
    },


    // ==========================================
    // Form Validation
    // ==========================================

    validateForm(form) {

        if (!form) {
            return {
                valid: false,
                errors: {
                    form: "Form not found."
                }
            };
        }


        const errors = {};

        const fields = form.querySelectorAll(
            "input, textarea, select"
        );


        fields.forEach(field => {

            const value = field.value.trim();

            const name = field.name || field.id;

            if (!name) {
                return;
            }


            // Required validation
            if (field.hasAttribute("required") && !this.required(value)) {

                errors[name] =
                    `${this.getFieldName(field)} is required.`;

                return;
            }


            // Email validation
            if (
                field.type === "email" &&
                value &&
                !this.email(value)
            ) {

                errors[name] =
                    "Please enter a valid email address.";

                return;
            }


            // Password validation
            if (
                field.dataset.validate === "password" &&
                value &&
                !this.password(value)
            ) {

                errors[name] =
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.";

                return;
            }


            // Minimum length
            if (field.dataset.minlength && value) {

                const min = Number(field.dataset.minlength);

                if (!this.minLength(value, min)) {

                    errors[name] =
                        `Minimum ${min} characters required.`;

                    return;
                }
            }


            // Maximum length
            if (field.dataset.maxlength && value) {

                const max = Number(field.dataset.maxlength);

                if (!this.maxLength(value, max)) {

                    errors[name] =
                        `Maximum ${max} characters allowed.`;

                    return;
                }
            }
        });


        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },


    // ==========================================
    // Get Friendly Field Name
    // ==========================================

    getFieldName(field) {

        let name =
            field.dataset.label ||
            field.getAttribute("aria-label") ||
            field.name ||
            field.id ||
            "This field";


        name = name
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());


        return name;
    },


    // ==========================================
    // Show Error
    // ==========================================

    showError(field, message) {

        if (!field) {
            return;
        }


        field.classList.add("is-invalid");

        field.classList.remove("is-valid");


        let errorElement =
            field.parentElement.querySelector(".validation-error");


        if (!errorElement) {

            errorElement =
                document.createElement("small");

            errorElement.className =
                "validation-error";


            field.parentElement.appendChild(
                errorElement
            );
        }


        errorElement.textContent = message;

        errorElement.style.display = "block";
    },


    // ==========================================
    // Clear Error
    // ==========================================

    clearError(field) {

        if (!field) {
            return;
        }


        field.classList.remove("is-invalid");


        const errorElement =
            field.parentElement.querySelector(
                ".validation-error"
            );


        if (errorElement) {

            errorElement.textContent = "";

            errorElement.style.display = "none";
        }
    },


    // ==========================================
    // Show Valid State
    // ==========================================

    showValid(field) {

        if (!field) {
            return;
        }


        field.classList.remove("is-invalid");

        field.classList.add("is-valid");


        this.clearError(field);
    },


    // ==========================================
    // Validate Single Field
    // ==========================================

    validateField(field) {

        if (!field) {
            return false;
        }


        const value = field.value.trim();


        // Required
        if (
            field.hasAttribute("required") &&
            !this.required(value)
        ) {

            this.showError(
                field,
                `${this.getFieldName(field)} is required.`
            );

            return false;
        }


        // Email
        if (
            field.type === "email" &&
            value &&
            !this.email(value)
        ) {

            this.showError(
                field,
                "Please enter a valid email address."
            );

            return false;
        }


        // Password
        if (
            field.dataset.validate === "password" &&
            value &&
            !this.password(value)
        ) {

            this.showError(
                field,
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
            );

            return false;
        }


        // Minimum length
        if (field.dataset.minlength && value) {

            const min =
                Number(field.dataset.minlength);


            if (!this.minLength(value, min)) {

                this.showError(
                    field,
                    `Minimum ${min} characters required.`
                );

                return false;
            }
        }


        // Maximum length
        if (field.dataset.maxlength && value) {

            const max =
                Number(field.dataset.maxlength);


            if (!this.maxLength(value, max)) {

                this.showError(
                    field,
                    `Maximum ${max} characters allowed.`
                );

                return false;
            }
        }


        this.showValid(field);

        return true;
    },


    // ==========================================
    // Attach Live Validation
    // ==========================================

    attach(form) {

        if (!form) {
            return;
        }


        const fields =
            form.querySelectorAll(
                "input, textarea, select"
            );


        fields.forEach(field => {

            field.addEventListener(
                "blur",
                () => {
                    this.validateField(field);
                }
            );


            field.addEventListener(
                "input",
                () => {

                    if (
                        field.classList.contains(
                            "is-invalid"
                        )
                    ) {

                        this.validateField(field);
                    }
                }
            );
        });
    },


    // ==========================================
    // Password Strength
    // ==========================================

    passwordStrength(password) {

        let score = 0;


        if (!password) {
            return {
                score: 0,
                level: "empty"
            };
        }


        if (password.length >= 8) {
            score++;
        }


        if (/[a-z]/.test(password)) {
            score++;
        }


        if (/[A-Z]/.test(password)) {
            score++;
        }


        if (/\d/.test(password)) {
            score++;
        }


        if (/[^A-Za-z0-9]/.test(password)) {
            score++;
        }


        let level = "weak";


        if (score >= 4) {
            level = "strong";
        } else if (score >= 3) {
            level = "medium";
        }


        return {
            score,
            level
        };
    }
};


// ==========================================
// Global Helper Functions
// ==========================================

function validateEmail(email) {
    return Validation.email(email);
}


function validatePassword(password) {
    return Validation.password(password);
}


function validateRequired(value) {
    return Validation.required(value);
}


function validatePhone(phone) {
    return Validation.phone(phone);
}


function validateFile(file) {
    return Validation.datasetFile(file);
}


// ==========================================
// Automatic Form Setup
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const forms =
        document.querySelectorAll(
            "form[data-validation]"
        );


    forms.forEach(form => {

        Validation.attach(form);


        form.addEventListener(
            "submit",
            event => {

                const result =
                    Validation.validateForm(form);


                if (!result.valid) {

                    event.preventDefault();


                    const firstError =
                        Object.keys(result.errors)[0];


                    const field =
                        form.querySelector(
                            `[name="${firstError}"], #${firstError}`
                        );


                    if (field) {

                        Validation.showError(
                            field,
                            result.errors[firstError]
                        );

                        field.focus();
                    }
                }
            }
        );
    });
});


// ==========================================
// Export for Other JavaScript Files
// ==========================================

if (typeof window !== "undefined") {

    window.Validation = Validation;

    window.validateEmail = validateEmail;
    window.validatePassword = validatePassword;
    window.validateRequired = validateRequired;
    window.validatePhone = validatePhone;
    window.validateFile = validateFile;
}