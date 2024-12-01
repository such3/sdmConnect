// Import Notyf from the CDN
// import { Notyf } from "./notyf.min.js";

document.addEventListener("DOMContentLoaded", function () {
  const notyf = new Notyf(); // Initialize Notyf for notifications

  // Check if there are query parameters in the URL
  const urlParams = new URLSearchParams(window.location.search);

  // Show error message if `error` parameter is found in the URL
  const errorMessage = urlParams.get("error");
  if (errorMessage) {
    // Decode the URL-encoded message
    const decodedMessage = decodeURIComponent(errorMessage);
    notyf.error(decodedMessage); // Show error notification
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const fullnameField = document.querySelector("#fullname");
  const emailField = document.querySelector("#email");
  const usernameField = document.querySelector("#username");
  const passwordField = document.querySelector("#password");
  const confirmPasswordField = document.querySelector("#confirm_password");
  const avatarField = document.querySelector("#profile_pic");

  // Initialize Notyf for notifications
  const notyf = new Notyf();

  // Username validation
  function validateUsername() {
    const username = usernameField.value.trim();
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (!usernameRegex.test(username)) {
      return "Username can only contain letters, numbers, hyphens, and underscores.";
    }
    return "";
  }

  // Full name validation
  function validateFullName() {
    const fullName = fullnameField.value.trim();
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (fullName.length < 3) {
      return "Full name must be at least 3 characters long";
    }
    if (!nameRegex.test(fullName)) {
      return "Full name can only contain letters and spaces";
    }
    return "";
  }

  // Email validation
  function validateEmail() {
    const email = emailField.value.trim();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!emailRegex.test(email)) {
      return "Please provide a valid email address";
    }
    return "";
  }

  // Password validation
  function validatePassword() {
    const password = passwordField.value.trim();

    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return "";
  }

  // Confirm password validation
  function validateConfirmPassword() {
    const password = passwordField.value.trim();
    const confirmPassword = confirmPasswordField.value.trim();

    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return "";
  }

  // Avatar validation
  function validateAvatar() {
    const avatar = avatarField.files[0];

    if (!avatar) {
      return "Avatar is required";
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(avatar.type)) {
      return "Only JPEG, PNG, or GIF images are allowed";
    }

    if (avatar.size > 5 * 1024 * 1024) {
      // 5MB limit
      return "Avatar file size should be less than 5MB";
    }

    return "";
  }

  // Validate form before submitting
  form.addEventListener("submit", function (event) {
    // Clear previous notifications
    let hasError = false;

    // Validate each field
    const usernameError = validateUsername();
    const fullNameError = validateFullName();
    const emailError = validateEmail();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();
    const avatarError = validateAvatar();

    // Show errors with Notyf if any
    if (usernameError) {
      notyf.error(usernameError);
      hasError = true;
    }
    if (fullNameError) {
      notyf.error(fullNameError);
      hasError = true;
    }
    if (emailError) {
      notyf.error(emailError);
      hasError = true;
    }
    if (passwordError) {
      notyf.error(passwordError);
      hasError = true;
    }
    if (confirmPasswordError) {
      notyf.error(confirmPasswordError);
      hasError = true;
    }
    if (avatarError) {
      notyf.error(avatarError);
      hasError = true;
    }

    // If there is an error, prevent form submission
    if (hasError) {
      event.preventDefault();
    }
  });
});
