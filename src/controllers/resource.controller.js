import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Resource } from "../models/resource.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// Controller for creating a resource (URL only)
const createResource = asyncHandler(async (req, res) => {
  // console.log("Controller hit");

  // Extract form fields from the request body
  const { title, description, branch, semester, file } = req.body;

  // Validate required fields (checking for empty or undefined values)
  if (
    [title, description, branch, semester, file].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    console.error("Missing required fields");
    return res.redirect("/pages/upload?error=All fields are required");
  }

  // console.log("Form data received:", {
  //   title,
  //   description,
  //   branch,
  //   semester,
  //   file,
  // });

  try {
    // Create the resource in the database
    const resource = await Resource.create({
      title,
      description,
      semester,
      branch,
      file, // Store the URL submitted by the user
      owner: req.user._id, // Set the owner to the current user's ID
    });

    // console.log("Resource created:", resource);

    if (!resource) {
      console.error("Failed to create resource");
      return res.redirect("/pages/upload?error=Failed to create resource");
    }

    // Update the user's resource list
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error("User not found");
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    user.resources.push(resource._id);
    await user.save();
    res
      .status(201)
      .json(
        new ApiResponse(201, { slug: resource.slug }, "resource Uploaded ")
      );
  } catch (error) {
    console.error("Error during resource creation:", error);
    return res.redirect(
      "/pages/upload?error=Internal Server Error: Could not create the resource"
    );
  }
});
const getAllResources = asyncHandler(async (req, res) => {
  // Step 1: Extract query parameters
  const { searchQuery, semester, branch, page = 1, limit = 10 } = req.query;

  // Step 2: Initialize the base filter (only non-blocked resources)
  let filter = { isBlocked: false };

  // Step 3: Apply filters based on query parameters

  // Validate and filter by semester (must be between 1 and 8)
  if (semester) {
    const semesterNum = parseInt(semester);
    if (semesterNum < 1 || semesterNum > 8) {
      throw new ApiError(400, "Semester must be a number between 1 and 8");
    }
    filter.semester = semesterNum; // Filter by semester
  }

  // Filter by branch if provided
  if (branch) {
    const validBranches = [
      "ISE",
      "CSE",
      "ECE",
      "MECH",
      "CIVIL",
      "EEE",
      "AIML",
      "CHEMICAL",
    ];
    if (!validBranches.includes(branch)) {
      throw new ApiError(400, "Invalid branch provided");
    }
    filter.branch = branch; // Filter by branch
  }

  // Step 4: Create the search query if searchQuery is provided
  if (searchQuery) {
    // Use regex to match the searchQuery as a substring (not using word boundaries)
    filter.title = {
      $regex: searchQuery, // Match the searchQuery as part of the title string
      $options: "i", // Case-insensitive matching
    };
  }

  // Step 5: Aggregate query for filtering, searching, and pagination
  const aggregateQuery = Resource.aggregate([
    { $match: filter }, // Match the filter conditions (search and other filters)
    { $sort: { createdAt: -1 } }, // Sort by the most recent resource (createdAt)
    {
      $lookup: {
        from: "users", // Lookup the owner details from the User model
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner", // Unwind the owner array (we expect only one owner)
        preserveNullAndEmptyArrays: true, // Preserve resources without owners
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        semester: 1,
        branch: 1,
        file: 1,
        fileSize: 1,
        isBlocked: 1,
        owner: { fullName: 1, username: 1, avatar: 1 },
        slug: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // Step 6: Apply pagination using mongoose-aggregate-paginate
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const resources = await Resource.aggregatePaginate(aggregateQuery, options);

  // Step 7: If no resources are found, throw an error
  if (!resources || resources.length === 0) {
    throw new ApiError(
      404,
      "No resources found with the given filters or search criteria"
    );
  }

  // Step 8: Return the resources with pagination info
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resources,
        totalResources: resources.totalDocs,
        totalPages: resources.totalPages,
        currentPage: parseInt(page),
      },
      "Resources fetched successfully"
    )
  );
});

const getSingleResource = asyncHandler(async (req, res) => {
  const resourceSlug = req.params; // Extract the resourceSlug from the request parameters
  // console.log(resourceSlug);
  // Log the slug to ensure it’s the expected value
  // console.log("Requested Resource Slug:", resourceSlug);

  // Step 2: Find the resource by slug
  const resource = await Resource.findOne(resourceSlug)
    .populate("owner", "fullName username avatar") // Populate the owner's details
    .exec();

  // Step 3: Check if resource exists or is blocked
  if (!resource) {
    console.error("Resource not found, slug:", resourceSlug);
    throw new ApiError(404, "Resource not found");
  }

  if (resource.isBlocked) {
    console.error("Resource is blocked:", resourceSlug);
    throw new ApiError(404, "Resource is blocked");
  }

  // Step 4: Return the resource with the owner's details
  return res.status(200).json({
    status: 200,
    message: "Resource fetched successfully",
    data: resource, // Resource includes the populated owner field
  });
});
const updateResource = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Extract the resourceSlug from the request parameters
  const { title, description } = req.body; // Extract the title and description from the request body

  // Validate if title and description are provided and not empty
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // Find the resource by slug and ensure the resource exists
  const resource = await Resource.findOne({ slug: resourceSlug });

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 1: Check if the logged-in user is the owner of the resource or an admin
  const isOwner = resource.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  // If neither owner nor admin, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this resource");
  }

  // Step 2: Update the resource title and description
  resource.title = title;
  resource.description = description;

  // Step 3: Save the updated resource to the database
  const updatedResource = await resource.save();

  // Step 4: Return the updated resource along with a success message
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedResource, "Resource updated successfully")
    );
});
const deleteResource = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Extract the resourceSlug from the request parameters

  // Step 1: Find the resource by slug
  const resource = await Resource.findOne({ slug: resourceSlug });

  // If the resource does not exist or is blocked, throw an error
  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Check if the logged-in user is the owner of the resource or an admin
  const isOwner = String(resource.owner) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  // If neither owner nor admin, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this resource");
  }

  // Step 3: Remove the resource reference from the owner's resources array
  await User.updateOne(
    { _id: resource.owner }, // Find the owner of the resource
    { $pull: { resources: resourceSlug } } // Remove the resourceSlug from the owner's resources array
  );

  // Step 4: Delete the resource from the Resource collection
  await Resource.findOneAndDelete({ slug: resourceSlug });

  // Step 5: Return a success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource deleted successfully"));
});

// // Controller for downloading a resource file
// const downloadResource = asyncHandler(async (req, res) => {
//   try {
//     const { filename } = req.params; // Extract filename from URL parameters
//     const resourcePath = path.join(process.cwd(), "uploads", filename); // Build the file path

//     // Check if the file exists in the specified directory
//     if (!path.extname(filename) || !filename.match(/\.(pdf)$/)) {
//       throw new ApiError(
//         400,
//         "Invalid file format. Only PDF files are allowed."
//       );
//     }

//     // Check if file exists
//     res.sendFile(resourcePath, (err) => {
//       if (err) {
//         return next(new ApiError(404, "File not found"));
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// });
export {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
  getSingleResource,
  // downloadResource,
};
