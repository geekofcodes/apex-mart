/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Order Statuses
 */
export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

/**
 * Payment Statuses
 */
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CARD: "card",
  PAYPAL: "paypal",
  COD: "COD",
  STRIPE: "stripe",
};

export const PAYMENT_METHOD = PAYMENT_METHODS;

/**
 * User Roles
 */
export const USER_ROLES = {
  CUSTOMER: "customer",
  SELLER: "seller",
  ADMIN: "admin",
};

export const PRODUCT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  OUT_OF_STOCK: "out_of_stock",
  DISCONTINUED: "discontinued",
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden access",
  INTERNAL_SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  BAD_REQUEST: "Bad request",
};

/**
 * Product Categories (Initial)
 */
export const DEFAULT_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Books",
  "Sports",
  "Health & Beauty",
];

export default {
  HTTP_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  USER_ROLES,
  PRODUCT_STATUS,
  ERROR_MESSAGES,
  DEFAULT_CATEGORIES,
};
