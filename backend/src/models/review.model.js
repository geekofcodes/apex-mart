import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isActive: 1 });

// Compound indexes
reviewSchema.index({ product: 1, isActive: 1, createdAt: -1 });

// Query middleware: Exclude inactive reviews by default
reviewSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isActive) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// Static method: Calculate average rating for a product
reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, isActive: true },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
  };
};

// Post-save middleware: Update product rating
reviewSchema.post("save", async function () {
  const stats = await this.constructor.calcAverageRating(this.product);
  await mongoose.model("Product").findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
});

// Post-remove middleware: Update product rating
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const stats = await this.model.calcAverageRating(doc.product);
    await mongoose.model("Product").findByIdAndUpdate(doc.product, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
