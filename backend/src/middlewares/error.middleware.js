import pkg from "@prisma/client";
const { Prisma } = pkg;
import logger from "../utils/logger.js";
import ApiResponse from "../utils/apiResponse.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/constants.js";

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error
  logger.error(`Error: ${error.message}`, {
    statusCode: error.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // --- Prisma Errors ---

  // Known request errors (e.g., constraint violations, not found)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const field = err.meta?.target?.[0] || "field";
        error = new AppError(`${field} already exists`, HTTP_STATUS.CONFLICT);
        break;
      }
      case "P2025":
        // Record not found (e.g., update/delete on missing record)
        error = new AppError("Resource not found", HTTP_STATUS.NOT_FOUND);
        break;
      case "P2003":
        // Foreign key constraint failed
        error = new AppError(
          "Related resource not found",
          HTTP_STATUS.BAD_REQUEST,
        );
        break;
      case "P2023":
        // Inconsistent column data (e.g., bad ID format)
        error = new AppError("Resource not found", HTTP_STATUS.NOT_FOUND);
        break;
      default:
        error = new AppError(
          "Database error",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
    }
  }

  // Validation errors (bad query shape / missing required fields)
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError(
      "Invalid data provided",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  // Initialization errors (misconfigured client)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new AppError(
      "Database connection failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  // --- JWT errors ---
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", HTTP_STATUS.UNAUTHORIZED);
  }

  // Send error response
  return ApiResponse.error(
    res,
    error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    error.statusCode,
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null,
  );
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
  );
  next(error);
};

export { AppError, errorHandler, notFoundHandler };
