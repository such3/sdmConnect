import asyncHandler from "../utils/asyncHandler.js"; // Utility to handle async functions with error handling
import { ApiError } from "../utils/ApiError.js"; // Custom error handler
import { User } from "../models/user.model.js"; // User model for interacting with the database
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Utility to upload images to Cloudinary
import bcrypt from "bcrypt"; // Library for hashing passwords
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response structure
import jwt from "jsonwebtoken";

// Function to generate access and refresh tokens for the user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); // Find user by ID
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken(); // Generate access token
    const refreshToken = user.generateRefreshToken(); // Generate refresh token

    // Store the refresh token in the user's record for future use
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }; // Return both tokens
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};
// Register user and return JSON response using ApiResponse
const registerUser = asyncHandler(async (req, res) => {
  // If user is already logged in, redirect them to /pages/home
  if (req.cookies.accessToken) {
    return res.redirect("/pages/profile"); // Redirect to the home page
  }

  const { fullName, email, username, password } = req.body;

  // Check if all fields are filled
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    return res.redirect(
      `/pages/register?error=${encodeURIComponent("All fields are required")}`
    );
  }

  // Check if user with the same username or email already exists
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    return res.redirect(
      `/pages/register?error=${encodeURIComponent("User with username or email already exists")}`
    );
  }

  // Avatar and cover image upload logic
  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path : null;
  let coverImageLocalPath;
  if (req.files?.coverImage?.length > 0) {
    coverImageLocalPath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    return res.redirect(
      `/pages/register?error=${encodeURIComponent("Avatar is required")}`
    );
  }

  let avatar, coverImage;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
      return res.redirect(
        `/pages/register?error=${encodeURIComponent("Avatar upload failed")}`
      );
    }

    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      coverImage = coverImage?.url || null;
    }
  } catch (error) {
    return res.redirect(
      `/pages/register?error=${encodeURIComponent(`File upload error: ${error.message}`)}`
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage,
      email,
      password: hashedPassword,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return res.redirect(
        `/pages/register?error=${encodeURIComponent("User registration failed")}`
      );
    }

    return res.redirect("/pages/login?success=true");
  } catch (error) {
    console.error("Error during user creation:", error);
    return res.redirect(
      `/pages/register?error=${encodeURIComponent("An error occurred while registering. Please try again.")}`
    );
  }
});
const loginUser = asyncHandler(async (req, res) => {
  // If user is already logged in, redirect them to /pages/profile
  if (req.cookies.accessToken) {
    return res.redirect(
      "/pages/profile?message=" + encodeURIComponent("Login successful")
    );
  }

  const { email, password } = req.body;

  // Check if both email and password are provided
  if (!email || !password) {
    return res.redirect(
      `/pages/login?error=${encodeURIComponent("Email and password are required")}`
    );
  }

  // Find user by email
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect(
      `/pages/login?error=${encodeURIComponent("User not found")}`
    );
  }

  // Compare the provided password with the stored password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.redirect(
      `/pages/login?error=${encodeURIComponent("Invalid credentials")}`
    );
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Set cookie options for secure cookies
  const cookieOptions = { httpOnly: true, secure: true };

  // Set the cookies for the tokens
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);

  // Redirect to the profile page after login with a success message
  res.redirect(
    "/pages/profile?message=" + encodeURIComponent("Login successful")
  );
});

// Logout user and return JSON response using ApiResponse
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const cookieOptions = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

// Fetch current user and return JSON response using ApiResponse
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

// Update account details and return JSON response using ApiResponse
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, bio } = req.body;
  if (!fullName || !bio) {
    throw new ApiError(400, "Full Name and Bio are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, bio } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account updated successfully"));
});

// Update user avatar and return JSON response using ApiResponse
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

// Update user cover image and return JSON response using ApiResponse
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: coverImage.url },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

// Change current password and return JSON response using ApiResponse
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// Refresh the access token and return JSON response using ApiResponse
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or expired Refresh Token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired Refresh Token");
  }
});

const publicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; // Get the username from the URL parameter
  console.log("Requested username:", username); // Debugging line

  // Step 1: Find the user by username
  const user = await User.findOne({ username }).populate(
    "resources",
    "title description semester branch file"
  );

  // Step 2: If user not found, throw an error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log("User data:", user); // Debugging line
  console.log("Populated resources:", user.resources); // Debugging line

  // Step 3: Return the user profile along with their resources
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        resources: user.resources || [], // Handle empty resources
      },
      "User profile fetched successfully"
    )
  );
});

export {
  publicProfile,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  changeCurrentPassword,
  refreshAccessToken,
};
