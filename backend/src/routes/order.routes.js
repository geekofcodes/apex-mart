import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  objectIdSchema,
  getOrdersQuerySchema,
} from "../validations/order.validation.js";

const router = express.Router();

router.use(protect);

// @route   POST /api/v1/orders
// @desc    Place order from cart
// @access  Private
router.post(
  "/",
  validateMiddleware(createOrderSchema),
  orderController.placeOrder,
);

// @route   GET /api/v1/orders/my-orders
// @desc    Get current user's orders
// @access  Private
router.get("/my-orders", orderController.getUserOrders);

// @route   GET /api/v1/orders/:id
// @desc    Get order by ID
// @access  Private (Owner or Admin)
router.get(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  orderController.getOrderById,
);

// Admin only routes
// @route   GET /api/v1/orders
// @desc    Get all orders
// @access  Private/Admin
router.get("/", authorize("admin"), orderController.getAllOrders);

// @route   PATCH /api/v1/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.patch(
  "/:id/status",
  authorize("admin"),
  validateMiddleware(objectIdSchema, "params"),
  validateMiddleware(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

export default router;
