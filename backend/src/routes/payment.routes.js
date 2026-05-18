import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All payment routes require authentication
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);

export default router;
