import { User } from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import formData from "form-data";
import Mailgun from "mailgun.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middleware/asyncHandler.js";

// Configure Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
});

// Request Password Reset Handler
export const requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP and expiration in the database
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpires = otpExpires;
  await user.save();

  // Send OTP email using Mailgun
  const domain = process.env.MAILGUN_DOMAIN || "sandbox-123.mailgun.org";
  const emailData = {
    from: "Password Reset <no-reply@yourdomain.com>",
    to: [email],
    subject: "Password Reset Request",
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    html: `<p>Your OTP is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`,
  };

  try {
    await mg.messages.create(domain, emailData);
    return res
      .status(200)
      .json(new ApiResponse(200, "OTP sent to your email", null));
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Failed to send OTP email"));
  }
});

// Verify OTP Handler
export const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.passwordResetOtp !== otp) {
    return next(new ApiError(400, "Invalid OTP"));
  }

  if (new Date() > user.passwordResetOtpExpires) {
    return next(new ApiError(400, "OTP expired"));
  }

  // If OTP is valid, render reset password page with email and OTP
  return res.render("reset-password", {
    email,
    otp,
    notyfMessage: "OTP verified. Please reset your password.",
  });
});

// Reset Password Handler
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.passwordResetOtp !== otp) {
    return next(new ApiError(400, "Invalid OTP"));
  }

  if (new Date() > user.passwordResetOtpExpires) {
    return next(new ApiError(400, "OTP expired"));
  }

  // Update the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.passwordResetOtp = null;
  user.passwordResetOtpExpires = null;
  await user.save();

  // Redirect to login page with a success message
  return res.render("auth/login", {
    notyfMessage: "Password reset successfully. You can now log in.",
  });
});
