import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // Use the promise-based version of fs

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary and remove it locally
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No file path provided for upload.");
      return null;
    }

    console.log("Uploading file from:", localFilePath);

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("Cloudinary upload response:", response);

    // Remove the file from the local server after a successful upload
    await fs.unlink(localFilePath);
    console.log(`Local file removed: ${localFilePath}`);

    return response;
  } catch (error) {
    console.error("Error during Cloudinary upload: ", error);

    // Ensure the temporary file is cleaned up even on failure
    if (localFilePath && await fileExists(localFilePath)) {
      try {
        await fs.unlink(localFilePath);
        console.log("Temporary file removed from the server:", localFilePath);
      } catch (unlinkError) {
        console.error("Error removing the temporary file:", unlinkError);
      }
    }

    return null;
  }
};

// Helper function to check if a file exists
const fileExists = async (path) => {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
};

export { uploadOnCloudinary };
