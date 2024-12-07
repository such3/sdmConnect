import { Comment } from "../models/comment.model.js";
import { Resource } from "../models/resource.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// 1. Add a comment to a resource
const addComment = asyncHandler(async (req, res, next) => {
  const { resourceSlug } = req.params; // Get resourceSlug from request params
  const { comment } = req.body; // Get the comment from the request body

  // Check if the resource exists using the slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Ensure the user is authenticated and has a valid user ID
  if (!req.user || !req.user._id) {
    throw new ApiError(400, "User not authenticated");
  }

  // Create a new comment
  const newComment = new Comment({
    user: req.user._id, // Use req.user._id instead of req.username
    resource: resource._id, // Resource the comment belongs to
    comment,
  });

  // Save the comment to the database
  await newComment.save();

  // Return success response
  return res.status(201).json({
    message: "Comment added successfully",
    comment: newComment,
  });
});

// 2. Edit a comment
const editComment = asyncHandler(async (req, res, next) => {
  const { resourceSlug, uniqueString } = req.params; // Destructure both resourceSlug and uniqueString
  const { comment } = req.body; // Get the updated comment from the request body

  // Find the resource by its slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Find the comment by its uniqueString and ensure it belongs to the correct resource and user
  const existingComment = await Comment.findOne({
    uniqueString, // Match by the uniqueString
    resource: resource._id, // Match by the resource _id
    user: req.user._id, // Ensure the user is the one who created the comment
  });

  if (!existingComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Update the comment text
  existingComment.comment = comment;
  await existingComment.save();

  return res.status(200).json({
    message: "Comment updated successfully",
    comment: existingComment,
  });
});

// 3. Delete a comment
const deleteComment = asyncHandler(async (req, res, next) => {
  const { resourceSlug, uniqueString } = req.params; // Get resourceSlug and uniqueString from params

  // Find the resource by its slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Find the comment by uniqueString and ensure it belongs to the correct resource and user
  const comment = await Comment.findOne({
    uniqueString, // Match by the uniqueString
    resource: resource._id, // Match by the resource _id
    user: req.user._id, // Ensure the user is the one who created the comment
  });

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Delete the comment
  await comment.deleteOne({ _id: comment._id });

  return res.status(200).json({
    message: "Comment deleted successfully",
  });
});

// 4. Get all comments for a resource
const getComments = asyncHandler(async (req, res, next) => {
  const { resourceSlug } = req.params; // Get resourceSlug from request params

  // Find the resource by slug and check if it exists
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Populate the comments with user details
  const comments = await Comment.find({ resource: resource._id })
    .populate("user", "fullName username avatar") // Populating user details
    .sort({ createdAt: -1 }); // Sorting comments by creation date (newest first)

  // Return success response with the comments
  return res.status(200).json({
    message: "Comments fetched successfully",
    comments,
  });
});

export { getComments, deleteComment, editComment, addComment };
