import Joi from "joi";

/**
 * Create product validation
 */
export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).required().messages({
    "any.required": "Product name is required",
    "string.min": "Product name must be at least 3 characters",
  }),
  description: Joi.string().trim().min(10).required().messages({
    "any.required": "Product description is required",
    "string.min": "Product description must be at least 10 characters",
  }),
  price: Joi.number().min(0).required().messages({
    "any.required": "Product price is required",
    "number.min": "Price cannot be negative",
  }),
  discountPrice: Joi.number().min(0).optional().allow(null),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid category ID format",
      "any.required": "Product category is required",
    }),
  stock: Joi.number().integer().min(0).default(0),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        altText: Joi.string().optional().allow(""),
      }),
    )
    .min(1)
    .required()
    .messages({
      "any.required": "At least one product image is required",
      "array.min": "At least one product image is required",
    }),
  specifications: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  brand: Joi.string().optional(),
});

/**
 * Update product validation
 */
export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).optional(),
  price: Joi.number().min(0).optional(),
  discountPrice: Joi.number().min(0).optional().allow(null),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  stock: Joi.number().integer().min(0).optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        altText: Joi.string().optional().allow(""),
      }),
    )
    .optional(),
  specifications: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  brand: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * Update stock validation
 */
export const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required(),
});

/**
 * Filter query validation
 */
export const getProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().optional().allow(""),
  category: Joi.string().optional().allow(""),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sort: Joi.string().optional(),
  brand: Joi.string().optional(),
});

/**
 * Generic object ID validation
 */
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format",
    }),
});

/**
 * Seller ID param validation
 */
export const sellerIdSchema = Joi.object({
  sellerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid seller ID format",
    }),
});
