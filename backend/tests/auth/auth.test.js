import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/user.model.js";

describe("Auth API", () => {
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
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("should fail with duplicate email", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Test@123",
        role: "customer",
      };

      await request(app).post("/api/v1/auth/register").send(userData);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "Test@123",
        role: "customer",
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "Test@123",
        role: "customer",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "Test@123",
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(credentials)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
    });

    it("should fail with invalid password", async () => {
      const credentials = {
        email: "test@example.com",
        password: "WrongPassword",
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(credentials)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it("should fail with non-existent email", async () => {
      const credentials = {
        email: "nonexistent@example.com",
        password: "Test@123",
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(credentials)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    let accessToken;

    beforeEach(async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "Test@123",
        role: "customer",
      });

      accessToken = user.generateAccessToken();
    });

    it("should get user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("test@example.com");
    });

    it("should fail without token", async () => {
      const res = await request(app).get("/api/v1/auth/profile").expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
