import { v2 as cloudinary } from "cloudinary";
import envConfig from "./env.config.js";
import logger from "../utils/logger.js";

/**
 * Configure Cloudinary with environment variables
 */
export const configureCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: envConfig.cloudinary.cloudName,
      api_key: envConfig.cloudinary.apiKey,
      api_secret: envConfig.cloudinary.apiSecret,
    });
    logger.info("Cloudinary configured successfully");
  } catch (error) {
    logger.error(`Failed to configure Cloudinary: ${error.message}`);
  }
};

export default cloudinary;
