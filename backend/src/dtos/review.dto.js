/**
 * Review DTO - Data Transfer Object for shaping review responses
 */
class ReviewDTO {
  /**
   * Single review response
   */
  static reviewResponse(review) {
    if (!review) return null;

    return {
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      user: review.user
        ? {
            id: review.user._id,
            name: review.user.name,
          }
        : null,
      product: review.product
        ? {
            id: review.product._id,
            name: review.product.name,
          }
        : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  /**
   * List of reviews response
   */
  static reviewListResponse(reviews) {
    if (!reviews || !Array.isArray(reviews)) return [];
    return reviews.map((review) => this.reviewResponse(review));
  }
}

export default ReviewDTO;
