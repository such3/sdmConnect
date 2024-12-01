// import { Notyf } from "notyf"; // Import Notyf

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);

  // Check if the 'error' or 'success' parameter exists in the URL
  if (urlParams.has("success")) {
    const successMessage = urlParams.get("success");
    const notyf = new Notyf();

    // Show success message if registration was successful
    if (successMessage === "true") {
      notyf.success("User successfully registered!");
    }
  }

  // Check if the 'error' parameter exists in the URL
  if (urlParams.has("error")) {
    const errorMessage = urlParams.get("error");
    const notyf = new Notyf();

    // Show error message if registration failed
    if (errorMessage) {
      notyf.error(errorMessage); // Display the error message from the URL
    }
  }
});
