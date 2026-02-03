import express from "express";
import * as productController from "../controllers/product.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  updateStockSchema,
  objectIdSchema,
  sellerIdSchema,
} from "../validations/product.validation.js";

const router = express.Router();

/**
 * Public Routes
 */

// @route   GET /api/v1/products
// @desc    Get all products with filters and search
// @access  Public
router.get(
  "/",
  validateMiddleware(getProductsQuerySchema, "query"),
  productController.getAllProducts,
);

// @route   GET /api/v1/products/featured
// @desc    Get featured products
// @access  Public
router.get("/featured", productController.getFeaturedProducts);

// ... (skipping featured)

router.get(
  "/seller/:sellerId",
  validateMiddleware(sellerIdSchema, "params"),
  productController.getProductsBySeller,
);

router.get(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  productController.getProductById,
);

/**
 * Protected Routes (Seller/Admin)
 */

router.post(
  "/",
  protect,
  authorize("seller", "admin"),
  validateMiddleware(createProductSchema),
  productController.createProduct,
);

router.put(
  "/:id",
  protect,
  authorize("seller", "admin"),
  validateMiddleware(objectIdSchema, "params"),
  validateMiddleware(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  "/:id",
  protect,
  authorize("seller", "admin"),
  validateMiddleware(objectIdSchema, "params"),
  productController.deleteProduct,
);

router.patch(
  "/:id/stock",
  protect,
  authorize("seller", "admin"),
  validateMiddleware(objectIdSchema, "params"),
  validateMiddleware(updateStockSchema),
  productController.updateStock,
);

export default router;
