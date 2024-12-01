import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// User Schema
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      lowercase: true,
      min: [3, "Username must be at least 3 characters long"],
      trim: true,
      unique: [true, "Username is already in use"],
      index: true,
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores.",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: [true, "Email is already in use"],
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        "Please provide a valid email address",
      ],
    },
    fullName: {
      type: String,
      min: [3, "Fullname must be at least 3 characters long"],
      required: [true, "Fullname is required"],
      trim: true,
      match: [
        /^[a-zA-Z\s]+$/,
        "Full name can only contain letters and spaces.",
      ],
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    bio: {
      type: String,
      min: [10, "Bio must be at least 10 characters long"],
      max: [500, "Bio must be at most 500 characters long"],
      default: "Hello, I'm new here!",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resources: [
      {
        type: Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
      min: [8, "Password must be at least 8 characters long"],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for hashing password
userSchema.pre("save", async function (next) {
  console.log("Pre-save hook triggered for user:", this.username);

  if (!this.isModified("password") || this.password.startsWith("$2b$")) {
    // console.log("Password not modified or already hashed, skipping hash");
    return next();
  }

  try {
    // console.log("Hashing password...");
    this.password = await bcrypt.hash(this.password, 10);
    // console.log("Password hashed successfully");
    next();
  } catch (error) {
    // console.error("Error while hashing password:", error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  // console.log(
  //   "Checking if provided password matches the stored hash for user:",
  //   this.username
  // ); // Log username for which we are checking the password

  // Log the stored hashed password for debugging (ensure it's a hash, not plain text)
  // console.log("Stored password hash:", this.password);

  const match = await bcrypt.compare(password, this.password);

  // console.log("Password match result:", match); // true or false based on comparison
  return match;
};

// Method to generate an access token for the user
userSchema.methods.generateAccessToken = function () {
  try {
    // console.log("Generating access token for user:", this.username);
    const accessToken = jwt.sign(
      {
        _id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
    return accessToken;
  } catch (error) {
    // console.error("Error generating access token:", error);
    throw new Error("Token generation failed");
  }
};

// Method to generate a refresh token for the user and save it to the database
userSchema.methods.generateRefreshToken = function () {
  // console.log("Generating refresh token for user:", this.username); // Debugging line
  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );

  console.log("Refresh token generated:", refreshToken); // Debugging line

  // Save the refresh token in the user document
  this.refreshToken = refreshToken;
  // console.log("Refresh token saved to user record"); // Debugging line
  return refreshToken;
};

export const User = mongoose.model("User", userSchema);
