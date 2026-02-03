import orderService from "../services/order.service.js";
import OrderDTO from "../dtos/order.dto.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Order Controller - Thin layer handling HTTP requests/responses
 * All business logic is delegated to OrderService
 */

/**
 * @route   POST /api/v1/orders
 * @desc    Place order from cart
 * @access  Private
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user._id, req.body);

  return ApiResponse.success(
    res,
    "Order placed successfully",
    OrderDTO.orderDetailResponse(order),
    HTTP_STATUS.CREATED,
  );
});

/**
 * @route   GET /api/v1/orders/my-orders
 * @desc    Get current user's orders
 * @access  Private
 */
export const getUserOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.getUserOrders(
    req.user._id,
    req.query,
  );

  return ApiResponse.paginated(
    res,
    "Orders fetched successfully",
    OrderDTO.orderListArrayResponse(orders),
    HTTP_STATUS.OK,
    pagination,
  );
});

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private (Owner or Admin)
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  return ApiResponse.success(
    res,
    "Order fetched successfully",
    req.user.role === "admin"
      ? OrderDTO.adminOrderResponse(order)
      : OrderDTO.orderDetailResponse(order),
  );
});

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders (Admin only)
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.getAllOrders(req.query);

  return ApiResponse.paginated(
    res,
    "Orders fetched successfully",
    orders.map((order) => OrderDTO.adminOrderResponse(order)),
    HTTP_STATUS.OK,
    pagination,
  );
});

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await orderService.updateOrderStatus(
    req.params.id,
    status,
    note,
  );

  return ApiResponse.success(
    res,
    "Order status updated successfully",
    OrderDTO.adminOrderResponse(order),
  );
});

/**
 * @route   PATCH /api/v1/orders/:id/payment-status
 * @desc    Update payment status
 * @access  Private/Admin
 */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  const order = await orderService.updatePaymentStatus(
    req.params.id,
    paymentStatus,
  );

  return ApiResponse.success(
    res,
    "Payment status updated successfully",
    OrderDTO.adminOrderResponse(order),
  );
});

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);

  return ApiResponse.success(
    res,
    "Order cancelled successfully",
    OrderDTO.orderDetailResponse(order),
  );
});
