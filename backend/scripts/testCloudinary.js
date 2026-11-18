
import dotenv from "dotenv";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

const testCloudinary = async () => {
  try {
    const result = await cloudinary.api.ping();

    console.log("Cloudinary Connected Successfully!");
    console.log("Status:", result.status);
  } catch (error) {
    console.error("Cloudinary Connection Failed:", error.message);
    process.exitCode = 1;
  }
};

testCloudinary();
