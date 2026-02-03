import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../validations/auth.validation.js"; // Wait, auth.validation.js was there
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import validateMiddleware from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post(
  "/register",
  validateMiddleware(registerSchema),
  authController.register,
);
router.post("/login", validateMiddleware(loginSchema), authController.login);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", protect, authController.logout);

export default router;
