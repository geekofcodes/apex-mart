import express from "express";
import * as seedController from "../controllers/seed.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

/**
 * Admin-only Routes
 */

// @route   POST /api/v1/admin/seed/products
// @desc    Seed products and categories from external API
// @access  Private/Admin
router.post(
  "/seed/products",
  protect,
  authorize("admin"),
  seedController.seedProducts,
);

export default router;
