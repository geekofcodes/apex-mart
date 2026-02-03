# Apex Mart Backend Documentation

Welcome to the official documentation for the Apex Mart Backend. This documentation provides a comprehensive overview of the architecture, modules, and infrastructure that power the Apex Mart e-commerce platform.

## 📚 Documentation Index

### Core Documentation

- [01-Overview](01-overview.md) - Architecture, tech stack, and design patterns.
- [02-Development Journey](02-development-journey.md) - Step-by-step build process and technical decisions.
- [API Contract](api-contract/API_CONTRACT.md) - Request and response definitions for all endpoints.

### 📦 Module Documentation

Detailed information for each functional module:

- [03-Auth Module](modules/03-auth-module.md) - Authentication, Registration, and JWT.
- [04-User Module](modules/04-user-module.md) - Profile and User management.
- [05-Product Module](modules/05-product-module.md) - Catalog management.
- [06-Category Module](modules/06-category-module.md) - Hierarchical organization.
- [07-Cart Module](modules/07-cart-module.md) - Shopping cart operations.
- [08-Order Module](modules/08-order-module.md) - Order processing and lifecycle.
- [09-Review Module](modules/09-review-module.md) - Ratings and user feedback.

### 🛠️ Infrastructure Documentation

- [10-Middlewares](10-middlewares.md) - Security, RBAC, and error handling.
- [11-Utilities](11-utilities.md) - Helpers: ApiResponse, Logger, Pagination.
- [12-Testing](12-testing.md) - Test suite, coverage, and best practices.

## 🚀 Getting Started

The backend is built with **Node.js, Express, and MongoDB**.

1. **Environment Setup**: Copy `.env.example` to `.env` and fill in the required variables.
2. **Install Dependencies**: `npm install`
3. **Run Development Server**: `npm run dev`
4. **Run Tests**: `npm test`
