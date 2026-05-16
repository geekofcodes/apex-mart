import externalProductSeedService from "../services/externalProductSeed.service.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import envConfig from "../config/env.config.js";

/**
 * Seed Controller - Admin-only seeding operations
 */

/**
 * @route   POST /api/v1/admin/seed/products
 * @desc    Seed products and categories from external API
 * @access  Private/Admin
 */
export const seedProducts = asyncHandler(async (req, res) => {
  // Prevent seeding in production
  if (envConfig.nodeEnv === "production") {
    throw new AppError(
      "Seeding is disabled in production environment",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const result = await externalProductSeedService.seedAll();

  return ApiResponse.success(
    res,
    "Products seeded successfully",
    {
      categoriesCreated: result.categoriesCreated,
      productsCreated: result.productsCreated,
      productsSkipped: result.productsSkipped,
    },
    HTTP_STATUS.OK,
  );
});
