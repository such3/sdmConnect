import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

// Initialize environment variables from .env file
dotenv.config();

const app = express();

// Set EJS as the view engine and specify the views directory
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));
console.log("Views directory:", path.join(process.cwd(), "src", "views"));

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), "public")));

// Serve static files from 'uploads' folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security middlewares
app.use(helmet());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "img-src 'self' *; " + // Allow images from any source
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " + // Allow external scripts from jsdelivr CDN
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " + // Allow external styles from jsdelivr CDN
      "font-src 'self' https://fonts.gstatic.com; " + // Allow Google Fonts
      "connect-src 'self'; " + // Allow connections to self (for AJAX or WebSockets)
      "frame-src 'none';" // Disallow embedding content in frames
  );
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Import your routes
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import frontEndRouter from "./routes/pages.routes.js";

// Default route to render the 'index.ejs' template
app.get("/", (req, res, next) => {
  try {
    res.status(200).render("index", { title: "sdmConnect" });
  } catch (error) {
    console.error("Error rendering template:", error);
    next(error);
  }
});

// API routes for users and admin
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/pages/", frontEndRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer Error: ${err.message}` });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal Server Error" });
});

// Catch-all for undefined routes (404 handler)
app.all("*", (req, res) => {
  // Render the 404 page with a custom message
  res
    .status(404)
    .render("404", { error: `Route ${req.originalUrl} not found` });
});

export default app;
