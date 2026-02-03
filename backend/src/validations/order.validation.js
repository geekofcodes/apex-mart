import Joi from "joi";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "../utils/constants.js";

/**
 * Order Validation Schemas
 */

/**
 * Shipping address validation schema
 */
const shippingAddressSchema = Joi.object({
  fullName: Joi.string().trim().required().messages({
    "any.required": "Full name is required",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),

  addressLine1: Joi.string().trim().required().messages({
    "any.required": "Address line 1 is required",
  }),

  addressLine2: Joi.string().trim().optional().allow(""),

  city: Joi.string().trim().required().messages({
    "any.required": "City is required",
  }),

  state: Joi.string().trim().required().messages({
    "any.required": "State is required",
  }),

  postalCode: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Postal code must be 6 digits",
      "any.required": "Postal code is required",
    }),

  country: Joi.string().trim().optional().default("India"),
});

/**
 * Create order validation
 */
export const createOrderSchema = Joi.object({
  shippingAddress: shippingAddressSchema.required().messages({
    "any.required": "Shipping address is required",
  }),

  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHOD))
    .required()
    .messages({
      "any.only": `Payment method must be one of: ${Object.values(PAYMENT_METHOD).join(", ")}`,
      "any.required": "Payment method is required",
    }),

  tax: Joi.number().min(0).optional().default(0),

  shippingFee: Joi.number().min(0).optional().default(0),

  notes: Joi.string().trim().max(500).optional().messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
});

/**
 * Update order status validation
 */
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required()
    .messages({
      "any.only": `Status must be one of: ${Object.values(ORDER_STATUS).join(", ")}`,
      "any.required": "Status is required",
    }),

  note: Joi.string().trim().max(200).optional().messages({
    "string.max": "Note cannot exceed 200 characters",
  }),
});

/**
 * Update payment status validation
 */
export const updatePaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .required()
    .messages({
      "any.only": `Payment status must be one of: ${Object.values(PAYMENT_STATUS).join(", ")}`,
      "any.required": "Payment status is required",
    }),
});

/**
 * Query parameters validation for getting orders
 */
export const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  orderStatus: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .optional(),
  paymentStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid user ID format",
    }),
});

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid order ID format",
      "any.required": "Order ID is required",
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
