import reviewRepository from "../repositories/review.repository.js";
import productRepository from "../repositories/product.repository.js";
import orderRepository from "../repositories/order.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";
import Pagination from "../utils/pagination.js";

/**
 * Review Service — production-hardened.
 *
 * Responsibilities:
 *  - Input validation (rating range, review existence)
 *  - Ownership enforcement using user.id (Prisma) not user._id (Mongo)
 *  - Verified-purchase gate
 *  - Product rating cache sync after every mutation
 */
class ReviewService {
  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Validate rating value is an integer in [1, 5].
   */
  #validateRating(rating) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new AppError("Rating must be an integer between 1 and 5", HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Ownership check using review.user.id (Prisma normalised shape).
   * Throws 403 if the user is not the review owner (and is not admin).
   */
  #assertOwnership(review, userId, userRole = "CUSTOMER") {
    if (userRole === "ADMIN") return;
    const ownerId = review.user?.id ?? null;   // normalised shape exposes .id
    if (!ownerId || ownerId !== userId.toString()) {
      throw new AppError(
        "You do not have permission to modify this review",
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }

  /**
   * Extract product ID from a normalised review object.
   * Handles both object shape ({ id }) and raw string.
   */
  #getProductId(review) {
    return review.product?.id ?? review.product ?? null;
  }

  /**
   * Sync product's averageRating + totalReviews after any review mutation.
   */
  async #syncProductRating(productId) {
    if (!productId) return;
    const stats = await reviewRepository.calcAverageRating(productId);
    await productRepository.updateRatingStats(productId, stats);
  }

  // ─── Purchase verification ────────────────────────────────────────────────

  async hasUserPurchasedProduct(userId, productId) {
    return orderRepository.hasUserPurchasedProduct(userId, productId);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * Create a review.
   *  - Validates rating
   *  - Enforces one-review-per-product-per-user
   *  - Sets isVerifiedPurchase based on order history
   *  - Syncs product rating cache
   */
  async createReview(userId, reviewData) {
    const { productId, rating, title, comment } = reviewData;

    // Validate rating
    this.#validateRating(rating);

    // Confirm product exists and is active
    const product = await productRepository.findById(productId, false);
    if (!product || !product.isActive) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    // One review per user per product
    const existingReview = await reviewRepository.findByUserAndProduct(userId, productId);
    if (existingReview) {
      throw new AppError(
        "You have already reviewed this product. Update your existing review instead.",
        HTTP_STATUS.CONFLICT,
      );
    }

    // Verified-purchase gate
    const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new AppError(
        "You can only review products you have purchased and not refunded",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Create
    const review = await reviewRepository.create({
      productId,
      userId,
      rating: Number(rating),
      title:  title?.trim()   ?? null,
      comment: comment?.trim() ?? null,
      isVerifiedPurchase: true, // We now enforce this
    });

    // Sync cache
    await this.#syncProductRating(productId);

    return review;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  /**
   * Get paginated reviews for a product.
   * Routes to reviewRepository.findByProduct (correct method name).
   */
  async getReviewsByProduct(productId, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      verifiedOnly,
      sortBy   = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    const {
      skip,
      limit: validLimit,
      page:  validPage,
    } = Pagination.getPaginationParams(page, limit);

    const { reviews, total } = await reviewRepository.findByProduct(productId, {
      skip,
      limit:       validLimit,
      rating:      rating ? parseInt(rating, 10) : undefined,
      verifiedOnly: verifiedOnly === "true" || verifiedOnly === true,
      sortBy,
      sortOrder,
    });

    return {
      reviews,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Get paginated reviews by the current user.
   * Routes to reviewRepository.findByUser (correct method name).
   */
  async getUserReviews(userId, queryParams = {}) {
    const { page = 1, limit = 10 } = queryParams;
    const {
      skip,
      limit: validLimit,
      page:  validPage,
    } = Pagination.getPaginationParams(page, limit);

    const { reviews, total } = await reviewRepository.findByUser(userId, {
      skip,
      limit: validLimit,
    });

    return {
      reviews,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  async getReviewById(reviewId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    return review;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  /**
   * Update rating / title / comment of a review.
   * Ownership enforced via review.user.id (Prisma) — no _id remnant.
   */
  async updateReview(reviewId, userId, updateData) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);

    // Ownership uses user.id from normalised shape
    this.#assertOwnership(review, userId);

    // Validate rating if being updated
    if (updateData.rating !== undefined) {
      this.#validateRating(updateData.rating);
    }

    const updatedReview = await reviewRepository.update(reviewId, {
      rating:  updateData.rating  !== undefined ? Number(updateData.rating) : undefined,
      title:   updateData.title?.trim()   ?? undefined,
      comment: updateData.comment?.trim() ?? undefined,
    });

    // Sync cache
    await this.#syncProductRating(this.#getProductId(review));

    return updatedReview;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * Soft-delete a review.
   * Admins may delete any review; customers may only delete their own.
   */
  async deleteReview(reviewId, userId, userRole) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);

    // Ownership uses user.id — no _id
    this.#assertOwnership(review, userId, userRole);

    const productId = this.#getProductId(review);
    const deleted   = await reviewRepository.softDelete(reviewId);

    // Sync cache
    await this.#syncProductRating(productId);

    return deleted;
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getProductRatingStats(productId) {
    const product = await productRepository.findById(productId, false);
    if (!product) throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);

    const [distribution, stats] = await Promise.all([
      reviewRepository.getRatingDistribution(productId),
      reviewRepository.calcAverageRating(productId),
    ]);

    return {
      averageRating:      stats.averageRating,
      totalReviews:       stats.totalReviews,
      ratingDistribution: distribution,
    };
  }
}

export default new ReviewService();
