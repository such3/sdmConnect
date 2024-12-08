import express from "express";
import {
  requestPasswordReset,
  verifyOtp,
  resetPassword,
} from "../controllers/passwordController.js";

const router = express.Router();

// Route to request password reset
router.post("/request-reset", requestPasswordReset);

// Route to verify OTP
router.post("/verify-otp", verifyOtp);

// Route to reset password
router.post("/reset", resetPassword);

export default router;
