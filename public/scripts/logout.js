const logout = async function (event) {
  event.preventDefault(); // Prevent the default action of the link

  try {
    // Make a POST request to the server to log the user out
    const response = await fetch("/api/v1/users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // If you're using the accessToken in a header, make sure it is sent
        Authorization: `Bearer ${document.cookie.accessToken}`,
      },
      credentials: "include", // Make sure cookies are included in the request
    });

    // Check if the response was successful (status code 200-299)
    if (response.ok) {
      // If logout was successful, show success notification
      notyf.success("Successfully logged out!");
      // Redirect after a short delay to allow the user to see the notification
      setTimeout(() => {
        window.location.href = "/pages/login?message=Successfully Logged Out"; // Redirect to login page
      }, 1500); // Delay for 1.5 seconds
    } else {
      // Handle logout error (e.g., show an error message)
      const errorMessage = await response.text();
      notyf.error(`Logout failed: ${errorMessage}`);
    }
  } catch (error) {
    // Handle any network or unexpected errors
    notyf.error("An error occurred during logout. Please try again.");
  }
};
