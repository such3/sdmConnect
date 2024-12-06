import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // Import the uuid package to generate unique strings
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import error handler

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      min: [3, "Comment must be at least 3 characters long"],
      max: [1000, "Comment must be at most 1000 characters long"],
    },
    uniqueString: {
      type: String,
      unique: true, // Ensure the unique string is unique across all documents
      required: true,
      default: () => uuidv4(), // Generate a unique string using uuidv4 by default
    },
  },
  {
    timestamps: true,
  }
);

// Error handling middleware for MongoDB errors
commentSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility
  next(err);
});

export const Comment = mongoose.model("Comment", commentSchema);
