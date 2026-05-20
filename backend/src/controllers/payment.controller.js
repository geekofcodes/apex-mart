import crypto from "crypto";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createRefund,
} from "../services/payment.service.js";
import orderService from "../services/order.service.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create a Razorpay payment order
 * @access  Private
 */
export const createPaymentOrder = asyncHandler(async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid positive amount (in ₹) is required",
      });
    }

    const order = await createRazorpayOrder({
      amount,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount, // in paise
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error("RAZORPAY ERROR:", error);
    next(error);
  }
});

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment signature (MUST be called before order creation)
 * @access  Private
 *
 * Security: We recompute the HMAC-SHA256 signature server-side using the
 * KEY_SECRET (never exposed to frontend). If signatures don't match, the
 * payment was tampered with and no order should be created.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message:
        "razorpay_order_id, razorpay_payment_id and razorpay_signature are all required",
    });
  }

  const isValid = verifyRazorpayPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
  });
});

/**
 * @route   POST /api/v1/payments/refund/:orderId
 * @desc    Initiate a Razorpay refund for a paid order
 * @access  Private/Admin
 *
 * Body (optional):
 *   amount {number} - Partial refund amount in ₹. Omit for full refund.
 *   reason {string} - Human-readable reason logged in Razorpay notes.
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { amount, reason } = req.body ?? {};

  // 1. Fetch order (includes razorpayPaymentId & totalPrice)
  const order = await orderService.getOrderForRefund(orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!order.razorpayPaymentId) {
    return res.status(400).json({
      success: false,
      message: "No Razorpay payment ID on record — cannot refund",
    });
  }

  // 2. Guard: only refund PAID orders
  if (order.paymentStatus !== "PAID") {
    return res.status(400).json({
      success: false,
      message: `Cannot refund an order with payment status: ${order.paymentStatus}`,
    });
  }

  // 3. Guard: idempotency — don't double-refund
  if (order.razorpayRefundId) {
    return res.status(409).json({
      success: false,
      message: "Refund already initiated for this order",
      data: { refundId: order.razorpayRefundId },
    });
  }

  // 4. Call Razorpay — amount defaults to full order total if not provided
  const refundAmount = amount ?? order.totalPrice;
  const refund = await createRefund({
    paymentId: order.razorpayPaymentId,
    amount: refundAmount,
    notes: { reason: reason || "Admin initiated refund", orderId },
  });

  // 5. Optimistically mark order as REFUNDED in DB
  //    The webhook (refund.processed) will confirm — but we update eagerly
  //    so the admin sees immediate feedback without waiting for the webhook.
  await orderService.markOrderAsRefunded(orderId, refund.id);

  return res.status(200).json({
    success: true,
    message: "Refund initiated successfully",
    data: {
      refundId: refund.id,
      amount: refund.amount / 100, // paise → ₹
      status: refund.status,
      speed: refund.speed_requested,
    },
  });
});

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Razorpay webhook handler — production safety net
 * @access  Public (verified by HMAC, NOT by auth middleware)
 *
 * Why raw body: Razorpay signs the exact raw bytes of the request.
 * If express.json() parses it first, the Buffer changes and the HMAC check fails.
 * app.js registers express.raw() for this route BEFORE express.json().
 *
 * Idempotency: we only update orders that are still PENDING to avoid
 * overwriting a status already set by the verify → createOrder frontend flow.
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing signature header" });
    }

    // Verify HMAC using the WEBHOOK secret (different from KEY_SECRET)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // req.body is a Buffer here (express.raw)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Webhook signature mismatch — rejecting");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Safe to parse now that signature is verified
    const event = JSON.parse(req.body.toString());
    console.log(`[Webhook] Received event: ${event.event}`);

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const razorpayPaymentId = payment.id;

        // Pre-check: find order and guard against double-processing
        const existingOrder = await orderService.findByRazorpayOrderId(razorpayOrderId);

        if (!existingOrder) {
          console.log(`[Webhook] ⚠️ No order found for razorpayOrderId=${razorpayOrderId}, skipping`);
          break;
        }

        if (existingOrder.paymentStatus === "PAID") {
          console.log(`[Webhook] ⚠️ Already processed (PAID), skipping for razorpayOrderId=${razorpayOrderId}`);
          break;
        }

        await orderService.markOrderAsPaidByRazorpayOrderId(razorpayOrderId, razorpayPaymentId);
        console.log(
          `[Webhook] ✅ payment.captured → order updated for razorpayOrderId=${razorpayOrderId}`,
        );
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        // Pre-check: find order and guard against double-processing
        const existingOrder = await orderService.findByRazorpayOrderId(razorpayOrderId);

        if (!existingOrder) {
          console.log(`[Webhook] ⚠️ No order found for razorpayOrderId=${razorpayOrderId}, skipping`);
          break;
        }

        if (existingOrder.paymentStatus === "FAILED") {
          console.log(`[Webhook] ⚠️ Already marked FAILED, skipping for razorpayOrderId=${razorpayOrderId}`);
          break;
        }

        await orderService.markOrderAsFailed(razorpayOrderId);
        console.log(
          `[Webhook] ✅ payment.failed → order marked failed for razorpayOrderId=${razorpayOrderId}`,
        );
        break;
      }

      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const razorpayRefundId  = refund.id;
        const razorpayPaymentId = refund.payment_id;

        const existingOrder = await orderService.findByRazorpayPaymentId(razorpayPaymentId);

        if (!existingOrder) {
          console.log(`[Webhook] ⚠️ No order for paymentId=${razorpayPaymentId}, skipping refund.processed`);
          break;
        }

        if (existingOrder.paymentStatus === "REFUNDED") {
          console.log(`[Webhook] ⚠️ Already REFUNDED, skipping duplicate for paymentId=${razorpayPaymentId}`);
          break;
        }

        // Webhook confirms the refund — sync order state
        await orderService.markOrderAsRefunded(existingOrder.id, razorpayRefundId);
        console.log(`[Webhook] ✅ refund.processed → order REFUNDED for paymentId=${razorpayPaymentId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`);
    }

    // Always return 200 so Razorpay stops retrying
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return res.status(500).json({ success: false });
  }
};
