import productRepository from "../repositories/product.repository.js";
import categoryRepository from "../repositories/category.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PRODUCT_STATUS } from "../utils/constants.js";
import Pagination from "../utils/pagination.js";

/**
 * Product Service — production-hardened.
 *
 * Responsibilities:
 *  - Input validation (price, stock, category existence)
 *  - Ownership enforcement (seller vs admin)
 *  - Status-aware filtering
 *  - Safe stock mutation
 *  - Delegated DB access to productRepository
 */
class ProductService {
  // ─── Internal helpers ────────────────────────────────────────────────────

  /**
   * Map a client-supplied `status` query param to the `isActive` boolean
   * understood by the repository.
   *  ACTIVE          → isActive: true   (stock filter applied in repo)
   *  DISCONTINUED    → isActive: false
   *  OUT_OF_STOCK    → isActive: true   (repo derives from stock === 0)
   *  undefined/other → no restriction   (undefined = don't filter)
   */
  #statusToIsActive(status) {
    if (status === PRODUCT_STATUS.DISCONTINUED) return false;
    if (status === PRODUCT_STATUS.ACTIVE || status === PRODUCT_STATUS.OUT_OF_STOCK) {
      return true;
    }
    return undefined; // no filter
  }

  /**
   * Parse a boolean-like query string value.
   * Accepts: true/false (boolean), "true"/"false" (string), "1"/"0" (string).
   */
  #parseBool(val) {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    return undefined;
  }

  /**
   * Ownership check — throws 403 if a non-admin tries to touch another
   * seller's product. Uses seller.id (Prisma) not seller._id (Mongo).
   */
  #assertOwnership(product, userId, userRole) {
    if (userRole === "ADMIN") return; // admins bypass check

    const sellerId = product.seller?.id ?? null;
    if (!sellerId || sellerId !== userId) {
      throw new AppError(
        "You do not have permission to modify this product",
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }

  /**
   * Validate create / update payload fields that can be set by the caller.
   */
  async #validateProductData(data, opts = { requireAll: false }) {
    const errors = [];

    if (opts.requireAll || data.name !== undefined || data.title !== undefined) {
      const name = data.name || data.title;
      if (!name || !name.toString().trim()) errors.push("Product name/title is required");
    }

    if (opts.requireAll || data.price !== undefined) {
      const price = Number(data.price);
      if (isNaN(price) || price <= 0) errors.push("Price must be a positive number");
    }

    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      const dp = Number(data.discountPrice);
      const p = Number(data.price ?? 0);
      if (isNaN(dp) || dp < 0) errors.push("Discount price must be non-negative");
      if (p > 0 && dp >= p) errors.push("Discount price must be less than price");
    }

    if (opts.requireAll || data.stock !== undefined) {
      const stock = Number(data.stock);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.push("Stock must be a non-negative integer");
      }
    }

    // Category existence check (only when categoryId / category is supplied)
    const catId = data.category || data.categoryId;
    if (catId) {
      const cat = await categoryRepository.findById(catId);
      if (!cat) errors.push(`Category '${catId}' does not exist`);
    } else if (opts.requireAll) {
      errors.push("Category is required");
    }

    if (errors.length > 0) {
      throw new AppError(errors.join("; "), HTTP_STATUS.BAD_REQUEST);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Create a new product.
   * Validates inputs, then delegates to repository.
   */
  async createProduct(productData, sellerId) {
    await this.#validateProductData(productData, { requireAll: true });

    const images = productData.images || [];
    delete productData.images;

    // Lock seller to the authenticated user — never trust client payload
    productData.sellerId = sellerId;
    delete productData.seller; // strip any client-supplied seller field

    const product = await productRepository.create(productData, images);
    return product;
  }

  /**
   * Get all products with pagination, filters, and search.
   * Maps status string → isActive boolean.
   * Parses isFeatured safely regardless of string / boolean input.
   */
  async getAllProducts(queryParams) {
    const {
      page = 1,
      limit = 12,
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

    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    // Robust status → isActive mapping
    const isActive = this.#statusToIsActive(status);

    const { products, total } = await productRepository.findMany({
      categoryId: category,
      sellerId: seller,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      isActive,
      isFeatured: this.#parseBool(isFeatured),
      search: search?.trim() || undefined,
      sortBy,
      sortOrder,
      skip,
      limit: validLimit,
    });

    return {
      products,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Get single product by ID.
   */
  async getProductById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    return product;
  }

  /**
   * Update a product.
   * Enforces ownership, strips seller fields, validates mutable fields.
   */
  async updateProduct(productId, updateData, userId, userRole) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);

    // Security: ownership check using seller.id (Prisma), not _id (Mongo)
    this.#assertOwnership(product, userId, userRole);

    // Security: never allow seller reassignment from client
    delete updateData.seller;
    delete updateData.sellerId;

    // Validate only the fields being updated
    await this.#validateProductData(updateData, { requireAll: false });

    const updated = await productRepository.update(productId, updateData);
    return updated;
  }

  /**
   * Soft-delete a product.
   * Enforces ownership.
   */
  async deleteProduct(productId, userId, userRole) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);

    // Security: ownership check using seller.id (Prisma)
    this.#assertOwnership(product, userId, userRole);

    return productRepository.softDelete(productId);
  }

  /**
   * Get products filtered by a specific seller.
   */
  async getProductsBySeller(sellerId, queryParams) {
    const { page = 1, limit = 12, status } = queryParams;

    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    const isActive = this.#statusToIsActive(status);

    const { products, total } = await productRepository.findMany({
      sellerId,
      isActive,
      skip,
      limit: validLimit,
    });

    return {
      products,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Update product stock — SAFE implementation.
   *
   * Instead of blindly setting stock = quantity, we:
   *  1. Fetch the product to verify it exists
   *  2. Parse quantity as an absolute target value (admin sets exact stock)
   *  3. Prevent negative stock
   *
   * If you need delta-based adjustment (e.g., +5, -3) the order / cart
   * modules should call productRepository.adjustStock(id, delta, tx) directly
   * within their own transactions.
   */
  async updateStock(productId, quantity) {
    // 1. Verify product exists
    const product = await productRepository.findById(productId, false);
    if (!product) throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);

    // 2. Parse and validate
    const newStock = parseInt(quantity, 10);
    if (isNaN(newStock) || !Number.isInteger(newStock)) {
      throw new AppError("Stock quantity must be an integer", HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Prevent negative values
    if (newStock < 0) {
      throw new AppError("Stock cannot be negative", HTTP_STATUS.BAD_REQUEST);
    }

    // 4. Apply update
    const updated = await productRepository.update(productId, { stock: newStock });
    return updated;
  }

  /**
   * Get featured products.
   */
  async getFeaturedProducts(limit = 8) {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 50);
    return productRepository.findFeatured(parsedLimit);
  }
}

export default new ProductService();
