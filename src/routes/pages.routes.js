import { Router } from "express";
import { isAuthenticated, verifyJWT } from "../middlewares/auth.middleware.js"; // JWT Middleware to handle authenticated routes (if required)
import { publicProfile } from "../controllers/user.controller.js";

const router = new Router();

// Route for the Register page
router.get("/register", isAuthenticated, function (req, res) {
  // Check if there's any error passed and render the register page accordingly
  const errorMessage = req.query.error || ""; // If there's an error, display it
  res.render("auth/register", { error: errorMessage });
});

// Route for the Login page
router.get("/login", isAuthenticated, function (req, res) {
  // Check if there's any error passed and render the login page accordingly
  const errorMessage = req.query.error || ""; // If there's an error, display it
  res.render("auth/login", { error: errorMessage });
});

router.get("/profile", async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;

    // Fetch user profile data from the API
    const response = await fetch("http://localhost:3000/api/v1/users/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      console.error(
        `Failed to fetch user data: ${response.status} ${response.statusText}`
      );
      return res.redirect(
        `/pages/login?error=Failed to fetch user data : ${response.statusText} `
      );
    }

    // Parse the response body as JSON
    const responseData = await response.json();

    // Log the full API response to inspect it
    // console.log("API response:", responseData);

    // Check if the response contains user data
    if (!responseData || !responseData.data) {
      // console.error("User data is missing or empty:", responseData);
      return res.redirect("/pages/login?error=User data not found");
    }

    // Assuming the response structure is { "status": 200, "data": { /* user object */ }, "message": "success" }
    const user = responseData.data; // Extract the user data from the 'data' property

    // Render the profile page with the user data
    res.render("profile", {
      user,
      message: req.query.message || "",
      error: req.query.error || "",
    });
  } catch (err) {
    // console.error("Error fetching user data:", err);
    return res.redirect("/pages/login?error=Error fetching user data");
  }
});

// // Route for the Login page
// router.get("/user", function (req, res) {
//   // Check if there's any error passed and render the login page accordingly
//   const errorMessage = req.query.error || ""; // If there's an error, display it
//   res.render("user/user", { error: errorMessage });
// });

router.route("/profile/:username").get(verifyJWT, publicProfile);
export default router;
