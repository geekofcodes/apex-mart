import cartRepository from "../repositories/cart.repository.js";
import productRepository from "../repositories/product.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PRODUCT_STATUS } from "../utils/constants.js";

/**
 * Cart Service - Contains all cart management business logic
 */
class CartService {
  /**
   * Validate quantity is a positive integer
   */
  #validateQuantity(quantity) {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q <= 0) {
      throw new AppError(
        "Quantity must be a positive integer greater than 0",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    return q;
  }

  /**
   * Get or create cart for user. Prunes inactive products automatically.
   */
  async getOrCreateCart(userId) {
    let cart = await cartRepository.findOrCreate(userId);

    // Prune stale items (deleted or inactive products)
    const pruned = await cartRepository.pruneInactiveItems(cart.id);
    if (pruned) {
      cart = await cartRepository.reload(cart.id);
    }

    return cart;
  }

  /**
   * Get user's cart
   */
  async getCart(userId) {
    return this.getOrCreateCart(userId);
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId, productId, quantity) {
    const validQuantity = this.#validateQuantity(quantity);

    // Validate product
    const product = await productRepository.findById(productId, false);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!product.isActive || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError("Product is not available", HTTP_STATUS.BAD_REQUEST);
    }

    if (product.stock < validQuantity) {
      throw new AppError(
        `Insufficient stock. Only ${product.stock} items available`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if adding this quantity would exceed stock
    // Use product.id (Prisma normalised shape exposes both id and _id)
    const existingItem = cart.items.find(
      (i) =>
        (i.product?.id ?? i.product?.id)?.toString() === productId.toString(),
    );
    const totalQuantity = existingItem
      ? existingItem.quantity + validQuantity
      : validQuantity;

    if (totalQuantity > product.stock) {
      throw new AppError(
        `Cannot add ${validQuantity} items. Maximum available: ${product.stock - (existingItem?.quantity || 0)}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Add item with current price
    const price = product.discountPrice || product.price;
    await cartRepository.upsertItem(cart.id, productId, validQuantity, price);

    return cartRepository.reload(cart.id);
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(userId, productId, quantity) {
    const validQuantity = this.#validateQuantity(quantity);

    const cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    const hasItem = await cartRepository.hasItem(cart.id, productId);
    if (!hasItem) {
      throw new AppError("Item not found in cart", HTTP_STATUS.NOT_FOUND);
    }

    // Validate product and stock
    const product = await productRepository.findById(productId, false);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!product.isActive || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError("Product is not available", HTTP_STATUS.BAD_REQUEST);
    }

    if (validQuantity > product.stock) {
      throw new AppError(
        `Insufficient stock. Only ${product.stock} items available`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Update quantity and price snapshot
    const price = product.discountPrice || product.price;
    await cartRepository.setItemQuantity(
      cart.id,
      productId,
      validQuantity,
      price,
    );

    return cartRepository.reload(cart.id);
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(userId, productId) {
    const cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    const hasItem = await cartRepository.hasItem(cart.id, productId);
    if (!hasItem) {
      throw new AppError("Item not found in cart", HTTP_STATUS.NOT_FOUND);
    }

    await cartRepository.removeItem(cart.id, productId);

    return cartRepository.reload(cart.id);
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    const cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    await cartRepository.clearItems(cart.id);

    return cartRepository.reload(cart.id);
  }

  /**
   * Validate cart items (check stock and availability)
   */
  async validateCart(userId) {
    const cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    const validationErrors = [];

    for (const item of cart.items) {
      const p = item.product;

      if (!p || !p.isActive) {
        validationErrors.push({
          productId: p?.id || "unknown",
          message: "Product is no longer available",
        });
        continue;
      }

      // We don't have .status property natively on the returned item.product
      // but it might be mapped, or we can just look at stock/isActive.
      // DTO product doesn't necessarily have status unless we derive it.
      const status =
        p.stock > 0 ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.OUT_OF_STOCK;

      if (status !== PRODUCT_STATUS.ACTIVE) {
        validationErrors.push({
          productId: p.id,
          productName: p.name,
          message: "Product is not available for purchase",
        });
      }

      if (item.quantity > p.stock) {
        validationErrors.push({
          productId: p.id,
          productName: p.name,
          message: `Insufficient stock. Only ${p.stock} items available`,
          requestedQuantity: item.quantity,
          availableStock: p.stock,
        });
      }
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      cart,
    };
  }
}

export default new CartService();
