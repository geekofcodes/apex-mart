import axiosInstance from "./axios";

/**
 * Payment API — all Razorpay interactions live here.
 *
 * Checkout.jsx is UI-only; it delegates every payment concern to this module.
 */
export const paymentAPI = {
  /**
   * Create a Razorpay order on the backend.
   * Returns the shaped data object (orderId, amount in paise, currency).
   *
   * @param {number} amount - Cart total in ₹
   */
  createRazorpayOrder: async (amount) => {
    const res = await axiosInstance.post("/payments/create-order", { amount });
    return res.data.data; // { orderId, amount, currency, receipt }
  },

  /**
   * Verify the Razorpay payment signature on the backend.
   * Must be called before creating an order — this is the security gate.
   *
   * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature }} payload
   */
  verifyPayment: async (payload) => {
    const res = await axiosInstance.post("/payments/verify", payload);
    return res.data; // { success: true, message: "..." }
  },

  /**
   * Open the Razorpay checkout popup.
   *
   * On success the handler:
   *   1. Verifies the signature via paymentAPI.verifyPayment
   *   2. Calls onSuccess(razorpayOrderId) if valid — caller creates the order
   *      and includes razorpayOrderId so it can be found by webhooks later.
   *   3. Calls onFailure(msg) if verification fails
   *
   * @param {object}   params
   * @param {object}   params.order     - Razorpay order data from createRazorpayOrder
   * @param {object}   params.user      - { fullName, email } for prefill
   * @param {Function} params.onSuccess - Called with (razorpayOrderId) after verification
   * @param {Function} params.onFailure - Called with (msg) on failure
   */
  openRazorpay: ({ order, user, onSuccess, onFailure }) => {
    // Capture orderId properly in the outer scope
    const fallbackOrderId = order.orderId;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount, // in paise
      currency: order.currency,
      name: "Apex Mart",
      description: "Order Payment",
      order_id: order.orderId,

      handler: async function (response) {
        try {
          const verifyRes = await paymentAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (!verifyRes.success) {
            onFailure?.("Payment verification failed.");
            return;
          }

          console.log("RAZORPAY RESPONSE:", response);
          console.log("ORDER FROM BACKEND:", order);

          // 🔥 FINAL FIX
          const razorpayOrderId =
            response.razorpay_order_id || fallbackOrderId;

          console.log("PASSING ORDER ID:", razorpayOrderId);

          onSuccess?.(razorpayOrderId);
        } catch (err) {
          console.error("Razorpay handler error:", err);
          onFailure?.("Payment failed.");
        }
      },

      prefill: {
        name: user.fullName,
        email: user.email,
      },

      theme: {
        color: "#2563eb",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  },
};
