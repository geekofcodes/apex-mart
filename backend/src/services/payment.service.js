import orderService from "./order.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PAYMENT_STATUS } from "../utils/constants.js";

/**
 * Payment Service - Service for handling payment processing
 * Placeholder for future integration (Stripe, Razorpay, etc.)
 */
class PaymentService {
  /**
   * Process a payment
   */
  async processPayment(orderId, paymentData) {
    // 3. Order Link: Ensure order exists before payment
    // Using ADMIN role to bypass user ownership check for internal processing
    const order = await orderService.getOrderById(orderId, null, "ADMIN");

    // 2. Idempotency: Prevent duplicate payment processing
    if (order.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      throw new AppError("Order has already been paid", HTTP_STATUS.BAD_REQUEST);
    }

    if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
       throw new AppError(`Cannot process payment for order in ${order.paymentStatus} state`, HTTP_STATUS.BAD_REQUEST);
    }

    // Placeholder gateway logic
    const isSuccess = true;

    if (isSuccess) {
      const transactionId = `TXN_${Date.now()}`;
      await orderService.updatePaymentStatus(orderId, PAYMENT_STATUS.COMPLETED, {
        transactionId,
        paymentMethod: paymentData?.paymentMethod || "STRIPE", // Example
        gatewayEventId: paymentData?.gatewayEventId,
      });
      return {
        success: true,
        transactionId,
        status: PAYMENT_STATUS.COMPLETED,
      };
    } else {
      await orderService.updatePaymentStatus(orderId, PAYMENT_STATUS.FAILED, {
         gatewayEventId: paymentData?.gatewayEventId,
      });
      return {
        success: false,
        status: PAYMENT_STATUS.FAILED,
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(orderId, transactionId) {
    const order = await orderService.getOrderById(orderId, null, "ADMIN");

    // 2. Idempotency & 4. Status Transition Safety
    if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
      return { success: true, message: "Payment already refunded" };
    }

    if (order.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
      throw new AppError("Cannot refund an unpaid order", HTTP_STATUS.BAD_REQUEST);
    }

    // Placeholder refund logic
    const refundId = `REF_${Date.now()}`;
    await orderService.updatePaymentStatus(orderId, PAYMENT_STATUS.REFUNDED, {
      transactionId: refundId
    });

    return {
      success: true,
      refundId,
      status: PAYMENT_STATUS.REFUNDED,
    };
  }
}

export default new PaymentService();
