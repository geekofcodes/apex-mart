import reviewService from "../services/review.service.js";
import ReviewDTO from "../dtos/review.dto.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Review Controller - Handles all review related requests
 */

/**
 * Create a review
 * @route   POST /api/v1/reviews
 * @access  Private
 */
export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const review = await reviewService.createReview(userId, req.body);

  return ApiResponse.success(
    res,
    "Review created successfully",
    ReviewDTO.reviewResponse(review),
    HTTP_STATUS.CREATED,
  );
});

/**
 * Get product reviews
 * @route   GET /api/v1/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await reviewService.getReviewsByProduct(productId, req.query);

  return ApiResponse.success(
    res,
    "Reviews retrieved successfully",
    ReviewDTO.reviewListResponse(result.reviews),
    HTTP_STATUS.OK,
    result.pagination,
  );
});

/**
 * Get product rating statistics
 * @route   GET /api/v1/reviews/product/:productId/stats
 * @access  Public
 */
export const getProductRatingStats = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const stats = await reviewService.getProductRatingStats(productId);

  return ApiResponse.success(
    res,
    "Product rating stats retrieved successfully",
    stats,
  );
});

/**
 * Get review by ID
 * @route   GET /api/v1/reviews/:id
 * @access  Public
 */
export const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await reviewService.getReviewById(id);

  return ApiResponse.success(
    res,
    "Review retrieved successfully",
    ReviewDTO.reviewResponse(review),
  );
});

/**
 * Get user reviews
 * @route   GET /api/v1/reviews/me
 * @access  Private
 */
export const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await reviewService.getUserReviews(userId, req.query);

  return ApiResponse.success(
    res,
    "User reviews retrieved successfully",
    ReviewDTO.reviewListResponse(result.reviews),
    HTTP_STATUS.OK,
    result.pagination,
  );
});

/**
 * Update a review
 * @route   PATCH /api/v1/reviews/:id
 * @access  Private
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const review = await reviewService.updateReview(id, userId, req.body);

  return ApiResponse.success(
    res,
    "Review updated successfully",
    ReviewDTO.reviewResponse(review),
  );
});

/**
 * Delete a review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;
  await reviewService.deleteReview(id, userId, userRole);

  return ApiResponse.success(res, "Review deleted successfully");
});
