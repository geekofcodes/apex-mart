import prisma from "../config/prisma.js";

/**
 * Cart Repository — all DB access for carts and cart items.
 * Replaces all Mongoose Cart instance methods (addItem, removeItem, etc.)
 */
class CartRepository {
  /** Product fields needed when populating cart items */
  #productSelect = {
    id: true,
    title: true,
    slug: true,
    price: true,
    discountPrice: true,
    stock: true,
    isActive: true,
    images: {
      orderBy: { sortOrder: "asc" },
      take: 1,
    },
  };

  /** Normalise a raw Prisma cart into DTO-compatible shape */
  #normalise(cart) {
    if (!cart) return null;

    const items = (cart.items ?? []).map((item) => {
      const p = item.product;
      return {
        _id: item.id,
        product: p
          ? {
              _id: p.id,
              id: p.id,
              name: p.title,
              slug: p.slug,
              price: p.price,
              discountPrice: p.discountPrice ?? null,
              stock: p.stock,
              isActive: p.isActive,
              images: (p.images ?? []).map((img) => ({
                url: img.imageUrl,
                altText: img.altText ?? "",
              })),
            }
          : null,
        quantity: item.quantity,
        price: item.priceSnapshot, // DTO expects 'price'
      };
    });

    return {
      _id: cart.id,
      id: cart.id,
      user: cart.userId,
      items,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /** Recalculate and persist totalItems / totalAmount */
  async #recalculate(cartId, tx = prisma) {
    const items = await tx.cartItem.findMany({ where: { cartId } });
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
    await tx.cart.update({
      where: { id: cartId },
      data: { totalItems, totalAmount },
    });
  }

  /**
   * Find a user's cart with all item relations.
   */
  async findByUserId(userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { select: this.#productSelect } },
        },
      },
    });
    return this.#normalise(cart);
  }

  /**
   * Create an empty cart for a user.
   */
  async create(userId) {
    const cart = await prisma.cart.create({
      data: { userId, totalItems: 0, totalAmount: 0 },
      include: { items: { include: { product: { select: this.#productSelect } } } },
    });
    return this.#normalise(cart);
  }

  /**
   * Get cart or create one if it doesn't exist.
   */
  async findOrCreate(userId) {
    let cart = await this.findByUserId(userId);
    if (!cart) cart = await this.create(userId);
    return cart;
  }

  /**
   * Upsert a cart item — replaces addItem + updateItem.
   * If item exists: increments quantity. If not: creates it.
   */
  async upsertItem(cartId, productId, quantity, priceSnapshot) {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: {
        quantity: { increment: quantity },
        priceSnapshot,
      },
      create: { cartId, productId, quantity, priceSnapshot },
    });
    await this.#recalculate(cartId);
  }

  /**
   * Set item quantity explicitly (for update quantity endpoint).
   */
  async setItemQuantity(cartId, productId, quantity, priceSnapshot) {
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId, productId } },
      data: { quantity, priceSnapshot },
    });
    await this.#recalculate(cartId);
  }

  /**
   * Remove one item from the cart.
   */
  async removeItem(cartId, productId) {
    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    });
    await this.#recalculate(cartId);
  }

  /**
   * Remove all items from the cart (keeps cart row intact).
   * Used after order placement. Accepts an optional tx client.
   */
  async clearItems(cartId, tx = prisma) {
    await tx.cartItem.deleteMany({ where: { cartId } });
    await tx.cart.update({
      where: { id: cartId },
      data: { totalItems: 0, totalAmount: 0 },
    });
  }

  /**
   * Check if a specific product exists in the cart.
   */
  async hasItem(cartId, productId) {
    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });
    return !!item;
  }

  /**
   * Re-fetch and return the cart in normalised form (after mutations).
   */
  async reload(cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { product: { select: this.#productSelect } },
        },
      },
    });
    return this.#normalise(cart);
  }

  /**
   * Delete stale items where the product is no longer active.
   * Returns true if any items were removed.
   */
  async pruneInactiveItems(cartId) {
    const stale = await prisma.cartItem.findMany({
      where: {
        cartId,
        product: { isActive: false },
      },
      select: { id: true },
    });

    if (stale.length === 0) return false;

    await prisma.cartItem.deleteMany({
      where: { id: { in: stale.map((s) => s.id) } },
    });
    await this.#recalculate(cartId);
    return true;
  }
}

export default new CartRepository();
