# 01 - Backend Overview

## 🏗️ Architecture: MVC + Service Pattern

The Apex Mart backend follows a clean, decoupled architecture to ensure maintainability and scalability.

1.  **Models**: Mongoose schemas that define the data structure and handle database-level validations.
2.  **DTOs (Data Transfer Objects)**: A layer that shapes the outgoing API responses, ensuring internal implementation details (like `__v` or passwords) are removed and the API contract remains stable.
3.  **Services**: The core business logic layer. All calculations, complex queries, and cross-model operations reside here.
4.  **Controllers**: A thin layer that handles HTTP requests, extracts parameters, calls services, and sends responses using DTOs.
5.  **Routes**: Defines the API endpoints and connects them to the appropriate middlewares and controllers.

## 💻 Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh Tokens)
- **Validation**: Joi
- **Storage**: Cloudinary (Image handling)
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 🛡️ Key Design Patterns

- **Singleton Services**: Services are exported as singletons to maintain state (where necessary) and improve performance.
- **Global Error Handling**: A centralized middleware catches all errors, providing consistent error responses and logging.
- **Stateless Authentication**: Using JWTs allows the backend to scale horizontally without session synchronization.
- **Standardized Responses**: Using the `ApiResponse` utility ensures every endpoint returns a consistent JSON structure.
