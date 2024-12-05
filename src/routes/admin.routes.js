import {
  deleteUser,
  blockResource,
  unblockResource,
} from "../controllers/admin.controller.js"; // Import admin controller functions
import { adminDashboard } from "../controllers/admin.controller.js";
import { Router } from "express"; // Import Router from express
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT
import { verifyAdmin } from "../middlewares/admin.middleware.js"; // Admin check middleware

// Create a new Router instance
const router = Router();

// Admin-only routes

// Uncomment the following routes when needed
// router
//   .route("/admin/block-user/:userId")
//   .patch(verifyJWT, verifyAdmin, blockUser);

// router
//   .route("/admin/unblock-user/:userId")
//   .patch(verifyJWT, verifyAdmin, unblockUser);

router.route("/delete-user/:userId").delete(verifyJWT, verifyAdmin, deleteUser);

// Use slug instead of resourceId for blocking/unblocking resources
router
  .route("/block-resource/:slug")
  .patch(verifyJWT, verifyAdmin, blockResource); // Block resource by slug

router
  .route("/unblock-resource/:slug")
  .patch(verifyJWT, verifyAdmin, unblockResource); // Unblock resource by slug

// Admin dashboard route to fetch analytics and statistics
router.route("/admin/dashboard").get(verifyJWT, verifyAdmin, adminDashboard);

export default router;
