import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All payment routes require authentication
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);

// Webhook: NO auth middleware — verified by HMAC signature in the controller.
// Raw body is handled by app.js (express.raw registered before express.json).
router.post("/webhook", handleWebhook);

export default router;
