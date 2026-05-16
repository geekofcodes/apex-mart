import prisma from "../config/prisma.js";

/**
 * Review Repository — all DB access for reviews.
 * Replaces Mongoose static methods (calcAverageRating, $aggregate).
 */
class ReviewRepository {
  #include = {
    user:    { select: { id: true, name: true, email: true } },
    product: { select: { id: true, title: true } },
  };

  #normalise(r) {
    if (!r) return null;
    return {
      id: r.id,
      product: r.product
        ? { id: r.product.id, name: r.product.title }
        : r.productId,
      user: r.user
        ? { id: r.user.id, name: r.user.name, email: r.user.email }
        : r.userId,
      rating:             r.rating,
      title:              r.title   ?? null,
      comment:            r.comment ?? null,
      helpfulCount:       r.helpfulCount       ?? 0,
      isVerifiedPurchase: r.isVerifiedPurchase ?? false,
      isActive:           r.isActive,
      createdAt:          r.createdAt,
      updatedAt:          r.updatedAt,
    };
  }

  async findById(id) {
    const r = await prisma.review.findUnique({
      where: { id },
      include: this.#include,
    });
    return this.#normalise(r);
  }

  async findByUserAndProduct(userId, productId) {
    const r = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
      include: this.#include,
    });
    return this.#normalise(r);
  }

  /**
   * Paginated reviews for a product.
   */
  async findByProduct(productId, {
    skip = 0,
    limit = 10,
    rating,
    verifiedOnly = false,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) {
    const where = { productId, isActive: true };
    if (rating)       where.rating = Number(rating);
    if (verifiedOnly) where.isVerifiedPurchase = true;

    const allowedSorts = { rating: "rating", helpful: "helpfulCount", createdAt: "createdAt" };
    const orderField = allowedSorts[sortBy] ?? "createdAt";
    const orderDir   = sortOrder === "asc" ? "asc" : "desc";

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { [orderField]: orderDir },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map((r) => this.#normalise(r)),
      total,
    };
  }

  /**
   * Paginated reviews by user.
   */
  async findByUser(userId, { skip = 0, limit = 10 } = {}) {
    const where = { userId, isActive: true };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { product: { select: { id: true, title: true, images: { take: 1 } } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map((r) => this.#normalise(r)),
      total,
    };
  }

  async create({ productId, userId, rating, title, comment, isVerifiedPurchase }) {
    const r = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        title:              title   ?? null,
        comment:            comment ?? null,
        isVerifiedPurchase: isVerifiedPurchase ?? false,
        helpfulCount:       0,
        isActive:           true,
      },
      include: this.#include,
    });
    return this.#normalise(r);
  }

  async update(id, { rating, title, comment }) {
    const data = {};
    if (rating  !== undefined) data.rating  = rating;
    if (title   !== undefined) data.title   = title;
    if (comment !== undefined) data.comment = comment;

    const r = await prisma.review.update({
      where: { id },
      data,
      include: this.#include,
    });
    return this.#normalise(r);
  }

  /** Soft delete */
  async softDelete(id) {
    const r = await prisma.review.update({
      where: { id },
      data:  { isActive: false },
      include: this.#include,
    });
    return this.#normalise(r);
  }

  /**
   * Calculate average rating and total active reviews for a product.
   * Replaces Mongoose Review.calcAverageRating() aggregate.
   */
  async calcAverageRating(productId) {
    const result = await prisma.review.aggregate({
      where:  { productId, isActive: true },
      _avg:   { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: Math.round((result._avg.rating ?? 0) * 10) / 10,
      totalReviews:  result._count.rating,
    };
  }

  /**
   * Rating distribution for a product (star breakdown).
   * Replaces Mongoose $group aggregate pipeline.
   */
  async getRatingDistribution(productId) {
    const groups = await prisma.review.groupBy({
      by:     ["rating"],
      where:  { productId, isActive: true },
      _count: { rating: true },
      orderBy: { rating: "desc" },
    });

    return groups.map((g) => ({ rating: g.rating, count: g._count.rating }));
  }

  /**
   * Check if a user has a delivered order containing the product.
   * Replaces Mongoose Order.findOne({ "items.product": productId }).
   */
  async hasUserPurchasedProduct(userId, productId) {
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, orderStatus: "DELIVERED" },
      },
    });
    return !!item;
  }
}

export default new ReviewRepository();
