# 11 - Utilities

## Overview

Utilities provide shared helper functions that ensure consistency across all services and controllers.

## Key Utilities

### 1. `ApiResponse.js`

Standardizes the JSON structure of every API response.

- **success(res, message, data, statusCode)**: Returns a 200/201 response.
- **error(res, message, errorCode, errors)**: Returns a consistent error format.
- **paginated(res, message, data, page, limit, total)**: Specialized for list endpoints.

### 2. `Pagination.js`

Centralizes pagination logic for Mongoose queries.

- **getPaginationParams(query)**: Extracts `page`, `limit`, and calculates `skip`.
- **getPaginationMeta(page, limit, total)**: Constructs the `meta` object for responses.

### 3. `Logger.js`

A Winston-based logger that provides different log levels:

- **info**: General operational logs.
- **error**: System failures and exceptions.
- **http**: Logs all incoming requests with method and path.
- Configured to log to the console and daily-rotating files in production.

### 4. `Constants.js`

The "Source of Truth" for all magic strings and numbers.

- `HTTP_STATUS`: Mapping of common status codes.
- `ORDER_STATUS`: (pending, shipped, etc.)
- `USER_ROLES`: (admin, seller, customer)
- `ERROR_MESSAGES`: Standardized UI-friendly error text.

### 5. `AsyncHandler.js`

A higher-order function that wraps async routes.

- eliminates the need for `try-catch` blocks in every controller.
- automatically passes any rejected promise to the global error handler.
