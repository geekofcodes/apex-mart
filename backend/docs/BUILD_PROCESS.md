# ApexMart Backend – Complete Build & Architecture Guide

This document provides a **complete, step-by-step explanation**
of how the ApexMart backend was designed and implemented.

It strictly reflects the **actual folder structure used in the project**
and explains the purpose, responsibility, and build sequence
of every major component.

This document is intended for:

- Code reviewers
- Interviewers
- New contributors
- Future maintainers

---

## 1. High-Level Backend Goals

The backend was built with the following goals:

- Production-grade architecture
- Clear separation of concerns
- Secure authentication & authorization
- Predictable API contracts
- Scalable module design
- Easy debugging and maintenance

The backend follows an **extended MVC architecture with DTOs and Services**.

---

## 2. Actual Project Structure

backend/
├── src/
│ ├── app.js
│ ├── server.js
│ ├── index.js
│
│ ├── config/
│ ├── models/
│ ├── dtos/
│ ├── controllers/
│ ├── services/
│ ├── routes/
│ ├── validations/
│ ├── middlewares/
│ └── utils/
│
├── tests/
├── docs/
└── .env

Each folder exists for a **single, well-defined responsibility**.

---

## 3. Application Bootstrap Flow

### 3.1 server.js

- Entry point of the application
- Loads environment variables
- Starts the HTTP server
- Handles graceful startup failures

### 3.2 app.js

- Initializes Express app
- Registers global middlewares
- Registers API routes
- Registers centralized error handler

### 3.3 index.js

- Central export hub
- Ensures clean imports across the project

This separation ensures startup logic is isolated from application logic.

---

## 4. Configuration Layer (`src/config`)

### Files

- `db.config.js` – MongoDB connection
- `env.config.js` – Environment variable management
- `cloud.config.js` – External services (cloud storage, if used)

### Purpose

- Centralize configuration
- Avoid hardcoded values
- Support multiple environments

---

## 5. Models Layer (`src/models`)

### Purpose

Defines MongoDB schemas using Mongoose.

### Rules

- Schema definitions ONLY
- No business logic
- No API logic

### Models

- user.model.js
- product.model.js
- category.model.js
- cart.model.js
- order.model.js
- review.model.js

Models define:

- Fields
- Types
- Indexes
- Schema-level constraints

---

## 6. DTO Layer (`src/dtos`)

### Purpose

Shape **all outgoing API responses**.

### Why DTOs Exist

- Prevent raw database objects from leaking
- Hide internal fields
- Ensure consistent API response format

### DTOs

- user.dto.js
- product.dto.js
- order.dto.js
- auth.dto.js

No controller returns raw Mongoose documents.

---

## 7. Controller Layer (`src/controllers`)

### Purpose

Handle HTTP request/response lifecycle.

### Responsibilities

- Extract request data
- Trigger validation
- Call service methods
- Return DTO-wrapped responses

### Controllers

- auth.controller.js
- user.controller.js
- product.controller.js
- category.controller.js
- cart.controller.js
- order.controller.js
- review.controller.js

### Controllers DO NOT:

- Access database directly
- Contain business logic
- Perform calculations

---

## 8. Service Layer (`src/services`)

### Purpose

Contain **all business logic**.

### Responsibilities

- Database interaction
- Authorization rules
- Calculations
- Workflow orchestration

### Services

- auth.service.js
- user.service.js
- product.service.js
- cart.service.js
- order.service.js
- payment.service.js

Example:

- Cart totals are recalculated in order.service.js
- Product ownership checks occur in product.service.js

---

## 9. Routes Layer (`src/routes`)

### Purpose

Define API endpoints and attach middleware.

### Responsibilities

- Map routes to controllers
- Attach auth, RBAC, validation middleware
- Enforce access control

### Routes

- auth.routes.js
- user.routes.js
- product.routes.js
- category.routes.js
- cart.routes.js
- order.routes.js
- review.routes.js

Routes contain **no logic**, only wiring.

---

## 10. Validation Layer (`src/validations`)

### Purpose

Validate incoming request data **before** controller logic.

### Files

- auth.validation.js
- product.validation.js
- order.validation.js

### Why Validation Is Isolated

- Keeps controllers clean
- Prevents invalid data from reaching services
- Standardizes error responses (422)

---

## 11. Middleware Layer (`src/middlewares`)

### Middlewares

- auth.middleware.js – JWT verification
- role.middleware.js – RBAC enforcement
- error.middleware.js – Centralized error handling
- rateLimit.middleware.js – Abuse prevention

### Execution Order

1. Validation
2. Authentication
3. Authorization
4. Controller
5. Error handler

---

## 12. Utility Layer (`src/utils`)

### Purpose

Shared helpers and infrastructure utilities.

### Utilities

- apiResponse.js – Standard API response format
- asyncHandler.js – Async error wrapper
- pagination.js – Pagination helpers
- logger.js – Logging abstraction
- constants.js – Shared constants

Utilities prevent code duplication across modules.

---

## 13. Module Build Order (Step-by-Step)

### Step 1: Authentication Module

- User model
- Auth service
- Auth controller
- JWT & refresh token logic
- Auth DTOs

### Step 2: User Module

- Profile access
- Admin-only user listing
- Read-only design

### Step 3: Category Module

- Admin-only creation
- Flat structure
- Product dependency support

### Step 4: Product Module

- Pagination enforced
- Search support
- Admin/Seller creation
- Stock tracking

### Step 5: Cart Module

- Add/update/remove items
- User-scoped cart
- No trusted totals

### Step 6: Order Module

- Server-side total calculation
- Order lifecycle
- Admin status updates

### Step 7: Review Module

- Authenticated reviews
- One review per product per user
- Rating validation

Each module was added only after its dependencies were stable.

---

## 14. Security Architecture

Implemented security measures:

- Password hashing (bcrypt)
- JWT access & refresh tokens
- Token expiration
- Role-Based Access Control
- Rate limiting
- Input validation
- DTO response shielding

Roles:

- customer
- seller
- admin

---

## 15. Request–Response Data Flow

Client
→ Route
→ Validation
→ Auth Middleware
→ Role Middleware
→ Controller
→ Service
→ Model
→ DTO
→ Response

This ensures predictable behavior and clean debugging.

---

## 16. Final Outcome

The backend now supports:

- Secure authentication
- Role-based authorization
- Product discovery & search
- Cart & checkout
- Order lifecycle management
- Reviews
- Admin & seller operations

The system was built incrementally,
with architecture enforced at every step.

---

## 17. Why This Backend Matters

This backend:

- Is not tutorial-style
- Reflects real production patterns
- Is easy to extend
- Is interview-ready
- Demonstrates system-level thinking

This project was built as a **system**, not a collection of endpoints.
