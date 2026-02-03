import Joi from "joi";
import { USER_ROLES } from "../utils/constants.js";

/**
 * User Validation Schemas
 */

/**
 * Query parameters validation for getting all users
 */
export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .optional()
    .messages({
      "any.only": `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
    }),

  isActive: Joi.string().valid("true", "false").optional().messages({
    "any.only": "isActive must be either true or false",
  }),

  search: Joi.string().trim().optional().messages({
    "string.base": "Search must be a string",
  }),
});

/**
 * Update user validation (Admin)
 */
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit phone number",
    }),

  avatar: Joi.string().uri().optional().messages({
    "string.uri": "Avatar must be a valid URL",
  }),

  address: Joi.object({
    street: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    zipCode: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
  }).optional(),

  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .optional()
    .messages({
      "any.only": `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
    }),

  isEmailVerified: Joi.boolean().optional().messages({
    "boolean.base": "isEmailVerified must be a boolean",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
});

/**
 * Validation middleware factory
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(422).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (source === "query") {
      req.query = value;
    } else if (source === "params") {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};
