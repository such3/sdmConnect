import mongoose from "mongoose";
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import error handler

const ratingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, "Please provide a rating between 1 and 5"],
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Error handling middleware for MongoDB errors
ratingSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility
  next(err);
});

export const Rating = mongoose.model("Rating", ratingSchema);
