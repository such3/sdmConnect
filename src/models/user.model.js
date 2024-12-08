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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
      min: [8, "Password must be at least 8 characters long"],
      // validate: {
      //   validator: function (v) {
      //     // Password should contain at least:
      //     // 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and minimum length of 8
      //     return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(
      //       v
      //     );
      //   },
      //   message:
      //     "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      // },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    // New fields for OTP functionality
    passwordResetOtp: {
      type: String, // Store OTP as a string
    },
    passwordResetOtpExpires: {
      type: Date, // Store expiration time for OTP
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

// Method to generate an access token for the user
userSchema.methods.generateAccessToken = function () {
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
};

// Method to generate a refresh token for the user and save it to the database
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

export const User = mongoose.model("User", userSchema);
