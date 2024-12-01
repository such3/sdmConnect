import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// Middleware to verify the access token and authorize the user
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Step 1: Extract the token from cookies, headers, or query parameters
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.query.accessToken;

    // If no token is found, return an error (Unauthorized)
    if (!token) {
      throw new ApiError(401, "You need to login to access this route");
    }

    // Step 2: Verify the token using the secret key
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired, please log in again");
      }
      throw new ApiError(401, "Invalid access token");
    }

    // Step 3: Check if the user ID in the token is valid
    if (
      !decodedToken._id ||
      !mongoose.Types.ObjectId.isValid(decodedToken._id)
    ) {
      throw new ApiError(401, "Invalid user ID in access token");
    }

    // Step 4: Fetch the user associated with the token
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken -__v"
    );

    // If user is not found, throw an error (Invalid Access Token)
    if (!user) {
      throw new ApiError(404, "User Not Found: Invalid Access Token");
    }

    // Step 5: Attach the user to the request object for future use
    req.user = user;

    // Step 6: Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors, such as invalid token, expired token, or other JWT-related issues
    next(error); // Pass the error to your global error handler (avoids manual throw)
  }
});

// Middleware to check if the user is already logged in
export const isAuthenticated = (req, res, next) => {
  const accessToken = req.cookies.accessToken; // Check if there's an access token

  if (accessToken) {
    // If accessToken exists, the user is logged in, so redirect them to /pages/home
    return res.redirect("/pages/home");
  }

  next(); // Proceed with rendering the page if the user is not logged in
};
