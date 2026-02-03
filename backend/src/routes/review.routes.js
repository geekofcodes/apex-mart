import express from "express";
import * as reviewController from "../controllers/review.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema,
  productIdParamSchema,
  objectIdSchema,
} from "../validations/review.validation.js";

const router = express.Router();

/**
 * Public Routes
 */

// @route   GET /api/v1/reviews/product/:productId
// @desc    Get reviews by product
// @access  Public
router.get(
  "/product/:productId",
  validateMiddleware(productIdParamSchema, "params"),
  validateMiddleware(getReviewsQuerySchema, "query"),
  reviewController.getProductReviews,
);

// @route   GET /api/v1/reviews/product/:productId/stats
// @desc    Get product rating statistics
// @access  Public
router.get(
  "/product/:productId/stats",
  validateMiddleware(productIdParamSchema, "params"),
  reviewController.getProductRatingStats,
);

// @route   GET /api/v1/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  reviewController.getReviewById,
);

/**
 * Protected Routes
 */

// ...

router.post(
  "/",
  protect,
  validateMiddleware(createReviewSchema),
  reviewController.createReview,
);

router.get(
  "/my-reviews",
  protect,
  validateMiddleware(getReviewsQuerySchema, "query"),
  reviewController.getUserReviews,
);

router.put(
  "/:id",
  protect,
  validateMiddleware(objectIdSchema, "params"),
  validateMiddleware(updateReviewSchema),
  reviewController.updateReview,
);

router.delete(
  "/:id",
  protect,
  validateMiddleware(objectIdSchema, "params"),
  reviewController.deleteReview,
);

export default router;
