import Joi from "joi";

/**
 * Create category validation
 */
export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "any.required": "Category name is required",
    "string.min": "Category name must be at least 2 characters",
  }),
  slug: Joi.string().trim().min(2).required().messages({
    "any.required": "Category slug is required",
  }),
  description: Joi.string().trim().max(500).optional().allow(""),
  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Invalid parent category ID format",
    }),
  displayOrder: Joi.number().integer().min(0).optional(),
});
