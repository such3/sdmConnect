import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Ensure the localFilePath exists
    if (!localFilePath) {
      console.error("No file path provided for upload.");
      return null;
    }

    // Log the file path for debugging
    console.log("Uploading file from:", localFilePath);

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect the resource type
    });

    // Log the full response for debugging (including the URL)
    console.log("Cloudinary upload response:", response);

    // Remove the file from the local server asynchronously
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error("Error removing the local file:", err);
      } else {
        console.log(`Local file removed: ${localFilePath}`);
      }
    });

    // Return the Cloudinary response
    return response;
  } catch (error) {
    // Log the error for debugging (including the full error object)
    console.error("Error during Cloudinary upload: ", error);

    // Check if the file exists before attempting to remove it
    if (localFilePath && fs.existsSync(localFilePath)) {
      // Remove the file from the server to avoid leaving temporary files
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error("Error removing the temporary file:", err);
        } else {
          console.log("Temporary file removed from the server:", localFilePath);
        }
      });
    }

    // Return null to indicate failure
    return null;
  }
};

export { uploadOnCloudinary };
