import mongoose from "mongoose";
import { PRODUCT_STATUS } from "../utils/constants.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (value) {
          return !value || value < this.price;
        },
        message: "Discount price must be less than regular price",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Product seller is required"],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        altText: {
          type: String,
          default: "",
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSales: {
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
productSchema.index({ name: "text", description: "text" }); // Text search
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSales: -1 });

// Compound indexes
productSchema.index({ category: 1, isActive: 1, status: 1 });
productSchema.index({ seller: 1, isActive: 1 });

// Virtual for final price (considering discount)
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// Pre-save middleware: Auto-update status based on stock
productSchema.pre("save", function (next) {
  if (this.stock === 0) {
    this.status = PRODUCT_STATUS.OUT_OF_STOCK;
  } else if (this.status === PRODUCT_STATUS.OUT_OF_STOCK && this.stock > 0) {
    this.status = PRODUCT_STATUS.ACTIVE;
  }
  next();
});

// Query middleware: Exclude inactive products by default
productSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly querying for inactive products
  if (!this.getQuery().isActive) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// Static method: Search products
productSchema.statics.searchProducts = function (searchTerm) {
  return this.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

const Product = mongoose.model("Product", productSchema);

export default Product;
