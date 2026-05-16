import prisma from "../config/prisma.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../utils/constants.js";

/**
 * Maps service-level string constants → Prisma enum values.
 * Prisma enums are uppercase; service constants are lowercase strings.
 */
const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]:    "PENDING",
  [ORDER_STATUS.PROCESSING]: "CONFIRMED",   // 'processing' → CONFIRMED in DB
  [ORDER_STATUS.SHIPPED]:    "SHIPPED",
  [ORDER_STATUS.DELIVERED]:  "DELIVERED",
  [ORDER_STATUS.CANCELLED]:  "CANCELLED",
  [ORDER_STATUS.REFUNDED]:   "CANCELLED",   // fallback — no REFUNDED enum
};

const PAYMENT_STATUS_MAP = {
  [PAYMENT_STATUS.PENDING]:   "PENDING",
  [PAYMENT_STATUS.COMPLETED]: "PAID",       // 'completed' → PAID in DB
  [PAYMENT_STATUS.FAILED]:    "FAILED",
  [PAYMENT_STATUS.REFUNDED]:  "REFUNDED",
};

/** Reverse maps: Prisma enum → service constant (used in #normalise) */
const ORDER_STATUS_REVERSE = {
  PENDING:   ORDER_STATUS.PENDING,
  CONFIRMED: ORDER_STATUS.PROCESSING,
  SHIPPED:   ORDER_STATUS.SHIPPED,
  DELIVERED: ORDER_STATUS.DELIVERED,
  CANCELLED: ORDER_STATUS.CANCELLED,
};

const PAYMENT_STATUS_REVERSE = {
  PENDING:  PAYMENT_STATUS.PENDING,
  PAID:     PAYMENT_STATUS.COMPLETED,
  FAILED:   PAYMENT_STATUS.FAILED,
  REFUNDED: PAYMENT_STATUS.REFUNDED,
};

/** Prisma-accepted payment method enum values */
const VALID_PAYMENT_METHODS = new Set(["COD", "RAZORPAY", "STRIPE", "PAYPAL"]);

/**
 * Generate a unique order number.
 * Format: ORD-<13-digit ms timestamp>-<6-digit random>
 * Uniqueness is additionally enforced by the DB unique constraint on orderNumber.
 */
function generateOrderNumber() {
  const ts   = Date.now().toString();
  const rand = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `ORD-${ts}-${rand}`;
}

/**
 * Validate that item.product is a non-empty string before using it as a Prisma id.
 *
 * Rule 5 (ID Safety): No implicit conversions, no toString().
 * A non-string id would cause a silent Prisma type error or wrong query.
 *
 * @param {*}      productId - the value from item.product
 * @param {number} index     - item position in the array (for error context)
 */
function assertProductIdIsString(productId, index) {
  if (typeof productId !== "string" || productId.trim() === "") {
    throw new Error(
      `Order item at index ${index} has an invalid product id ` +
      `(got ${productId === null ? "null" : typeof productId}). ` +
      `Expected a non-empty string.`
    );
  }
}

/**
 * Order Repository — all DB access for orders.
 *
 * ── Transaction Safety ──────────────────────────────────────────────────────
 *
 * ATOMICITY (create):
 *   The entire checkout flow (stock, price, address, order, cart) runs inside
 *   a single `prisma.$transaction`. Any failure at any step rolls back every
 *   prior write in that transaction — no partial state is ever persisted.
 *
 * RACE CONDITION PREVENTION (stock):
 *   Stock is decremented with a single conditional SQL UPDATE:
 *     UPDATE products SET stock = stock - N WHERE id = ? AND stock >= N
 *   If two concurrent requests race for the last item, PostgreSQL serialises
 *   the two UPDATEs under row-level locking. Only the first matches the
 *   condition (count=1). The second gets count=0 → throws → full rollback.
 *   There is NO window between a read and a write (no findUnique + update).
 *
 * PRICE INTEGRITY:
 *   priceSnapshot is ALWAYS fetched from the DB inside the transaction.
 *   No price from the service layer, cart snapshot, or client payload is
 *   ever written to an OrderItem. itemsPrice and totalPrice are re-derived
 *   from those DB-fetched prices. Price manipulation is structurally impossible.
 *
 * SINGLE PRODUCT FETCH PER ITEM:
 *   Each product is fetched ONCE via findUniqueOrThrow (price + title + stock
 *   check). The result is reused for both the priceSnapshot and the
 *   productNameSnapshot. No second round-trip is made for the same product.
 *
 * TRANSACTION STEP ORDER (enforced — must not be changed):
 *   1. ID safety guard (pre-flight, before transaction)
 *   2. Inside transaction:
 *      a. Atomic stock validate + decrement (per item, fail fast)
 *      b. Empty order guard (no writes if nothing succeeded)
 *      c. Create address snapshot
 *      d. Create order + order items (DB-priced)
 *      e. Clear cart
 *
 * ATOMIC CANCELLATION:
 *   cancelOrder runs a single prisma.$transaction that updates the order status
 *   AND restores all product stock in one batch. If the status update succeeds
 *   but a stock restore fails, the entire operation rolls back — the order
 *   remains in its previous state and stock is never incorrectly changed.
 */
class OrderRepository {
  // ─── Include shape ─────────────────────────────────────────────────────────

  #include = {
    orderItems: {
      select: {
        id:                  true,
        productId:           true,
        productNameSnapshot: true,
        imageSnapshot:       true,
        quantity:            true,
        priceSnapshot:       true,
      },
    },
    shippingAddress: {
      select: {
        id:           true,
        fullName:     true,
        phone:        true,
        addressLine1: true,
        addressLine2: true,
        city:         true,
        state:        true,
        pincode:      true,
        country:      true,
      },
    },
    user: { select: { id: true, name: true, email: true } },
    payment: true,
  };

  // ─── Normalise ─────────────────────────────────────────────────────────────

  #normalise(order) {
    if (!order) return null;

    const addr = order.shippingAddress;

    return {
      _id:         order.id,
      id:          order.id,
      orderNumber: order.orderNumber,

      user: order.user
        ? {
            _id:   order.user.id,
            id:    order.user.id,
            name:  order.user.name,
            email: order.user.email,
          }
        : order.userId,

      items: (order.orderItems ?? []).map((i) => ({
        _id:      i.id,
        product:  i.productId,
        name:     i.productNameSnapshot,
        image:    i.imageSnapshot ?? "",
        quantity: i.quantity,
        price:    i.priceSnapshot,   // always DB-sourced; never client-supplied
      })),

      shippingAddress: addr
        ? {
            fullName:     addr.fullName     ?? "",
            phone:        addr.phone        ?? "",
            addressLine1: addr.addressLine1 ?? "",
            addressLine2: addr.addressLine2 ?? null,
            city:         addr.city         ?? "",
            state:        addr.state        ?? "",
            postalCode:   addr.pincode      ?? "",
            country:      addr.country      ?? "India",
          }
        : null,

      paymentMethod: order.paymentMethod?.toLowerCase() ?? "cod",
      itemsPrice:    order.itemsPrice,
      taxPrice:      order.taxPrice,
      shippingPrice: order.shippingPrice,
      totalPrice:    order.totalPrice,

      paymentStatus: PAYMENT_STATUS_REVERSE[order.paymentStatus] ?? order.paymentStatus?.toLowerCase(),
      orderStatus:   ORDER_STATUS_REVERSE[order.orderStatus]     ?? order.orderStatus?.toLowerCase(),

      payment: order.payment ? {
        transactionId: order.payment.transactionId,
        gatewayEventId: order.payment.gatewayEventId,
        paymentGatewayId: order.payment.paymentGatewayId,
        amount: order.payment.amount,
        status: order.payment.status,
        method: order.payment.paymentMethod,
        paidAt: order.payment.paidAt,
        createdAt: order.payment.createdAt,
        updatedAt: order.payment.updatedAt,
      } : null,

      paidAt:      order.paidAt      ?? null,
      deliveredAt: order.deliveredAt ?? null,
      createdAt:   order.createdAt,
      updatedAt:   order.updatedAt,
    };
  }

  // ─── Create Order (atomic) ─────────────────────────────────────────────────

  /**
   * Place an order atomically.
   *
   * @param {string} userId
   * @param {string} cartId
   * @param {object} shippingAddress
   * @param {string} paymentMethod
   * @param {Array}  orderItems  - [{ product: string, name, quantity, image }]
   *                               NOTE: `price` field is intentionally ignored.
   *                               All pricing is sourced from the DB.
   */
  async create(userId, cartId, shippingAddress, paymentMethod, orderItems) {
    // ── Pre-flight: validate payment method ────────────────────────────────
    const prismaPaymentMethod = paymentMethod?.toUpperCase() ?? "COD";
    const validPaymentMethod  = VALID_PAYMENT_METHODS.has(prismaPaymentMethod)
      ? prismaPaymentMethod
      : "COD";

    // ── Pre-flight: Rule 5 — ID Safety ────────────────────────────────────
    // Validate every product id before entering the transaction.
    // This catches undefined/null/number ids without touching the DB.
    orderItems.forEach((item, idx) => assertProductIdIsString(item.product, idx));

    // Generate order number; DB unique constraint acts as final safety net.
    let orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const verifiedItems = [];

      // ── Step 1: Atomic stock validate + decrement (one query per item) ────
      //
      // Rule 2 (Single Fetch): We fetch the product ONCE via findUniqueOrThrow.
      // That single fetch gives us:  stock (for the conditional check), price,
      // discountPrice, and title. All are reused below — no second round-trip.
      //
      // Rule 3 (Atomic Stock): After the read we perform a conditional updateMany:
      //   UPDATE products SET stock -= N WHERE id = ? AND stock >= N
      // If count === 0, the product either disappeared or has insufficient stock.
      // We throw immediately, rolling back the whole transaction.
      //
      for (const item of orderItems) {
        // Single authoritative read — supplies BOTH pricing and stock data
        let product;
        try {
          product = await tx.product.findUniqueOrThrow({
            where:  { id: item.product },
            select: { id: true, title: true, price: true, discountPrice: true, stock: true, isActive: true },
          });
        } catch {
          throw new Error(`Product '${item.product}' no longer exists`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.title}" is no longer available`);
        }

        // Atomic conditional decrement — no separate check+update window
        const updated = await tx.product.updateMany({
          where: {
            id:    item.product,
            stock: { gte: item.quantity },  // condition: stock must cover quantity
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          // The condition failed: stock < quantity (between read and update,
          // another transaction decremented it — classic race condition caught).
          // Re-fetch current stock just for an accurate error message
          const current = await tx.product.findUnique({
            where: { id: item.product },
            select: { stock: true }
          });

          throw new Error(
            `Insufficient stock for "${product.title}". ` +
            `Requested: ${item.quantity}, available: ${current?.stock ?? 0}`
          );
        }

        // Rule 1 (DB-Driven Pricing): actualPrice comes ONLY from DB.
        // discountPrice takes precedence if set; otherwise fall back to price.
        const actualPrice = product.discountPrice ?? product.price;

        verifiedItems.push({
          productId:           product.id,    // Prisma native id — no conversion
          productNameSnapshot: product.title, // from DB, not from item.name
          imageSnapshot:       item.image ?? null,
          quantity:            item.quantity,
          priceSnapshot:       actualPrice,   // DB-authoritative, immutable snapshot
        });
      }

      // ── Rule 6: Empty Order Guard ──────────────────────────────────────────
      // If every item failed (all were inactive/OOS), verifiedItems is empty.
      // We must NOT create an order with zero items.
      if (verifiedItems.length === 0) {
        throw new Error("No valid items remain after stock validation. Order cannot be created.");
      }

      // ── Step 2: Compute totals from DB-verified prices ONLY ───────────────
      //
      // Rule 1 (strict): itemsPrice and totalPrice are derived SOLELY from
      // the priceSnapshot values we just fetched from the DB.
      // The `_pricing` parameter from the service layer is NEVER used.
      const itemsPrice   = verifiedItems.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
      const shippingPrice = itemsPrice > 500 ? 0 : 50;
      const taxPrice      = 0;
      const totalPrice    = itemsPrice + shippingPrice + taxPrice;

      // ── Step 3: Create address snapshot ────────────────────────────────────
      const address = await tx.address.create({
        data: {
          userId,
          fullName:     shippingAddress.fullName     ?? null,
          phone:        shippingAddress.phone        ?? null,
          country:      shippingAddress.country      ?? "India",
          state:        shippingAddress.state        ?? null,
          city:         shippingAddress.city         ?? null,
          pincode:      shippingAddress.postalCode   ?? shippingAddress.pincode ?? null,
          addressLine1: shippingAddress.addressLine1 ?? null,
          addressLine2: shippingAddress.addressLine2 ?? null,
        },
      });

      // ── Step 4: Create order + order items ─────────────────────────────────
      // Order number uniqueness retry: on a P2002 unique constraint violation,
      // regenerate once and retry. Two retries is more than sufficient given
      // the 1-in-1,000,000 collision probability of generateOrderNumber().
      let created;
      try {
        created = await tx.order.create({
          data: {
            userId,
            addressId:     address.id,
            orderNumber,
            paymentMethod: validPaymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            paymentStatus: "PENDING",
            orderStatus:   "PENDING",
            orderItems:    { create: verifiedItems },
          },
          include: this.#include,
        });
      } catch (err) {
        if (err.code === "P2002" && err.meta?.target?.includes("orderNumber")) {
          orderNumber = generateOrderNumber();
          created = await tx.order.create({
            data: {
              userId,
              addressId:     address.id,
              orderNumber,
              paymentMethod: validPaymentMethod,
              itemsPrice,
              shippingPrice,
              taxPrice,
              totalPrice,
              paymentStatus: "PENDING",
              orderStatus:   "PENDING",
              orderItems:    { create: verifiedItems },
            },
            include: this.#include,
          });
        } else {
          throw err;
        }
      }

      // ── Step 5: Clear cart ──────────────────────────────────────────────────
      await tx.cartItem.deleteMany({ where: { cartId } });
      await tx.cart.update({
        where: { id: cartId },
        data:  { totalItems: 0, totalAmount: 0 },
      });

      return created;
    }, {
      timeout: 15_000,   // allow concurrent checkouts enough time
    });

    return this.#normalise(order);
  }

  // ─── Read operations ───────────────────────────────────────────────────────

  async findById(id) {
    const order = await prisma.order.findUnique({
      where:   { id },
      include: this.#include,
    });
    return this.#normalise(order);
  }

  async findByUserId(userId, { skip = 0, limit = 10 } = {}) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where:   { userId },
        include: this.#include,
        orderBy: { createdAt: "desc" },
        skip,
        take: Math.min(limit, 50),
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { orders: orders.map((o) => this.#normalise(o)), total };
  }

  async findAll({ skip = 0, limit = 10, userId, orderStatus } = {}) {
    const where = {};
    if (userId)      where.userId      = userId;
    if (orderStatus) where.orderStatus = ORDER_STATUS_MAP[orderStatus] ?? orderStatus.toUpperCase();

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: this.#include,
        orderBy: { createdAt: "desc" },
        skip,
        take: Math.min(limit, 100),
      }),
      prisma.order.count({ where }),
    ]);
    return { orders: orders.map((o) => this.#normalise(o)), total };
  }

  // ─── Status updates ────────────────────────────────────────────────────────

  async updateStatus(id, { orderStatus, paymentStatus, deliveredAt, paidAt } = {}) {
    const data = {};

    if (orderStatus  !== undefined)
      data.orderStatus   = ORDER_STATUS_MAP[orderStatus]    ?? orderStatus.toUpperCase();
    if (paymentStatus !== undefined)
      data.paymentStatus = PAYMENT_STATUS_MAP[paymentStatus] ?? paymentStatus.toUpperCase();
    if (deliveredAt !== undefined) data.deliveredAt = deliveredAt;
    if (paidAt      !== undefined) data.paidAt      = paidAt;

    const order = await prisma.order.update({
      where:   { id },
      data,
      include: this.#include,
    });
    return this.#normalise(order);
  }

  // ─── Atomic Payment Update ─────────────────────────────────────────────────

  /**
   * Atomic Payment + Order Update
   * Ensure payment row is created/updated and order statuses are synced in ONE transaction.
   * Enforces DB-Level Idempotency because Payment.orderId is UNIQUE.
   */
  async updatePaymentAtomic(orderId, paymentData) {
    const { paymentMethod, paymentGatewayId, transactionId, gatewayEventId, amount, paymentStatus, orderStatus, paidAt } = paymentData;

    const orderUpdateData = {};
    if (paymentStatus) orderUpdateData.paymentStatus = PAYMENT_STATUS_MAP[paymentStatus] ?? paymentStatus.toUpperCase();
    if (orderStatus) orderUpdateData.orderStatus = ORDER_STATUS_MAP[orderStatus] ?? orderStatus.toUpperCase();
    if (paidAt !== undefined) orderUpdateData.paidAt = paidAt;

    const dbPaymentStatus = PAYMENT_STATUS_MAP[paymentStatus] ?? paymentStatus.toUpperCase();
    const dbPaymentMethod = (paymentMethod || "COD").toUpperCase();

    const order = await prisma.$transaction(async (tx) => {
      // 1. Atomic payment row upsert (enforces orderId UNIQUE constraint)
      await tx.payment.upsert({
        where: { orderId },
        update: {
          status: dbPaymentStatus,
          transactionId: transactionId || undefined,
          paymentGatewayId: paymentGatewayId || undefined,
          gatewayEventId: gatewayEventId || undefined,
          ...(paidAt !== undefined && { paidAt }),
        },
        create: {
          orderId,
          amount,
          paymentMethod: dbPaymentMethod,
          status: dbPaymentStatus,
          transactionId: transactionId || null,
          paymentGatewayId: paymentGatewayId || null,
          gatewayEventId: gatewayEventId || null,
          paidAt: paidAt || null,
        }
      });

      // 2. Atomic order update
      return tx.order.update({
        where: { id: orderId },
        data: orderUpdateData,
        include: this.#include,
      });
    });

    return this.#normalise(order);
  }

  // ─── Atomic Cancellation ───────────────────────────────────────────────────

  /**
   * Cancel an order and restore stock in ONE atomic transaction.
   *
   * Rule 7 (Atomic Cancellation): The status update and ALL stock restores
   * execute inside a single prisma.$transaction. If any stock restore fails,
   * the status update is rolled back too — the order never ends up cancelled
   * with un-restored stock, and stock is never restored for a non-cancelled order.
   *
   * Uses updateMany for stock restore (Rule B / safe restore):
   * If a product has been hard-deleted by an admin, updateMany silently matches
   * 0 rows and continues. A regular update would throw P2025 and crash the flow.
   *
   * @param {string} orderId
   * @param {Array}  items   - [{ product: string, quantity: number }]
   * @returns {object}       normalised order in CANCELLED state
   */
  async cancelOrder(orderId, items) {
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status to CANCELLED
      const order = await tx.order.update({
        where:   { id: orderId },
        data:    { orderStatus: "CANCELLED" },
        include: this.#include,
      });

      // 2. Restore stock for every item in the same transaction
      for (const item of items) {
        await tx.product.updateMany({
          where: { id: item.product },          // Prisma native id — no conversion
          data:  { stock: { increment: item.quantity } },
        });
      }

      return order;
    }, {
      timeout: 10_000,
    });

    return this.#normalise(cancelledOrder);
  }

  // ─── Stock restoration (standalone) ───────────────────────────────────────

  /**
   * Restore stock outside a cancel flow (e.g., admin bulk restore).
   * Uses updateMany so missing products are skipped without crashing.
   *
   * @param {Array} items - [{ product: string, quantity: number }]
   */
  async restoreStock(items) {
    if (!items || items.length === 0) return;

    await prisma.$transaction(
      items.map((item) =>
        prisma.product.updateMany({
          where: { id: item.product },
          data:  { stock: { increment: item.quantity } },
        }),
      ),
    );
  }

  async hasUserPurchasedProduct(userId, productId) {
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { 
          userId, 
          orderStatus: "DELIVERED",
          paymentStatus: "PAID"
        },
      },
      select: { id: true },
    });
    return item !== null;
  }
}

export default new OrderRepository();
