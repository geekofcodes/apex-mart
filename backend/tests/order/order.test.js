import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/user.model.js";
import Product from "../../src/models/product.model.js";
import Category from "../../src/models/category.model.js";
import Cart from "../../src/models/cart.model.js";
import Order from "../../src/models/order.model.js";

describe("Order API", () => {
  let customerToken;
  let customerId;
  let productId;

  beforeEach(async () => {
    const customer = await User.create({
      name: "Customer User",
      email: "customer@example.com",
      password: "Customer@123",
      role: "customer",
    });

    const category = await Category.create({
      name: "Electronics",
      slug: "electronics",
    });

    const seller = await User.create({
      name: "Seller",
      email: "seller@example.com",
      password: "Seller@123",
      role: "seller",
    });

    const product = await Product.create({
      name: "Test Product",
      description: "Test product description",
      price: 100,
      category: category.id,
      stock: 50,
      seller: seller.id,
    });

    customerToken = customer.generateAccessToken();
    customerId = customer.id;
    productId = product.id;
  });

  describe("POST /api/v1/orders", () => {
    beforeEach(async () => {
      await Cart.create({
        user: customerId,
        items: [
          {
            product: productId,
            quantity: 2,
            priceSnapshot: 100,
          },
        ],
      });
    });

    it("should place order from cart", async () => {
      const orderData = {
        shippingAddress: {
          fullName: "John Doe",
          phone: "1234567890",
          addressLine1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "100001",
          country: "India",
        },
        paymentMethod: "cod",
      };

      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("orderNumber");
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.orderStatus).toBe("pending");
    });

    it("should fail with empty cart", async () => {
      await Cart.findOneAndUpdate({ user: customerId }, { items: [] });

      const orderData = {
        shippingAddress: {
          fullName: "John Doe",
          phone: "1234567890",
          addressLine1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "100001",
          country: "India",
        },
        paymentMethod: "cod",
      };

      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(orderData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid shipping address", async () => {
      const orderData = {
        shippingAddress: {
          fullName: "John Doe",
        },
        paymentMethod: "cod",
      };

      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(orderData)
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/orders", () => {
    beforeEach(async () => {
      await Order.create({
        user: customerId,
        items: [
          {
            product: productId,
            productName: "Test Product",
            quantity: 2,
            priceSnapshot: 100,
            itemTotal: 200,
          },
        ],
        shippingAddress: {
          fullName: "John Doe",
          phone: "1234567890",
          addressLine1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "100001",
          country: "India",
        },
        paymentMethod: "cod",
        subtotal: 200,
        totalAmount: 200,
      });
    });

    it("should get user orders", async () => {
      const res = await request(app)
        .get("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty("total");
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        user: customerId,
        items: [
          {
            product: productId,
            productName: "Test Product",
            quantity: 2,
            priceSnapshot: 100,
            itemTotal: 200,
          },
        ],
        shippingAddress: {
          fullName: "John Doe",
          phone: "1234567890",
          addressLine1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "100001",
          country: "India",
        },
        paymentMethod: "cod",
        subtotal: 200,
        totalAmount: 200,
      });
      orderId = order.id.toString();
    });

    it("should get order by id", async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBeDefined();
    });
  });
});
