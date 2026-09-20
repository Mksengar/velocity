// ==========================================
// Velocity BI - Profile Management
// File: frontend/js/profile.js
// ==========================================

"use strict";


// ==========================================
// Configuration
// ==========================================

const PROFILE_CONFIG = {
    storageKey: "velocity_bi_user",
    maxImageSize: 2 * 1024 * 1024 // 2 MB
};


// ==========================================
// Safe Storage
// ==========================================

const ProfileStorage = {

    isAvailable() {
        try {
            const testKey = "__velocity_profile_test__";

            localStorage.setItem(testKey, "1");
            localStorage.removeItem(testKey);

            return true;

        } catch (error) {
            console.warn("localStorage is unavailable.");
            return false;
        }
    },

    get(key, defaultValue = null) {

        if (!this.isAvailable()) {
            return defaultValue;
        }

        try {

            const data = localStorage.getItem(key);

            if (!data) {
                return defaultValue;
            }

            return JSON.parse(data);

        } catch (error) {

            console.error(
                "Profile storage read error:",
                error
            );

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

            console.error(
                "Profile storage write error:",
                error
            );

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

function queryAll(selector) {
    return document.querySelectorAll(selector);
}


// ==========================================
// Profile State
// ==========================================

const ProfileState = {

    user: null,

    editing: false,

    selectedImage: null

};


// ==========================================
// Default User
// ==========================================

const DEFAULT_USER = {

    id: null,

    name: "Velocity BI User",

    username: "",

    email: "",

    phone: "",

    company: "",

    jobTitle: "",

    location: "",

    bio: "",

    profileImage: "",

    role: "User",

    createdAt: null,

    updatedAt: null

};


// ==========================================
// Load Profile
// ==========================================

function loadProfile() {

    const storedUser =
        ProfileStorage.get(
            PROFILE_CONFIG.storageKey,
            null
        );

    if (storedUser) {

        ProfileState.user = {
            ...DEFAULT_USER,
            ...storedUser
        };

    } else {

        ProfileState.user = {
            ...DEFAULT_USER
        };

        ProfileStorage.set(
            PROFILE_CONFIG.storageKey,
            ProfileState.user
        );
    }

    renderProfile();

}


// ==========================================
// Render Profile
// ==========================================

function renderProfile() {

    if (!ProfileState.user) {
        return;
    }

    const user =
        ProfileState.user;


    // --------------------------------------
    // Text Elements
    // --------------------------------------

    setText(
        "profileName",
        user.name
    );

    setText(
        "profileUsername",
        user.username
    );

    setText(
        "profileEmail",
        user.email
    );

    setText(
        "profilePhone",
        user.phone
    );

    setText(
        "profileCompany",
        user.company
    );

    setText(
        "profileJobTitle",
        user.jobTitle
    );

    setText(
        "profileLocation",
        user.location
    );

    setText(
        "profileBio",
        user.bio
    );

    setText(
        "profileRole",
        user.role
    );


    // --------------------------------------
    // Form Inputs
    // --------------------------------------

    setInputValue(
        "profileNameInput",
        user.name
    );

    setInputValue(
        "profileUsernameInput",
        user.username
    );

    setInputValue(
        "profileEmailInput",
        user.email
    );

    setInputValue(
        "profilePhoneInput",
        user.phone
    );

    setInputValue(
        "profileCompanyInput",
        user.company
    );

    setInputValue(
        "profileJobTitleInput",
        user.jobTitle
    );

    setInputValue(
        "profileLocationInput",
        user.location
    );

    setInputValue(
        "profileBioInput",
        user.bio
    );


    // --------------------------------------
    // Profile Image
    // --------------------------------------

    renderProfileImage(
        user.profileImage
    );


    // --------------------------------------
    // Account Information
    // --------------------------------------

    setText(
        "profileCreatedAt",
        formatDate(user.createdAt)
    );

    setText(
        "profileUpdatedAt",
        formatDate(user.updatedAt)
    );

}


// ==========================================
// Set Text Safely
// ==========================================

function setText(id, value) {

    const element =
        getElement(id);

    if (!element) {
        return;
    }

    element.textContent =
        value || "";
}


// ==========================================
// Set Input Value
// ==========================================

function setInputValue(id, value) {

    const element =
        getElement(id);

    if (!element) {
        return;
    }

    element.value =
        value || "";
}


// ==========================================
// Format Date
// ==========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
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


// ==========================================
// Edit Profile
// ==========================================

function enableProfileEdit() {

    ProfileState.editing = true;

    toggleProfileForm(true);

    const firstInput =
        getElement("profileNameInput");

    if (firstInput) {
        firstInput.focus();
    }
}


// ==========================================
// Cancel Edit
// ==========================================

function cancelProfileEdit() {

    ProfileState.editing = false;

    renderProfile();

    toggleProfileForm(false);

}


// ==========================================
// Toggle Profile Form
// ==========================================

function toggleProfileForm(editing) {

    const form =
        getElement("profileForm");

    if (!form) {
        return;
    }

    const inputs =
        form.querySelectorAll(
            "input, textarea, select"
        );

    inputs.forEach(input => {

        // Email can be disabled if managed by backend
        if (
            input.id !==
            "profileEmailInput"
        ) {

            input.disabled =
                !editing;

        }

    });


    const saveButton =
        getElement("saveProfileBtn");

    const cancelButton =
        getElement("cancelProfileBtn");

    const editButton =
        getElement("editProfileBtn");


    if (saveButton) {
        saveButton.style.display =
            editing ? "inline-flex" : "none";
    }

    if (cancelButton) {
        cancelButton.style.display =
            editing ? "inline-flex" : "none";
    }

    if (editButton) {
        editButton.style.display =
            editing ? "none" : "inline-flex";
    }

}


// ==========================================
// Save Profile
// ==========================================

function saveProfile(event) {

    if (event) {
        event.preventDefault();
    }

    const validation =
        validateProfileForm();

    if (!validation.valid) {

        showProfileNotification(
            validation.message,
            "error"
        );

        return false;
    }


    const user =
        ProfileState.user;


    user.name =
        getInputValue(
            "profileNameInput"
        );

    user.username =
        getInputValue(
            "profileUsernameInput"
        );

    user.email =
        getInputValue(
            "profileEmailInput"
        );

    user.phone =
        getInputValue(
            "profilePhoneInput"
        );

    user.company =
        getInputValue(
            "profileCompanyInput"
        );

    user.jobTitle =
        getInputValue(
            "profileJobTitleInput"
        );

    user.location =
        getInputValue(
            "profileLocationInput"
        );

    user.bio =
        getInputValue(
            "profileBioInput"
        );

    user.updatedAt =
        new Date().toISOString();


    // Keep selected image
    if (ProfileState.selectedImage) {

        user.profileImage =
            ProfileState.selectedImage;

    }


    const saved =
        ProfileStorage.set(
            PROFILE_CONFIG.storageKey,
            user
        );


    if (!saved) {

        showProfileNotification(
            "Unable to save profile.",
            "error"
        );

        return false;
    }


    ProfileState.user =
        user;

    ProfileState.editing =
        false;

    ProfileState.selectedImage =
        null;


    renderProfile();

    toggleProfileForm(false);


    showProfileNotification(
        "Profile updated successfully.",
        "success"
    );


    return true;

}


// ==========================================
// Get Input Value
// ==========================================

function getInputValue(id) {

    const element =
        getElement(id);

    if (!element) {
        return "";
    }

    return element.value.trim();

}


// ==========================================
// Validate Profile
// ==========================================

function validateProfileForm() {

    const name =
        getInputValue(
            "profileNameInput"
        );

    const email =
        getInputValue(
            "profileEmailInput"
        );

    const phone =
        getInputValue(
            "profilePhoneInput"
        );


    if (!name) {

        return {
            valid: false,
            message: "Please enter your name."
        };

    }


    if (!email) {

        return {
            valid: false,
            message: "Please enter your email."
        };

    }


    if (!isValidEmail(email)) {

        return {
            valid: false,
            message: "Please enter a valid email address."
        };

    }


    if (
        phone &&
        !isValidPhone(phone)
    ) {

        return {
            valid: false,
            message: "Please enter a valid phone number."
        };

    }


    return {
        valid: true,
        message: ""
    };

}


// ==========================================
// Email Validation
// ==========================================

function isValidEmail(email) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(email);

}


// ==========================================
// Phone Validation
// ==========================================

function isValidPhone(phone) {

    const cleaned =
        phone.replace(
            /[\s\-+()]/g,
            ""
        );

    return (
        /^\d{10,15}$/.test(
            cleaned
        )
    );

}


// ==========================================
// Profile Image Upload
// ==========================================

function handleProfileImageUpload(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }


    // Validate file type
    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showProfileNotification(
            "Please select a valid image file.",
            "error"
        );

        event.target.value = "";

        return;
    }


    // Validate file size
    if (
        file.size >
        PROFILE_CONFIG.maxImageSize
    ) {

        showProfileNotification(
            "Image size must be less than 2 MB.",
            "error"
        );

        event.target.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function () {

        ProfileState.selectedImage =
            reader.result;

        renderProfileImage(
            reader.result
        );

    };


    reader.onerror = function () {

        showProfileNotification(
            "Unable to read image.",
            "error"
        );

    };


    reader.readAsDataURL(file);

}


// ==========================================
// Render Profile Image
// ==========================================

function renderProfileImage(imageSource) {

    const image =
        getElement("profileImage");

    const avatar =
        getElement("profileAvatar");


    if (image) {

        if (imageSource) {

            image.src =
                imageSource;

            image.style.display =
                "block";

        } else {

            image.removeAttribute(
                "src"
            );

        }

    }


    if (avatar) {

        if (imageSource) {

            avatar.style.backgroundImage =
                `url("${imageSource}")`;

            avatar.classList.add(
                "has-image"
            );

        } else {

            avatar.style.backgroundImage =
                "";

            avatar.classList.remove(
                "has-image"
            );

        }

    }

}


// ==========================================
// Remove Profile Image
// ==========================================

function removeProfileImage() {

    ProfileState.selectedImage =
        "";

    ProfileState.user.profileImage =
        "";

    renderProfileImage("");

    saveProfileToStorage();

    showProfileNotification(
        "Profile image removed.",
        "success"
    );

}


// ==========================================
// Save Profile To Storage
// ==========================================

function saveProfileToStorage() {

    if (!ProfileState.user) {
        return false;
    }

    return ProfileStorage.set(
        PROFILE_CONFIG.storageKey,
        ProfileState.user
    );

}


// ==========================================
// Change Password
// ==========================================

function changePassword(event) {

    if (event) {
        event.preventDefault();
    }


    const currentPassword =
        getInputValue(
            "currentPassword"
        );

    const newPassword =
        getInputValue(
            "newPassword"
        );

    const confirmPassword =
        getInputValue(
            "confirmPassword"
        );


    if (!currentPassword) {

        showProfileNotification(
            "Enter your current password.",
            "error"
        );

        return false;
    }


    if (!newPassword) {

        showProfileNotification(
            "Enter a new password.",
            "error"
        );

        return false;
    }


    if (
        newPassword.length < 8
    ) {

        showProfileNotification(
            "Password must contain at least 8 characters.",
            "error"
        );

        return false;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showProfileNotification(
            "Passwords do not match.",
            "error"
        );

        return false;
    }


    /*
     * IMPORTANT:
     * Do not store the actual password
     * in localStorage.
     *
     * Password changes should be sent
     * to your Flask backend/API.
     */

    showProfileNotification(
        "Password change request is ready for backend integration.",
        "info"
    );


    return true;

}


// ==========================================
// Toggle Password Visibility
// ==========================================

function togglePasswordVisibility(inputId, button) {

    const input =
        getElement(inputId);

    if (!input) {
        return;
    }


    if (
        input.type === "password"
    ) {

        input.type = "text";

        if (button) {
            button.textContent =
                "Hide";
        }

    } else {

        input.type = "password";

        if (button) {
            button.textContent =
                "Show";
        }

    }

}


// ==========================================
// Generate Initial Avatar
// ==========================================

function getUserInitials(name) {

    if (!name) {
        return "U";
    }


    const words =
        name.trim().split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[words.length - 1]
            .charAt(0)
    ).toUpperCase();

}


// ==========================================
// Update Initial Avatar
// ==========================================

function renderInitialAvatar() {

    const element =
        getElement("profileInitials");

    if (!element) {
        return;
    }

    element.textContent =
        getUserInitials(
            ProfileState.user?.name
        );

}


// ==========================================
// Calculate Profile Completion
// ==========================================

function calculateProfileCompletion() {

    if (!ProfileState.user) {
        return 0;
    }


    const fields = [

        ProfileState.user.name,

        ProfileState.user.username,

        ProfileState.user.email,

        ProfileState.user.phone,

        ProfileState.user.company,

        ProfileState.user.jobTitle,

        ProfileState.user.location,

        ProfileState.user.bio,

        ProfileState.user.profileImage

    ];


    const completed =
        fields.filter(
            value =>
                value &&
                String(value).trim()
        ).length;


    return Math.round(
        (completed / fields.length) * 100
    );

}


// ==========================================
// Render Profile Completion
// ==========================================

function renderProfileCompletion() {

    const percentage =
        calculateProfileCompletion();


    const progress =
        getElement(
            "profileCompletionProgress"
        );

    const text =
        getElement(
            "profileCompletionText"
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }


    if (text) {

        text.textContent =
            `${percentage}% Complete`;

    }

}


// ==========================================
// Notification
// ==========================================

function showProfileNotification(
    message,
    type = "info"
) {

    let notification =
        getElement(
            "profileNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );

        notification.id =
            "profileNotification";

        notification.className =
            "profile-notification";

        document.body.appendChild(
            notification
        );

    }


    notification.className =
        `profile-notification ${type}`;


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
// Setup Profile Image Input
// ==========================================

function setupImageUpload() {

    const input =
        getElement(
            "profileImageInput"
        );

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        handleProfileImageUpload
    );

}


// ==========================================
// Setup Profile Form
// ==========================================

function setupProfileForm() {

    const form =
        getElement(
            "profileForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        saveProfile
    );

}


// ==========================================
// Setup Password Form
// ==========================================

function setupPasswordForm() {

    const form =
        getElement(
            "passwordForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        changePassword
    );

}


// ==========================================
// Setup Edit Button
// ==========================================

function setupEditButton() {

    const button =
        getElement(
            "editProfileBtn"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        enableProfileEdit
    );

}


// ==========================================
// Setup Cancel Button
// ==========================================

function setupCancelButton() {

    const button =
        getElement(
            "cancelProfileBtn"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        cancelProfileEdit
    );

}


// ==========================================
// Setup Image Remove Button
// ==========================================

function setupRemoveImageButton() {

    const button =
        getElement(
            "removeProfileImageBtn"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        removeProfileImage
    );

}


// ==========================================
// Initialize Profile
// ==========================================

function initializeProfile() {

    console.log(
        "Velocity BI Profile initialized."
    );


    loadProfile();

    renderInitialAvatar();

    renderProfileCompletion();

    setupImageUpload();

    setupProfileForm();

    setupPasswordForm();

    setupEditButton();

    setupCancelButton();

    setupRemoveImageButton();

    toggleProfileForm(false);

}


// ==========================================
// Public API
// ==========================================

window.VelocityProfile = {

    load: loadProfile,

    save: saveProfile,

    edit: enableProfileEdit,

    cancel: cancelProfileEdit,

    changePassword: changePassword,

    uploadImage:
        handleProfileImageUpload,

    removeImage:
        removeProfileImage,

    getUser: () =>
        ProfileState.user,

    getCompletion:
        calculateProfileCompletion

};


// ==========================================
// Global Functions
// ==========================================

window.loadProfile =
    loadProfile;

window.saveProfile =
    saveProfile;

window.enableProfileEdit =
    enableProfileEdit;

window.cancelProfileEdit =
    cancelProfileEdit;

window.changePassword =
    changePassword;

window.handleProfileImageUpload =
    handleProfileImageUpload;

window.removeProfileImage =
    removeProfileImage;

window.togglePasswordVisibility =
    togglePasswordVisibility;


// ==========================================
// Start
// ==========================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfile
    );

} else {

    initializeProfile();

}