import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import formData from "form-data";
import Mailgun from "mailgun.js";

// Mailgun Configuration
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
});

// Handle Email Verification Request
export const requestEmailVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.redirect(
      `/pages/email-verification?message=User%20not%20found&type=error`
    );
  }

  // Check if the user has exceeded the limit of password reset requests in the last hour
  const lastRequestTime = user.lastPasswordResetRequest || new Date(0);
  const timeDifference = Date.now() - lastRequestTime.getTime();
  const requestsInLastHour = timeDifference < 3600000; // 1 hour = 3600000 ms

  if (user.passwordResetRequests >= 3 && requestsInLastHour) {
    return res.redirect(
      `/pages/email-verification?message=You%20have%20reached%20the%20limit%20of%203%20password%20reset%20requests%20per%20hour&type=error`
    );
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  user.lastPasswordResetRequest = new Date();
  user.passwordResetRequests = requestsInLastHour
    ? user.passwordResetRequests + 1
    : 1;
  await user.save();

  // Send email with verification link
  const verificationUrl = `${req.protocol}://${req.get("host")}/pages/set-new-password?token=${verificationToken}&email=${email}`;

  const emailData = {
    from: "SDMConnect <no-reply@sdmConnect.com>",
    to: [email],
    subject: "Please Verify Your Email Address - SDMConnect",
    text: `Hello,\n\nPlease verify your email address by clicking the link below to reset your password. If you did not request this, please ignore this email. If you have any concerns, don't hesitate to report it to us.\n\nVerification Link: ${verificationUrl}\n\nBest regards,\nSDMConnect Team`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <tr>
                    <td style="background-color: #4caf50; padding: 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">SDMConnect</h1>
                      <p style="color: #ffffff; font-size: 16px;">Email Verification</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <p style="font-size: 18px; color: #333333;">Hello,</p>
                      <p style="font-size: 16px; color: #555555;">We have received a request to verify your email address. Please click the link below to reset your password:</p>
                      <p style="text-align: center;">
                        <a href="${verificationUrl}" style="font-size: 16px; background-color: #4caf50; color: #ffffff; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Verify Your Email</a>
                      </p>
                      <p style="font-size: 16px; color: #555555;">If you did not request a password reset, please ignore this email. If you have any concerns, feel free to <a href="mailto:support@sdmconnect.com" style="color: #4caf50; text-decoration: none;">contact us</a>.</p>
                      <p style="font-size: 14px; color: #777777;">Best regards,</p>
                      <p style="font-size: 14px; color: #777777;">The SDMConnect Team</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f4f4f4; padding: 10px; text-align: center;">
                      <p style="font-size: 12px; color: #777777;">If you did not request this, you can safely ignore this email.</p>
                      <p style="font-size: 12px; color: #777777;">&copy; 2024 SDMConnect. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
    return res.redirect(
      `/pages/email-verification?message=Verification%20email%20sent&type=success`
    );
  } catch (error) {
    return next(new ApiError(500, "Failed to send verification email"));
  }
});

// Verify Email and Show Set New Password Page
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token, email } = req.query;

  const user = await User.findOne({ email });
  if (!user || user.emailVerificationToken !== token) {
    return res.redirect(
      `/pages/set-new-password?message=Invalid%20or%20expired%20token&type=error&email=${email}&token=${token}`
    );
  }

  if (new Date() > user.emailVerificationExpires) {
    return res.redirect(
      `/pages/set-new-password?message=Token%20expired&type=error&email=${email}&token=${token}`
    );
  }

  res.render("set-new-password", { email, token });
});

// Set New Password and Redirect to Login
export const setNewPassword = asyncHandler(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.emailVerificationToken !== token) {
    return res.redirect(
      `/pages/set-new-password?message=Invalid%20or%20expired%20token&type=error&email=${email}&token=${token}`
    );
  }

  if (new Date() > user.emailVerificationExpires) {
    return res.redirect(
      `/pages/set-new-password?message=Token%20expired&type=error&email=${email}&token=${token}`
    );
  }

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.isVerified = true;
  user.passwordResetRequests = 0; // Reset password requests after a successful password reset
  await user.save();

  return res.redirect(
    `/pages/success?message=Password%20reset%20successful!%20You%20can%20now%20log%20in&type=success`
  );
});
