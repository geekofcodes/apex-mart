import crypto from "crypto";
import razorpay from "../config/razorpay.js";

/**
 * Payment Service — Razorpay operations.
 *
 * All money values accepted in ₹ (rupees) and converted to paise (×100)
 * before sending to Razorpay, as the API expects the smallest currency unit.
 */

/**
 * Create a Razorpay order.
 *
 * @param {object} options
 * @param {number} options.amount    - Amount in ₹ (will be converted to paise)
 * @param {string} [options.currency] - ISO 4217 currency code, default "INR"
 * @param {string} options.receipt   - Unique receipt identifier (max 40 chars)
 * @returns {Promise<object>}        - Razorpay order object
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
}) => {
  const options = {
    amount: Math.round(amount * 100), // ₹ → paise (Razorpay requires smallest unit)
    currency,
    receipt,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify a Razorpay payment signature.
 *
 * Razorpay signs the payment using HMAC-SHA256 over:
 *   "<razorpay_order_id>|<razorpay_payment_id>"
 *
 * We recompute the expected signature server-side and compare it to what
 * Razorpay sent. This proves the payment was not tampered with.
 *
 * @param {object} params
 * @param {string} params.razorpay_order_id   - Razorpay order ID
 * @param {string} params.razorpay_payment_id - Razorpay payment ID
 * @param {string} params.razorpay_signature  - Signature from Razorpay callback
 * @returns {boolean} - true if signature is valid
 */
export const verifyRazorpayPayment = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};
