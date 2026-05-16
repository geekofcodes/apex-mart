import Joi from "joi";

/**
 * Create review validation
 */
export const createReviewSchema = Joi.object({
  product: Joi.string()
    .min(1)
    .required()
    .messages({
      "any.required": "Product ID is required",
    }),
  rating: Joi.number().min(1).max(5).required().messages({
    "any.required": "Rating is required",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
  }),
  comment: Joi.string().trim().min(10).max(500).required().messages({
    "any.required": "Comment is required",
    "string.min": "Comment must be at least 10 characters",
    "string.max": "Comment cannot exceed 500 characters",
  }),
});

/**
 * Update review validation
 */
export const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().trim().min(10).max(500).optional(),
});

/**
 * Query schema for reviews
 */
export const getReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
});

/**
 * Product ID param validation
 */
export const productIdParamSchema = Joi.object({
  productId: Joi.string()
    .min(1)
    .required()
    .messages({
      "any.required": "Product ID is required",
    }),
});

/**
 * Generic object ID validation
 */
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .min(1)
    .required()
    .messages({
      "any.required": "ID is required",
    }),
});
