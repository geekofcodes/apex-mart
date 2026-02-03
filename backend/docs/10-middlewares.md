# 10 - Middlewares

## Overview

Middlewares act as the gatekeepers and processors for incoming requests. They handle security, authentication, and data transformation before the request reaches the controller.

## Core Middlewares

### 1. Auth & Refresh Token (`auth.middleware.js`)

- **protect**: Verifies the JWT `Authorization` header. Decodes the user and attaches it to the `req` object.
- **optionalAuth**: Identifies the user if a token is present but doesn't block the request if it's missing (useful for products where registered users might see personalized prices).

### 2. Role-Based Access Control (`role.middleware.js`)

- **authorize(...roles)**: Checks if the user's role matches one of the required roles (e.g., `admin`, `seller`). Must be used after the `protect` middleware.

### 3. Request Validation (`validate.middleware.js`)

- A factory function that takes a Joi schema and validates the `req.body`, `req.params`, or `req.query`.
- Returns a standardized 422 Unprocessable Entity error if validation fails.

### 4. Global Error Handling (`error.middleware.js`)

- **errorHandler**: Catches all errors thrown in controllers or services via the `next()` function or `asyncHandler`.
- Differentiates between operational errors (defined by `AppError`) and programmer errors (like `TypeError` or `SyntaxError`).
- In production, it hides the stack trace.
- **notFoundHandler**: A catch-all for routes that don't match any definition.

### 5. Rate Limiting (`rateLimit.middleware.js`)

- **generalLimiter**: Defaults to 100 requests per 15 minutes per IP.
- **authLimiter**: Stricter limits (10 attempts per hour) on login and registration endpoints to prevent brute forcing.

## Usage in Routes

```javascript
router.post(
  "/admin/action",
  authMiddleware.protect,
  roleMiddleware.authorize("admin"),
  validateMiddleware(adminActionSchema),
  adminController.performAction,
);
```
