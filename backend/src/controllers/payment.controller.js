import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../services/payment.service.js";
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
