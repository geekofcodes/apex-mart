# 02 - Development Journey

## 🚀 The Build Process

The restoration of the Apex Mart backend was a systematic process focused on recreating missing core components while standardizing the architectural patterns.

### Phase 1: Foundation & Utilities

- **Standardization**: Implemented `ApiResponse`, `AsyncHandler`, and `Logger` to ensure all future development followed a consistent pattern.
- **Constants**: Defined a global `constants.js` to manage status codes, roles, and status strings in one place.
- **Config**: Restored DB and Cloudinary configurations using a centralized `env.config.js`.

### Phase 2: Core Data Modeling

- **Models**: Rebuilt the `User`, `Product`, `Category`, `Cart`, `Order`, and `Review` models.
- **DTOs**: Implemented DTOs for every model to strictly control what data leaves the server, a key requirement for the "Production-Grade" objective.

### Phase 3: Business Logic Implementation

- **Services**: Built out the service layer. Highlights include:
  - **AuthService**: Handling token rotation (Refresh Tokens).
  - **CategoryService**: Implementing recursive tree generation.
  - **CartService**: Handling complex stock validations during add/update.
  - **OrderService**: Managing atomic stock reduction and order number generation.

### Phase 4: API Exposure & Routing

- **Controllers**: Created thin handlers that leverage the services.
- **Validation**: Built Joi schemas for every incoming request to ensure data integrity at the edge.
- **Routes**: Wired up the endpoints with appropriate authentication and role-based access levels.

### Phase 5: Refinement & Repair

- **Harmonization**: Fixed naming inconsistencies across the codebase (e.g., standardizing on named exports for controllers).
- **Bug Fixing**: Resolved major `SyntaxErrors` and import/export mismatches that occurred during the restoration of disparate files.
- **Stability**: Verified server startup and health check endpoints.

## 🛠️ Key Technical Decisions

- **Named Exports for Controllers**: Switched from class-based default exports to named function exports for better tree-shaking and clearer route definitions.
- **Dual-Token Strategy**: Implemented access/refresh tokens with HttpOnly cookies for significantly higher security compared to local storage tokens.
- **Service Abstraction**: Strictly prohibited database calls inside controllers to ensure the business logic can be tested in isolation.
