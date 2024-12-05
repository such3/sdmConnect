import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Rating } from "./rating.model.js";
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import error handler
import slugify from "slugify"; // Import slugify to generate slugs
import crypto from "crypto";
const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      min: [3, "Title must be at least 3 characters long"],
      max: [255, "Title must be at most 255 characters long"],
      index: true,
    },
    description: {
      min: [10, "Description must be at least 10 characters long"],
      max: [500, "Description must be at most 500 characters long"],
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      max: [8, "Semester can be Maximum 8"],
      min: [1, "Semester can be Minimum 1"],
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      enum: ["ISE", "CSE", "ECE", "MECH", "CIVIL", "EEE", "AIML", "CHEMICAL"],
    },
    file: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slug: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.pre("save", async function (next) {
  try {
    // Ensure title exists
    if (!this.title || this.title.trim() === "") {
      return next(new Error("Title is required to generate a slug."));
    }

    // Generate the slug from the title
    this.slug = slugify(this.title, { lower: true, strict: true });

    // Check if the slug already exists in the database
    let existingResource = await mongoose.models.Resource.findOne({
      slug: this.slug,
    });

    // If the slug exists, append a unique identifier to make it unique
    while (existingResource) {
      // Generate a random string and append it to the slug
      this.slug = `${slugify(this.title, { lower: true, strict: true })}-${crypto.randomBytes(4).toString("hex")}`;
      existingResource = await mongoose.models.Resource.findOne({
        slug: this.slug,
      });
    }

    // Continue with save operation
    next();
  } catch (error) {
    console.error("Error generating slug:", error);
    next(error); // Pass the error to the next middleware
  }
});
// Method to get the average rating
resourceSchema.methods.getAverageRating = async function () {
  try {
    const ratings = await Rating.aggregate([
      { $match: { resource: this._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    return ratings.length > 0 ? ratings[0].avgRating : 0;
  } catch (error) {
    const err = dbErrorHandler(error); // Handle any errors during aggregation
    throw err; // Re-throw the error to propagate it
  }
};

// Pagination plugin
resourceSchema.plugin(mongooseAggregatePaginate);

// Error handling middleware for MongoDB errors
resourceSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility
  next(err);
});

// Error handling for update and delete operations (Optional)
resourceSchema.post("findOneAndUpdate", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility
  next(err);
});

resourceSchema.post("deleteOne", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the error handler utility
  next(err);
});

export const Resource = mongoose.model("Resource", resourceSchema);
