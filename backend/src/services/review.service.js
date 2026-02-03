import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, ORDER_STATUS } from "../utils/constants.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination.js";

/**
 * Review Service - Contains all review management business logic
 */
class ReviewService {
  /**
   * Check if user has purchased the product
   */
  async hasUserPurchasedProduct(userId, productId) {
    const order = await Order.findOne({
      user: userId,
      "items.product": productId,
      orderStatus: ORDER_STATUS.DELIVERED,
    });

    return !!order;
  }

  /**
   * Create review
   */
  async createReview(userId, reviewData) {
    const { productId, rating, title, comment } = reviewData;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      throw new AppError(
        "You have already reviewed this product. Please update your existing review.",
        HTTP_STATUS.CONFLICT,
      );
    }

    // Check if user has purchased the product
    const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      title,
      comment,
      isVerifiedPurchase: hasPurchased,
    });

    // Update product rating
    const stats = await Review.calcAverageRating(productId);
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    // Populate user info
    await review.populate("user", "name email");

    return review;
  }

  /**
   * Get reviews by product
   */
  async getReviewsByProduct(productId, queryParams = {}) {
    const { page, limit, skip } = getPaginationParams(queryParams);

    const filter = { product: productId, isActive: true };

    if (queryParams.rating) {
      filter.rating = parseInt(queryParams.rating, 10);
    }

    if (queryParams.verifiedOnly === "true") {
      filter.isVerifiedPurchase = true;
    }

    const sortOptions = {};
    if (queryParams.sortBy === "rating") {
      sortOptions.rating = queryParams.sortOrder === "asc" ? 1 : -1;
    } else if (queryParams.sortBy === "helpful") {
      sortOptions.helpfulCount = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const pagination = getPaginationMeta(page, limit, total);

    return { reviews, pagination };
  }

  /**
   * Get reviews by current user
   */
  async getUserReviews(userId, queryParams = {}) {
    const { page, limit, skip } = getPaginationParams(queryParams);

    const filter = { user: userId, isActive: true };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const pagination = getPaginationMeta(page, limit, total);

    return { reviews, pagination };
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId) {
    const review = await Review.findById(reviewId)
      .populate("user", "name email")
      .populate("product", "name")
      .lean();

    if (!review) {
      throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    }

    return review;
  }

  /**
   * Update review
   */
  async updateReview(reviewId, userId, updateData) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check ownership
    if (review.user.toString() !== userId.toString()) {
      throw new AppError(
        "Unauthorized to update this review",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // Update review
    Object.assign(review, updateData);
    await review.save();

    // Update product rating
    const stats = await Review.calcAverageRating(review.product);
    await Product.findByIdAndUpdate(review.product, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    // Populate user info
    await review.populate("user", "name email");

    return review;
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check ownership (unless admin)
    if (userRole !== "admin" && review.user.toString() !== userId.toString()) {
      throw new AppError(
        "Unauthorized to delete this review",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const productId = review.product;

    // Soft delete
    review.isActive = false;
    await review.save();

    // Update product rating
    const stats = await Review.calcAverageRating(productId);
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    return review;
  }

  /**
   * Get product rating statistics
   */
  async getProductRatingStats(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    const ratingDistribution = await Review.aggregate([
      {
        $match: { product: productId, isActive: true },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const stats = await Review.calcAverageRating(productId);

    return {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingDistribution: ratingDistribution.map((item) => ({
        rating: item._id,
        count: item.count,
      })),
    };
  }
}

export default new ReviewService();
