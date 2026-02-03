import Joi from "joi";
import { USER_ROLES } from "../utils/constants.js";

/**
 * Auth Validation Schemas
 */

// Register validation
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),

  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .optional()
    .messages({
      "any.only": `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit phone number",
    }),
});

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Refresh token validation
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    "string.base": "Refresh token must be a string",
  }),
});

// Update profile validation
export const updateProfileSchema = Joi.object({
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
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Change password validation
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .invalid(Joi.ref("currentPassword"))
    .messages({
      "string.min": "New password must be at least 6 characters",
      "string.max": "New password cannot exceed 128 characters",
      "any.required": "New password is required",
      "any.invalid": "New password must be different from current password",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Password confirmation is required",
    }),
});

/**
 * Validation middleware factory
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    req.body = value;
    next();
  };
};
