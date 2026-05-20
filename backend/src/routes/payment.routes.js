import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  refundPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// All payment routes require authentication
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);

// Admin-only: initiate a refund
// Body: { amount?: number (₹), reason?: string }
router.post("/refund/:orderId", protect, authorize("admin"), refundPayment);

// Webhook: NO auth middleware — verified by HMAC signature in the controller.
// Raw body is handled by app.js (express.raw registered before express.json).
router.post("/webhook", handleWebhook);

export default router;
