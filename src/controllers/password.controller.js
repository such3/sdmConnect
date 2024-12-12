import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
});

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  console.error("Mailgun environment variables are not properly set.");
  process.exit(1);  // Exit the process if required environment variables are missing.
}

// Handle Email Verification Request
// Handle Email Verification Request
// Handle Email Verification Request
export const requestEmailVerification = asyncHandler(async (req, res, next) => {
  console.log("Received request for email verification");

  try {
    const { email } = req.body;

    console.log(`Request received to verify email: ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
      console.error("User not found in database.");
      return res.redirect(
        `/pages/email-verification?message=User not found&type=error`
      );
    }

    console.log("User found, generating verification token");

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.lastPasswordResetRequest = new Date();
    user.passwordResetRequests = 1;  // Just setting it to 1 as there's no limit now.

    await user.save();

    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/pages/set-new-password?token=${verificationToken}&email=${email}`;

    const emailData = {
      from: "SDMConnect <no-reply@sdmConnect.com>",
      to: [email],
      subject: "Please Verify Your Email Address - SDMConnect",
      text: `Hello,

Please verify your email address by clicking the link below to reset your password. If you did not request this, please ignore this email.

Verification Link: ${verificationUrl}

Best regards,
SDMConnect Team`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 15px rgba(0,0,0,0.2);
              }
              .btn {
                display: inline-block;
                background: #4CAF50;
                color: #fff;
                padding: 15px 25px;
                text-decoration: none;
                font-weight: bold;
                border-radius: 5px;
                text-align: center;
                transition: background 0.3s ease;
              }
              .btn:hover {
                background: #45a049;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>SDMConnect</h1>
              <p>Hello <strong>${email}</strong>,</p>
              <p>We received a request to verify your email address.</p>

              <p>
                <a href="${verificationUrl}" class="btn">Verify Your Email</a>
              </p>

              <p>If you did not request this password reset, please ignore this message.</p>

              <p>Thank you for using <strong>SDMConnect</strong>.</p>
            </div>
          </body>
        </html>
      `,
    };

    console.log("Sending email via Mailgun");

    try {
      await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
      console.log("Verification email successfully sent.");
      return res.redirect(
        `/pages/email-verification?message=Verification email sent&type=success`
      );
    } catch (emailError) {
      console.error("Failed to send email via Mailgun", emailError);
      return next(new ApiError(500, "Failed to send verification email"));
    }
  } catch (error) {
    console.error("An error occurred in requestEmailVerification:", error);
    next(new ApiError(500, "Internal Server Error"));
  }
});


// Verify Email Token
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token, email } = req.query;

  console.log(`Verifying email for token: ${token}, email: ${email}`);

  try {
    const user = await User.findOne({ email });

    if (!user || user.emailVerificationToken !== token) {
      console.error("Invalid or expired token.");
      return res.redirect(
        `/pages/set-new-password?message=Invalid or expired token&type=error`
      );
    }

    if (new Date() > user.emailVerificationExpires) {
      console.error("Token expired.");
      return res.redirect(
        `/pages/set-new-password?message=Token expired&type=error`
      );
    }

    console.log("Token valid, rendering the new password view.");
    res.render("set-new-password", { email, token });
  } catch (error) {
    console.error("An error occurred in verifyEmail:", error);
    next(new ApiError(500, "Internal Server Error"));
  }
});

export const setNewPassword = asyncHandler(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  console.log(`Setting new password for email: ${email}`);

  try {
    const user = await User.findOne({ email });

    if (!user || user.emailVerificationToken !== token) {
      console.error("Invalid or expired token.");
      return res.redirect(
        `/pages/set-new-password?message=Invalid or expired token&type=error`
      );
    }

    if (new Date() > user.emailVerificationExpires) {
      console.error("Token expired.");
      return res.redirect(
        `/pages/set-new-password?message=Token expired&type=error`
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.isVerified = true;
    user.passwordResetRequests = 0;

    await user.save();

    console.log("Password reset successful.");
    return res.redirect(
      `/pages/success?message=Password reset successful&type=success`
    );
  } catch (error) {
    console.error("An error occurred while setting a new password:", error);
    next(new ApiError(500, "Internal Server Error"));
  }
});
