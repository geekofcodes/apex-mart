import orderRepository from "../repositories/order.repository.js";
import cartService from "./cart.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
  HTTP_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../utils/constants.js";
import Pagination from "../utils/pagination.js";

/** Statuses from which a customer can still cancel */
const CANCELLABLE_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PROCESSING,
]);

/**
 * Order Service — production-hardened.
 *
 * Responsibilities:
 *  - Input validation (address, payment method, cart state)
 *  - Ownership & state-machine enforcement
 *  - Pricing calculation
 *  - Delegation of atomic DB work to orderRepository
 */
class OrderService {
  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Assert that the requesting user owns the order (or is admin).
   * Uses order.user.id — the Prisma field, not the Mongo _id remnant.
   */
  #assertOrderOwnership(order, userId, userRole) {
    if (userRole === "ADMIN") return;
    const ownerId = order.user?.id ?? order.user; // normalised shape has user.id
    if (!ownerId || ownerId.toString() !== userId.toString()) {
      throw new AppError(
        "You do not have permission to access this order",
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }

  /**
   * Validate the shipping address object — all required fields must be present.
   */
  #validateShippingAddress(addr) {
    if (!addr || typeof addr !== "object") {
      throw new AppError(
        "Shipping address is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    const missing = [];
    if (!addr.fullName?.trim()) missing.push("fullName");
    if (!addr.addressLine1?.trim()) missing.push("addressLine1");
    if (!addr.city?.trim()) missing.push("city");
    if (!addr.country?.trim()) missing.push("country");

    if (missing.length > 0) {
      throw new AppError(
        `Shipping address is missing: ${missing.join(", ")}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate payment method against the allowed list.
   */
  #validatePaymentMethod(method) {
    const ALLOWED = new Set([
      "COD",
      "RAZORPAY",
      "STRIPE",
      "PAYPAL",
      "cod",
      "razorpay",
      "stripe",
      "paypal",
    ]);
    if (!method || !ALLOWED.has(method)) {
      throw new AppError(
        `Invalid payment method. Accepted: COD, RAZORPAY, STRIPE, PAYPAL`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  // ─── Place Order ──────────────────────────────────────────────────────────

  /**
   * Create a new order from the user's active cart.
   *
   * Flow:
   *  1. Validate inputs
   *  2. Load and validate cart
   *  3. Build order items (skip inactive products)
   *  4. Calculate pricing
   *  5. Delegate atomic creation to repository (transaction inside)
   */
  async placeOrder(userId, orderData) {
    const { shippingAddress, paymentMethod } = orderData;

    // Validate inputs up-front — fail fast before any DB work
    this.#validateShippingAddress(shippingAddress);
    this.#validatePaymentMethod(paymentMethod);

    // Load cart (creates one if missing, prunes inactive items)
    const cart = await cartService.getOrCreateCart(userId);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
    }

    // Build order items, skipping inactive / deleted products
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) continue;

      // Extract first image URL safely
      let imageUrl = "";
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0].url ?? "";
      }

      orderItems.push({
        product: product.id, // Prisma native id — no _id (Rule 8)
        name: product.name || "Unknown Product",
        quantity: item.quantity,
        // NOTE: item.price is passed but the repository IGNORES it.
        // All pricing is re-fetched from the DB inside the transaction.
        image: imageUrl,
      });
    }

    if (orderItems.length === 0) {
      throw new AppError(
        "No valid/active products in cart to order",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Delegate atomic operation (address snapshot + order + stock + cart clear)
    // Stock validation and authoritative pricing against actual DB values happens inside the transaction.
    let order;
    try {
      order = await orderRepository.create(
        userId,
        cart.id || cart.id,
        shippingAddress,
        paymentMethod,
        orderItems,
      );
    } catch (err) {
      // Surface repository-thrown business errors as 400 Bad Request.
      // These include: insufficient stock, missing product, invalid id, empty order.
      const BUSINESS_ERROR_PATTERNS = [
        "Insufficient stock",
        "no longer exists",
        "no longer available",
        "invalid product id",
        "No valid items remain",
      ];
      if (BUSINESS_ERROR_PATTERNS.some((p) => err.message?.includes(p))) {
        throw new AppError(err.message, HTTP_STATUS.BAD_REQUEST);
      }
      throw err;
    }

    return order;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async getUserOrders(userId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    const { orders, total } = await orderRepository.findByUserId(userId, {
      skip,
      limit: validLimit,
    });

    return {
      orders,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  async getAllOrders(query = {}) {
    const { page = 1, limit = 10, status, userId } = query;
    const {
      skip,
      limit: validLimit,
      page: validPage,
    } = Pagination.getPaginationParams(page, limit);

    const { orders, total } = await orderRepository.findAll({
      skip,
      limit: validLimit,
      userId,
      orderStatus: status,
    });

    return {
      orders,
      pagination: Pagination.getPaginationMeta(validPage, validLimit, total),
    };
  }

  /**
   * Get a single order — enforces ownership (customer can only see own orders).
   */
  async getOrderById(orderId, userId, userRole) {
    const order = await orderRepository.findById(orderId);

    if (!order) throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);

    // Ownership uses order.user.id (Prisma) — no _id needed
    this.#assertOrderOwnership(order, userId, userRole);

    return order;
  }

  // ─── Status transitions (Admin) ───────────────────────────────────────────

  /**
   * Admin: move an order through the status state machine.
   * Automatically sets deliveredAt and marks payment complete on DELIVERED.
   */
  async updateOrderStatus(orderId, status) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);

    const updateData = { orderStatus: status };

    if (status === ORDER_STATUS.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = PAYMENT_STATUS.COMPLETED;
    }

    return orderRepository.updateStatus(orderId, updateData);
  }

  /**
   * Admin: update the payment status of an order.
   * Enforces status transition safety and idempotency.
   */
  async updatePaymentStatus(orderId, paymentStatus, paymentGatewayData = {}) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);

    // 1. Terminal State Lock (CRITICAL)
    if (
      order.paymentStatus === PAYMENT_STATUS.REFUNDED ||
      order.orderStatus === ORDER_STATUS.CANCELLED
    ) {
      throw new AppError(
        "Order is in a terminal state. No further payment updates allowed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 2. Webhook Idempotency Key
    if (
      paymentGatewayData.gatewayEventId &&
      order.payment?.gatewayEventId === paymentGatewayData.gatewayEventId
    ) {
      return order; // Duplicate event safely ignored
    }

    // 3. Idempotency: return immediately if already in target state
    if (order.paymentStatus === paymentStatus) {
      return order;
    }

    // 4. Status Transition Safety & 5. Order Status Sync
    let targetOrderStatus = order.orderStatus;

    if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
      if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
        throw new AppError(
          `Cannot transition payment status from ${order.paymentStatus} to ${paymentStatus}`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      targetOrderStatus = ORDER_STATUS.PROCESSING;
    } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
      if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
        throw new AppError(
          `Cannot transition payment status from ${order.paymentStatus} to ${paymentStatus}`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      // FAILED -> remains PENDING
    } else if (paymentStatus === PAYMENT_STATUS.REFUNDED) {
      if (order.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
        throw new AppError(
          `Cannot refund payment when current status is ${order.paymentStatus}`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      targetOrderStatus = ORDER_STATUS.CANCELLED;
    }

    // 5. paidAt Timestamp Safety
    let newPaidAt = undefined;
    if (!order.paidAt && paymentStatus === PAYMENT_STATUS.COMPLETED) {
      newPaidAt = new Date();
    }

    // Delegate atomic update to repository
    return orderRepository.updatePaymentAtomic(orderId, {
      paymentStatus,
      orderStatus: targetOrderStatus,
      paidAt: newPaidAt,
      amount: order.totalPrice,
      paymentMethod: paymentGatewayData.paymentMethod || order.paymentMethod,
      transactionId: paymentGatewayData.transactionId,
      paymentGatewayId: paymentGatewayData.paymentGatewayId,
      gatewayEventId: paymentGatewayData.gatewayEventId,
    });
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  /**
   * Customer: cancel their own order if it is still in a cancellable state.
   * Stock is restored after cancellation.
   */
  async cancelOrder(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);

    // Ownership check — customer must own the order
    this.#assertOrderOwnership(order, userId, "CUSTOMER");

    // State machine: only PENDING / PROCESSING orders can be cancelled
    if (!CANCELLABLE_STATUSES.has(order.orderStatus)) {
      throw new AppError(
        `Cannot cancel an order with status '${order.orderStatus}'. ` +
          `Only pending or processing orders may be cancelled.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Rule 7 (Atomic Cancellation): status update + stock restore run inside
    // a single transaction in the repository — either both succeed or neither does.
    return orderRepository.cancelOrder(orderId, order.items);
  }
}

export default new OrderService();
