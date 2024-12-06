import { Router } from "express";
import { isAuthenticated, verifyJWT } from "../middlewares/auth.middleware.js"; // JWT Middleware for authentication
import { publicProfile } from "../controllers/user.controller.js";
import {
  createResource,
  getAllResources,
  getSingleResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller.js";

const router = new Router();

// Route for the Register page
router.get("/register", isAuthenticated, (req, res) => {
  // Check if user is already logged in, if so, redirect to profile
  if (req.user) {
    return res.redirect("/profile");
  }

  // Check if there's any error passed and render the register page accordingly
  const errorMessage = req.query.error || ""; // If there's an error, display it
  res.render("auth/register", { error: errorMessage });
});

// Route for the Login page
router.get("/login", isAuthenticated, (req, res) => {
  // Check if user is already logged in, if so, redirect to profile
  if (req.user) {
    return res.redirect("/profile");
  }

  // Check if there's any error passed and render the login page accordingly
  const errorMessage = req.query.error || ""; // If there's an error, display it
  res.render("auth/login", { error: errorMessage });
});

// Route to render the user's profile page
router.get("/profile", verifyJWT, async (req, res) => {
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
        `/pages/login?error=Failed to fetch user data: ${response.statusText}`
      );
    }

    // Parse the response body as JSON
    const responseData = await response.json();

    // Check if the response contains user data
    if (!responseData || !responseData.data) {
      console.error("User data is missing or empty:", responseData);
      return res.redirect("/pages/login?error=User data not found");
    }

    // Extract the user data from the response
    const user = responseData.data;

    // Render the profile page with the user data
    res.render("profile", {
      user,
      message: req.query.message || "",
      error: req.query.error || "",
    });
    console.log("User : ", user);
  } catch (err) {
    console.error("Error fetching user data:", err);
    return res.redirect("/pages/login?error=Error fetching user data");
  }
});
router.get("/resource/:slug", verifyJWT, async (req, res) => {
  const { slug } = req.params; // Get the slug from the URL parameter
  console.log("Requested Slug:", slug); // Debugging the slug

  try {
    // Fetch the resource from the existing endpoint
    const response = await fetch(
      `http://localhost:3000/api/v1/users/resource/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${req.cookies.accessToken}`, // Send the token if authentication is needed
        },
      }
    );
    console.log("API Response Status:", response.status); // Log the response status

    if (!response.ok) {
      return res.status(404).render("error", {
        message: "Resource not found",
        error: `Resource with slug "${slug}" not found.`,
      });
    }

    // Parse the JSON response from the resource API
    const resourceData = await response.json();
    console.log("Fetched Resource Data:", resourceData); // Log the fetched resource data

    if (!resourceData?.data) {
      throw new Error("Invalid response structure");
    }

    // Fetch comments for the resource
    const commentsResponse = await fetch(
      `http://localhost:3000/api/v1/users/resources/${slug}/comments`,
      {
        headers: {
          Authorization: `Bearer ${req.cookies.accessToken}`,
        },
      }
    );

    const commentsData = await commentsResponse;
    console.log("Fetched Comments Data:", commentsData); // Log the fetched comments data

    // Render the resource page with the fetched resource and comments data
    res.render("resource", {
      resource: resourceData.data, // Pass the resource data
      comments: commentsData.comments || [], // Pass the comments (empty array if no comments)
      user: req.user, // Pass user data for authentication check (if needed for edit/delete actions)
    });
  } catch (err) {
    console.error("Error fetching resource:", err);
    res.status(500).render("error", {
      message: "An error occurred while fetching the resource.",
      error: err.message,
    });
  }
});

router.get("/upload", verifyJWT, async (req, res) => {
  res.render("upload");
});

// Route to handle login errors (when user is unauthenticated)
router.get("/login-error", (req, res) => {
  // Pass the error message and the original page the user was trying to visit
  res.render("login-error", {
    errorMessage: req.query.error,
    redirectPage: req.query.redirect,
  });
});
// Route to fetch and render the resources page with filters
router.get("/resources", async (req, res) => {
  const { semester, branch, page = 1, searchQuery = "" } = req.query; // Get filter parameters and search term from query string
  console.log("Search Query:", searchQuery); // Debugging the search query
  // Construct the API URL with optional filters and search query
  let apiUrl = `http://localhost:3000/api/v1/users/resources?page=${page}`;

  // Add filters if they are provided
  if (semester) apiUrl += `&semester=${semester}`;
  if (branch) apiUrl += `&branch=${branch}`;
  if (searchQuery) apiUrl += `&searchQuery=${searchQuery}`; // Add search query if provided

  // Get the token from cookies, headers, or session storage (depending on your storage method)
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  // Set up the request options
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // If the token exists, add it to the headers
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(apiUrl, fetchOptions);
    console.log("Response  : ", response);
    // Check if the response is OK and the content is JSON
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON, but received: ${contentType}`);
    }

    const result = await response.json();

    // Check if the API response is successful
    if (result.success === false) {
      return res.render("resources", {
        error: result.message, // Pass the error message to the frontend
        resources: [], // Return empty resources on error
        totalResources: 0,
        totalPages: 0,
        currentPage: 1,
        semester,
        branch,
        searchQuery: searchQuery, // Include the search query
      });
    }

    // Extract the resources and pagination data
    const { resources, totalPages, currentPage, totalResources } = result.data;

    // Pass the resources and pagination data to the frontend
    res.render("resources", {
      resources: resources.docs,
      totalResources,
      totalPages,
      currentPage,
      semester,
      branch,
      error: null, // No error
      searchQuery: searchQuery, // Include the search query
    });
  } catch (err) {
    console.error("Error fetching resources:", err.message);
    res.render("resources", {
      error: "An error occurred while fetching resources. Please try again.", // Error message
      resources: [], // Return empty resources on error
      totalResources: 0,
      totalPages: 0,
      currentPage: 1,
      semester,
      branch,
      searchQuery: searchQuery, // Include the search query in case of error
    });
  }
});

export default router;
