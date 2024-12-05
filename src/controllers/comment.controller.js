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

  // Create a new comment
  const newComment = new Comment({
    user: req.user._id, // User who is adding the comment
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
  const { resourceSlug, commentId } = req.params; // Get resourceSlug and commentId from request params
  const { comment } = req.body; // Get the updated comment text from the body

  // Step 1: Find the resource by slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Find the comment by its ID, associated resource, and check if the user is the owner
  const existingComment = await Comment.findOne({
    _id: commentId,
    resource: resource._id, // Ensure the comment is associated with the resource
    user: req.user._id, // Check if the user making the request is the owner of the comment
  });

  // Step 3: If the comment doesn't exist or the user isn't the owner, throw an error
  if (!existingComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Step 4: If the comment exists and the user is the owner, update the comment text
  existingComment.comment = comment;

  // Step 5: Save the updated comment to the database
  await existingComment.save();

  // Step 6: Return success response with the updated comment
  return res.status(200).json({
    message: "Comment updated successfully",
    comment: existingComment, // Send the updated comment object back to the user
  });
});

// 3. Delete a comment
const deleteComment = asyncHandler(async (req, res, next) => {
  const { resourceSlug, commentId } = req.params; // Get resourceSlug and commentId from request params

  // Step 1: Find the resource by slug
  const resource = await Resource.findOne({ slug: resourceSlug });
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Check if the comment exists
  const comment = await Comment.findOne({
    _id: commentId,
    resource: resource._id,
    user: req.user._id,
  });
  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Step 3: Delete the comment
  await comment.deleteOne({ _id: comment._id });

  // Return success response
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
    .populate("user", "fullName username avatar")
    .sort({ createdAt: -1 });

  // Return success response
  return res.status(200).json({
    message: "Comments fetched successfully",
    comments,
  });
});

export { getComments, deleteComment, editComment, addComment };
