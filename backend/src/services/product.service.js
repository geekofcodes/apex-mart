import Product from "../models/product.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PRODUCT_STATUS } from "../utils/constants.js";
import Pagination from "../utils/pagination.js";

/**
 * Product Service - Contains all product management business logic
 */
class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData, sellerId) {
    const product = await Product.create({
      ...productData,
      seller: sellerId,
    });

    // Populate category and seller
    await product.populate([
      { path: "category", select: "name slug" },
      { path: "seller", select: "name email" },
    ]);

    return product;
  }

  /**
   * Get all products with pagination, filters, and search
   */
  async getAllProducts(queryParams) {
    const {
      page = 1,
      limit = 10,
      category,
      seller,
      minPrice,
      maxPrice,
      status,
      isFeatured,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (seller) {
      filter.seller = seller;
    }

    if (status) {
      filter.status = status;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === "true";
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Get pagination params
    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    let query;
    if (search) {
      // Text search
      query = Product.find({
        ...filter,
        $text: { $search: search },
      }).select({ score: { $meta: "textScore" } });
      sort.score = { $meta: "textScore" };
    } else {
      query = Product.find(filter);
    }

    // Build the count filter (must match the query filter)
    const countFilter = search
      ? { ...filter, $text: { $search: search } }
      : filter;

    const [products, total] = await Promise.all([
      query
        .populate([
          { path: "category", select: "name slug" },
          { path: "seller", select: "name email" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .lean(),
      Product.countDocuments(countFilter),
    ]);

    return {
      products,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    const product = await Product.findById(productId)
      .populate([
        { path: "category", select: "name slug description" },
        { path: "seller", select: "name email phone" },
      ])
      .lean();

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId, updateData, userId, userRole) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check ownership (seller can only update their own products)
    if (
      userRole !== "admin" &&
      product.seller.toString() !== userId.toString()
    ) {
      throw new AppError(
        "You do not have permission to update this product",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // Prevent updating seller field
    delete updateData.seller;

    // Update product
    Object.assign(product, updateData);
    await product.save();

    // Populate and return
    await product.populate([
      { path: "category", select: "name slug" },
      { path: "seller", select: "name email" },
    ]);

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId, userId, userRole) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check ownership (seller can only delete their own products)
    if (
      userRole !== "admin" &&
      product.seller.toString() !== userId.toString()
    ) {
      throw new AppError(
        "You do not have permission to delete this product",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    product.isActive = false;
    product.status = PRODUCT_STATUS.INACTIVE;
    await product.save();

    return product;
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(sellerId, queryParams) {
    const { page = 1, limit = 10, status } = queryParams;

    const filter = { seller: sellerId };

    if (status) {
      filter.status = status;
    }

    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Update product stock
   */
  async updateStock(productId, quantity) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    product.stock = quantity;
    await product.save();

    return product;
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 10) {
    const products = await Product.find({
      isFeatured: true,
      isActive: true,
      status: PRODUCT_STATUS.ACTIVE,
    })
      .populate([
        { path: "category", select: "name slug" },
        { path: "seller", select: "name" },
      ])
      .sort({ averageRating: -1, totalSales: -1 })
      .limit(limit)
      .lean();

    return products;
  }
}

export default new ProductService();
