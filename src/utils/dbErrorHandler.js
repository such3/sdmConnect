import mongoose from "mongoose";

/**
 * Error handling utility for MongoDB related errors in the MERN stack.
 * @param {Error} err - The error object thrown by MongoDB.
 * @returns {Object} - A standardized error response.
 */
const dbErrorHandler = (err) => {
  let error = { message: "", code: 500 };

  // Duplicate key error (usually from unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} must be unique. This value is already in use.`;
    error.code = 400; // Bad request
  }
  // Validation error (usually from schema validation issues)
  else if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((val) => val.message);
    error.message = errors.join(", ");
    error.code = 400; // Bad request
  }
  // Cast error (invalid type or malformed data sent to MongoDB)
  else if (err instanceof mongoose.Error.CastError) {
    error.message = `Invalid value for ${err.path}: ${err.value}`;
    error.code = 400; // Bad request
  }
  // Other unknown errors
  else {
    error.message = "Something went wrong with the database.";
    error.code = 500; // Internal Server Error
  }

  return error;
};

export default dbErrorHandler;
