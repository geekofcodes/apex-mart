import productService from "../services/product.service.js";
import ProductDTO from "../dtos/product.dto.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Product Controller - Thin layer handling HTTP requests/responses
 * All business logic is delegated to ProductService
 */

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private/Seller/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id);

  return ApiResponse.success(
    res,
    "Product created successfully",
    ProductDTO.productDetailResponse(product),
    HTTP_STATUS.CREATED,
  );
});

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filters
 * @access  Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.getAllProducts(
    req.query,
  );

  return ApiResponse.paginated(
    res,
    "Products fetched successfully",
    ProductDTO.productListArrayResponse(products),
    HTTP_STATUS.OK,
    pagination,
  );
});

/**
 * @route   GET /api/v1/products/featured
 * @desc    Get featured products
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await productService.getFeaturedProducts(limit);

  return ApiResponse.success(
    res,
    "Featured products fetched successfully",
    ProductDTO.productListArrayResponse(products),
  );
});

/**
 * @route   GET /api/v1/products/seller/:sellerId
 * @desc    Get products by seller
 * @access  Public
 */
export const getProductsBySeller = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.getProductsBySeller(
    req.params.sellerId,
    req.query,
  );

  return ApiResponse.paginated(
    res,
    "Seller products fetched successfully",
    ProductDTO.productListArrayResponse(products),
    HTTP_STATUS.OK,
    pagination,
  );
});

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  return ApiResponse.success(
    res,
    "Product fetched successfully",
    ProductDTO.productDetailResponse(product),
  );
});

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private/Seller/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.user._id,
    req.user.role,
  );

  return ApiResponse.success(
    res,
    "Product updated successfully",
    ProductDTO.productDetailResponse(product),
  );
});

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private/Seller/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  return ApiResponse.success(res, "Product deleted successfully");
});

/**
 * @route   PATCH /api/v1/products/:id/stock
 * @desc    Update product stock
 * @access  Private/Seller/Admin
 */
export const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(
    req.params.id,
    req.body.stock,
  );

  return ApiResponse.success(
    res,
    "Stock updated successfully",
    ProductDTO.sellerProductResponse(product),
  );
});
