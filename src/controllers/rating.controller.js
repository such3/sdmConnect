import { Rating } from "../models/rating.model.js";
import { Resource } from "../models/resource.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Add rating for a resource
const rateResource = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Get resourceSlug from params
  const { rating } = req.body;

  // Validate rating value (1-5)
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Check if resource exists using the slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Check if the user has already rated this resource
  const existingRating = await Rating.findOne({
    user: req.user._id,
    resource: resource._id, // Still use the internal _id for rating association
  });

  if (existingRating) {
    // If rating exists, update it
    existingRating.rating = rating;
    await existingRating.save();
  } else {
    // Create a new rating
    await Rating.create({
      user: req.user._id,
      resource: resource._id, // Use _id for storing the resource reference
      rating,
    });
  }

  // Recalculate the average rating for the resource
  const avgRating = await resource.getAverageRating();

  // Respond with updated average rating
  return res.status(200).json({
    status: "success",
    message: "Rating submitted successfully",
    data: { averageRating: avgRating },
  });
});

// Get average rating of a resource
const getResourceRating = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Get resourceSlug from params

  // Find the resource using slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Get the average rating from the resource model
  const avgRating = await resource.getAverageRating();

  // Respond with the average rating
  return res.status(200).json({
    status: "success",
    data: { averageRating: avgRating },
  });
});

// Remove rating for a resource
const removeRating = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Get the resourceSlug from the request params

  // Step 1: Check if the resource exists using the slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Check if the user has rated this resource
  const rating = await Rating.findOne({
    user: req.user._id,
    resource: resource._id, // Still using the resource _id to find the rating
  });

  if (!rating) {
    throw new ApiError(404, "You have not rated this resource yet");
  }

  // Step 3: Remove the user's rating for the resource
  await Rating.deleteOne({ _id: rating._id });

  // Step 4: Optionally, recalculate the average rating for the resource if needed
  const avgRating = await resource.getAverageRating();

  // Step 5: Respond with success message
  return res.status(200).json({
    status: "success",
    message: "Your rating has been removed successfully",
    data: { averageRating: avgRating }, // Include the updated average rating
  });
});

export { rateResource, getResourceRating, removeRating };
