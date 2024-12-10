import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
        type: mongoose.Schema.Types.ObjectId,
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // New fields for password reset request tracking
    passwordResetRequests: {
      type: Number,
      default: 0,
    },
    lastPasswordResetRequest: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for hashing password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.password.startsWith("$2b$")) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  const match = await bcrypt.compare(password, this.password);
  return match;
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
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
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );

  this.refreshToken = refreshToken;
  return refreshToken;
};

// Method to check if the user has exceeded the limit of reset requests
userSchema.methods.canRequestPasswordReset = function () {
  const currentTime = new Date();
  const lastRequestTime = this.lastPasswordResetRequest;

  // If no reset request was made before, allow the request
  if (!lastRequestTime) {
    return true;
  }

  // Check if 1 hour has passed since the last request
  const oneHourDifference = (currentTime - lastRequestTime) / 1000 / 60 / 60;

  // If more than 1 hour has passed, reset the counter
  if (oneHourDifference >= 1) {
    this.passwordResetRequests = 0; // Reset request count
    this.lastPasswordResetRequest = currentTime; // Update last request time
  }

  // If the user has made more than 3 requests within the hour, deny the request
  if (this.passwordResetRequests >= 3) {
    return false;
  }

  // Otherwise, allow the request and increment the count
  this.passwordResetRequests += 1;
  this.lastPasswordResetRequest = currentTime; // Update last request time

  return true;
};

export const User = mongoose.model("User", userSchema);
