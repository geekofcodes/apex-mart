import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import { createCategorySchema } from "../validations/category.validation.js";

const router = express.Router();

router.get("/", categoryController.getAllCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:id", categoryController.getCategoryById);
router.get("/:id/subcategories", categoryController.getSubcategories);

// Admin only routes
router.use(protect, authorize("admin"));
router.post(
  "/",
  validateMiddleware(createCategorySchema),
  categoryController.createCategory,
);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;
