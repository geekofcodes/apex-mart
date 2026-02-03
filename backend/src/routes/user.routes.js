import express from "express";
import * as userController from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import {
  getUsersQuerySchema,
  updateUserSchema,
  objectIdSchema,
} from "../validations/user.validation.js";

const router = express.Router();

/**
 * All routes require authentication and admin role
 */
router.use(protect);
router.use(isAdmin);

/**
 * User Management Routes (Admin Only)
 */

// @route   GET /api/v1/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get(
  "/",
  validateMiddleware(getUsersQuerySchema, "query"),
  userController.getAllUsers,
);

// ... (stats)

router.get(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  userController.getUserById,
);

router.put(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  validateMiddleware(updateUserSchema),
  userController.updateUser,
);

router.patch(
  "/:id/deactivate",
  validateMiddleware(objectIdSchema, "params"),
  userController.deactivateUser,
);

router.patch(
  "/:id/activate",
  validateMiddleware(objectIdSchema, "params"),
  userController.activateUser,
);

router.delete(
  "/:id",
  validateMiddleware(objectIdSchema, "params"),
  userController.deleteUser,
);

export default router;
