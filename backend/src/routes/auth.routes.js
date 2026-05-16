import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, try again later",
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many accounts created, try again later",
});

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  validateMiddleware(registerSchema),
  authController.register,
);
router.post(
  "/login",
  loginLimiter,
  validateMiddleware(loginSchema),
  authController.login,
);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", protect, authController.logout);

export default router;
