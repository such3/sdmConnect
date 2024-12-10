import { User } from "../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Configure Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
});
// Request Email Verification Handler
export const requestEmailVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Generate a verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // Send verification email
  const domain = process.env.MAILGUN_DOMAIN || "sandbox-123.mailgun.org";
  const verificationUrl = `${req.protocol}://${req.get("host")}/pages/verify-email?token=${verificationToken}&email=${email}`;

  const emailData = {
    from: "Account Verification <no-reply@sdmConnect.com>",
    to: [email],
    subject: "Email Verification",
    text: `Please verify your email by clicking the link: ${verificationUrl}`,
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verificationUrl}">${verificationUrl}</a>`,
  };

  try {
    await mg.messages.create(domain, emailData);
    return res.redirect(
      `/pages/verify-email?status=success&message=Verification%20email%20sent`
    );
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Failed to send verification email"));
  }
});
// Verify Email Handler
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token, email } = req.query;

  const user = await User.findOne({ email });
  if (!user || user.emailVerificationToken !== token) {
    return res.redirect(
      `/pages/verify-email?status=error&message=Invalid%20or%20expired%20verification%20link`
    );
  }

  if (new Date() > user.emailVerificationExpires) {
    return res.redirect(
      `/pages/verify-email?status=error&message=Verification%20link%20has%20expired`
    );
  }

  // Render the page to set the new password
  res.render("set-new-password", { email, token, notyfMessage: null });
});
// Set New Password Handler
export const setNewPassword = asyncHandler(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.emailVerificationToken !== token) {
    return res.redirect(
      `/pages/set-new-password?status=error&message=Invalid%20or%20expired%20token&email=${email}&token=${token}`
    );
  }

  if (new Date() > user.emailVerificationExpires) {
    return res.redirect(
      `/pages/set-new-password?status=error&message=Token%20has%20expired&email=${email}&token=${token}`
    );
  }

  // Update the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.isVerified = true;
  await user.save();

  // Redirect with success message
  return res.redirect(
    `/pages/email-verification?success=true&message=Password%20reset%20successful`
  );
});
