import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Resource } from "../models/resource.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const createResource = asyncHandler(async (req, res) => {
  const { title, description, branch, semester, file } = req.body;

  if (
    [title, description, branch, semester, file].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    console.error("Missing required fields");
    return res.redirect("/pages/upload?error=All fields are required");
  }

  try {
    const resource = await Resource.create({
      title,
      description,
      semester,
      branch,
      file,
      owner: req.user._id, // Set the owner to the current user's ID
    });

    if (!resource) {
      console.error("Failed to create resource");
      return res.redirect("/pages/upload?error=Failed to create resource");
    }

    // Add the created resource's ObjectId to the user's resources array
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error("User not found");
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    user.resources.push(resource._id); // Use resource._id (not the slug)
    await user.save();

    res
      .status(201)
      .json(new ApiResponse(201, { slug: resource.slug }, "Resource uploaded"));
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
  const { resourceSlug } = req.params; // Extract the resourceSlug from the request parameters

  try {
    // Find the resource by slug
    const resource = await Resource.findOne({ slug: resourceSlug })
      .populate("owner", "fullName username avatar") // Populate the owner's details
      .exec();

    // Check if the resource exists
    if (!resource) {
      console.error(`Resource with slug ${resourceSlug} not found.`);
      throw new ApiError(404, "Resource not found");
    }

    // Check if the resource is blocked
    if (resource.isBlocked) {
      console.error(`Resource with slug ${resourceSlug} is blocked.`);
      throw new ApiError(404, "Resource is blocked");
    }

    // Return the resource details
    return res.status(200).json({
      status: 200,
      message: "Resource fetched successfully",
      data: resource, // Resource includes the populated owner field
    });
  } catch (error) {
    console.error("Error fetching resource by slug:", error);
    throw new ApiError(500, "Internal server error while fetching resource");
  }
});

const updateResource = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params; // Extract resourceSlug from request parameters
  const { title, description, semester, branch, file } = req.body; // Extract other fields if needed

  console.log("Resource Slug:", resourceSlug);

  // Validate if title and description are provided and not empty
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // Find the resource by slug (slug is used as the unique identifier in this case)
  const resource = await Resource.findOne({ slug: resourceSlug }); // Use slug to find the resource
  console.log("Resource:", resource);

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found or is blocked");
  }

  // Check if the logged-in user is the owner of the resource or an admin
  const isOwner = resource.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  // If neither owner nor admin, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this resource");
  }

  // Update the resource fields (title and description are mandatory)
  resource.title = title;
  resource.description = description;

  // Optionally, update other fields if provided
  if (semester) resource.semester = semester;
  if (branch) resource.branch = branch;
  if (file) resource.file = file;

  // Save the updated resource to the database
  const updatedResource = await resource.save();

  // Return the updated resource along with a success message
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedResource, "Resource updated successfully")
    );
});

const deleteResource = asyncHandler(async (req, res) => {
  const { resourceSlug } = req.params;

  const resource = await Resource.findOne({ slug: resourceSlug });

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Check if the logged-in user is the owner of the resource or an admin
  const isOwner = String(resource.owner) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this resource");
  }

  // Remove the resource reference from the owner's resources array using resource._id
  await User.updateOne(
    { _id: resource.owner }, // Find the owner of the resource
    { $pull: { resources: resource._id } } // Use resource._id here, not the slug
  );

  // Delete the resource from the Resource collection
  await Resource.findOneAndDelete({ slug: resourceSlug });

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
