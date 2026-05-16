import jwt from "jsonwebtoken";
import envConfig from "../config/env.config.js";
import userRepository from "../repositories/user.repository.js";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Protect routes - ensures user is authenticated
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError(
      "Not authorized to access this route",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, envConfig.jwtAccessSecret);

    // Get user from token via repository (no password returned by default)
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError("No user found with this id", HTTP_STATUS.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new AppError("User account is deactivated", HTTP_STATUS.FORBIDDEN);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Re-throw AppErrors (not found, deactivated) directly
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Not authorized to access this route",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }
});

/**
 * Optional authentication - attaches user if token is valid, but doesn't throw error
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwtAccessSecret);
    const user = await userRepository.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Ignore error and proceed without user
  }
  next();
});

// Alias for compatibility
export const authenticate = protect;

/**
 * Role authorization middleware
 * @param {...string} roles - Allowed roles (e.g., "ADMIN", "SELLER")
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
