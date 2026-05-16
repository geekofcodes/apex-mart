import { AppError } from "./error.middleware.js";
import { HTTP_STATUS, USER_ROLES } from "../utils/constants.js";

/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

/**
 * Check if user has required role(s)
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is seller or admin
 */
export const isSellerOrAdmin = authorize(USER_ROLES.SELLER, USER_ROLES.ADMIN);

/**
 * Check if user is customer (any authenticated user)
 */
export const isCustomer = authorize(
  USER_ROLES.CUSTOMER,
  USER_ROLES.SELLER,
  USER_ROLES.ADMIN,
);

/**
 * Check if user owns the resource or is admin
 */
export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
  }

  const resourceUserId = req.params.userId || req.params.id;
  const isOwner = req.user.id.toString() === resourceUserId;
  const isAdmin = req.user.role === USER_ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You do not have permission to access this resource",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  next();
};
