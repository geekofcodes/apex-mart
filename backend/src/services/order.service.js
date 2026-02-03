import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import cartService from "./cart.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
  HTTP_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../utils/constants.js";

/**
 * Order Service - Contains all order management business logic
 */
class OrderService {
  /**
   * Create a new order from cart
   */
  async placeOrder(userId, orderData) {
    const { shippingAddress, paymentMethod } = orderData;

    // Get user's cart using the service (ensures migration and validation)
    const cartDoc = await cartService.getOrCreateCart(userId);

    // Convert to plain object to resolve any tricky population issues
    const cart = cartDoc.toObject({ virtuals: true });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
    }

    // Create order items from cart items with heavy validation
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;

      // Skip if product is missing or inactive
      if (!product || !product.isActive) continue;

      // Extract image URL safely
      let imageUrl = "https://res.cloudinary.com/placeholder-image.png";
      if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        imageUrl = product.images[0].url || imageUrl;
      }

      orderItems.push({
        product: product._id,
        name: product.name || "Unknown Product",
        quantity: item.quantity,
        price: item.price || product.discountPrice || product.price,
        image: imageUrl,
      });
    }

    if (orderItems.length === 0) {
      throw new AppError(
        "No valid products in cart to order",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Calculate prices (Matching UI Summary)
    const itemsPrice = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const taxPrice = 0;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart after order placement
    cartDoc.items = [];
    await cartDoc.save();

    return order;
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: userId });

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order by ID with authorization
   */
  async getOrderById(orderId, userId, userRole) {
    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    // Authorization check: Only admin or the customer who placed the order can view it
    if (
      userRole !== "admin" &&
      order.user._id.toString() !== userId.toString()
    ) {
      throw new AppError(
        "You do not have permission to view this order",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    return order;
  }

  /**
   * Update order status (Admin)
   */
  async updateOrderStatus(orderId, status, note = "") {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    order.orderStatus = status;

    if (status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = Date.now();
      order.paymentStatus = PAYMENT_STATUS.COMPLETED;
    }

    // Add note if provided (requires notes field in model, adding as virtual or simple property for now)
    // If model has notes array, we'd push here. Assuming simple status update for now.

    await order.save();
    return order;
  }

  /**
   * Update payment status (Admin)
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
      order.paidAt = Date.now();
    }

    await order.save();
    return order;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
    }

    // Only owner can cancel their own order
    if (order.user.toString() !== userId.toString()) {
      throw new AppError(
        "You do not have permission to cancel this order",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // Only pending or processing orders can be canceled
    if (
      order.orderStatus !== ORDER_STATUS.PENDING &&
      order.orderStatus !== ORDER_STATUS.PROCESSING
    ) {
      throw new AppError(
        `Cannot cancel order in ${order.orderStatus} status`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await order.save();
    return order;
  }
}

export default new OrderService();
