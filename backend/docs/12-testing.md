# Testing

## Overview

The Apex Mart backend includes a comprehensive test suite using Jest and Supertest with in-memory MongoDB for isolated, fast testing.

## Test Stack

- **Jest:** Testing framework
- **Supertest:** HTTP assertion library
- **MongoDB Memory Server:** In-memory database for isolated tests

## Test Structure

```
tests/
├── setup.js              # Test configuration and hooks
├── auth/
│   └── auth.test.js      # Authentication tests
├── user/
│   └── user.test.js      # User management tests
├── product/
│   └── product.test.js   # Product catalog tests
├── cart/
│   └── cart.test.js      # Shopping cart tests
├── order/
│   └── order.test.js     # Order processing tests
└── review/
    └── review.test.js    # Review system tests
```

## Test Setup

### setup.js

Provides test database lifecycle management.

**Features:**

- In-memory MongoDB server
- Automatic database connection
- Data cleanup after each test
- Database teardown after all tests

**Hooks:**

```javascript
beforeAll(() => {
  // Connect to in-memory database
});

afterEach(() => {
  // Clear all collections
});

afterAll(() => {
  // Close connection and stop server
});
```

## Test Coverage

### Auth Tests

- ✅ User registration (success, duplicate, validation)
- ✅ User login (success, invalid credentials)
- ✅ Profile access (with/without token)
- ✅ Token validation

### User Tests

- ✅ List users (admin only)
- ✅ Get user by ID
- ✅ Update user (admin/owner)
- ✅ Delete user (admin only)
- ✅ RBAC enforcement

### Product Tests

- ✅ Create product (seller)
- ✅ List products (public, with filters)
- ✅ Get product by ID
- ✅ Update product (ownership validation)
- ✅ Stock management

### Cart Tests

- ✅ Get cart (empty/populated)
- ✅ Add item (stock validation)
- ✅ Update quantity
- ✅ Remove item
- ✅ Clear cart

### Order Tests

- ✅ Place order from cart
- ✅ Stock deduction
- ✅ List user orders
- ✅ Get order by ID
- ✅ Order validation

### Review Tests

- ✅ Create review (purchase verification)
- ✅ Duplicate prevention
- ✅ List product reviews
- ✅ Rating statistics
- ✅ Update/delete own review

## Running Tests

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test -- auth.test.js
```

### Watch Mode

```bash
npm run test:watch
```

## Test Example

```javascript
describe("POST /api/v1/auth/register", () => {
  it("should register a new user successfully", async () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "Test@123",
      role: "customer",
    };

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(userData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user.email).toBe(userData.email);
  });

  it("should fail with duplicate email", async () => {
    // Create user first
    await User.create({
      name: "Existing User",
      email: "existing@example.com",
      password: "Test@123",
      role: "customer",
    });

    // Try to register with same email
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "New User",
        email: "existing@example.com",
        password: "Test@123",
        role: "customer",
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });
});
```

## Jest Configuration

```json
{
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["./tests/setup.js"],
  "testMatch": ["**/tests/**/*.test.js"],
  "collectCoverageFrom": ["src/**/*.js", "!src/server.js", "!src/config/**"],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "verbose": true,
  "testTimeout": 10000
}
```

## Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## Best Practices

1. **Isolated Tests:** Each test is independent
2. **Clean Database:** Data cleared after each test
3. **Descriptive Names:** Clear test descriptions
4. **Happy + Error Paths:** Test both success and failure
5. **RBAC Testing:** Verify authorization
6. **Validation Testing:** Test input validation
7. **Business Logic:** Test core business rules

## Test Patterns

### Authentication Helper

```javascript
let token;

beforeEach(async () => {
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "Test@123",
    role: "customer",
  });

  token = user.generateAccessToken();
});

// Use token in tests
await request(app)
  .get("/api/v1/cart")
  .set("Authorization", `Bearer ${token}`)
  .expect(200);
```

### Pagination Testing

```javascript
it('should paginate results', async () => {
  // Create 25 products
  for (let i = 0; i < 25; i++) {
    await Product.create({ ... });
  }

  const res = await request(app)
    .get('/api/v1/products?page=2&limit=10')
    .expect(200);

  expect(res.body.data.length).toBe(10);
  expect(res.body.meta.page).toBe(2);
  expect(res.body.meta.total).toBe(25);
});
```

### RBAC Testing

```javascript
it('should deny access to non-admin', async () => {
  const customerToken = ...; // Customer token

  const res = await request(app)
    .get('/api/v1/users')
    .set('Authorization', `Bearer ${customerToken}`)
    .expect(403);

  expect(res.body.success).toBe(false);
});
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm test -- --coverage
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should register a new user"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Future Enhancements

- [ ] E2E tests with Playwright
- [ ] Performance tests
- [ ] Load tests
- [ ] Security tests (OWASP)
- [ ] Contract tests for API
