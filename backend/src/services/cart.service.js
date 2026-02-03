import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PRODUCT_STATUS } from "../utils/constants.js";

/**
 * Cart Service - Contains all cart management business logic
 */
class CartService {
  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name slug images price discountPrice stock status isActive",
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      await cart.populate({
        path: "items.product",
        select: "name slug images price discountPrice stock status isActive",
      });
    }

    // Filter out inactive or deleted products and ensure items have prices
    let hasChanges = false;
    const validItems = cart.items.filter((item) => {
      if (!item.product || !item.product.isActive) {
        hasChanges = true;
        return false;
      }

      // Migration: Ensure price is preserved/sync'd if missing in the cart document
      if (item.price === undefined || item.price === null) {
        item.price = item.product.discountPrice || item.product.price;
        hasChanges = true;
      }

      return true;
    });

    if (hasChanges || validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    return cart;
  }

  /**
   * Get user's cart
   */
  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    return cart;
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId, productId, quantity) {
    // Validate product
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!product.isActive || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError("Product is not available", HTTP_STATUS.BAD_REQUEST);
    }

    if (product.stock < quantity) {
      throw new AppError(
        `Insufficient stock. Only ${product.stock} items available`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if adding this quantity would exceed stock
    const existingItem = cart.getItem(productId);
    const totalQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (totalQuantity > product.stock) {
      throw new AppError(
        `Cannot add ${quantity} items. Maximum available: ${product.stock - (existingItem?.quantity || 0)}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Add item with current price
    const price = product.discountPrice || product.price;
    cart.addItem(productId, quantity, price);

    await cart.save();

    // Populate and return
    await cart.populate({
      path: "items.product",
      select: "name slug images price discountPrice stock status isActive",
    });

    return cart;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(userId, productId, quantity) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!cart.hasProduct(productId)) {
      throw new AppError("Item not found in cart", HTTP_STATUS.NOT_FOUND);
    }

    // Validate product and stock
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!product.isActive || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError("Product is not available", HTTP_STATUS.BAD_REQUEST);
    }

    if (quantity > product.stock) {
      throw new AppError(
        `Insufficient stock. Only ${product.stock} items available`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Update quantity and price snapshot
    cart.updateItemQuantity(productId, quantity);
    const item = cart.getItem(productId);
    item.price = product.discountPrice || product.price;

    await cart.save();

    // Populate and return
    await cart.populate({
      path: "items.product",
      select: "name slug images price discountPrice stock status isActive",
    });

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(userId, productId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!cart.hasProduct(productId)) {
      throw new AppError("Item not found in cart", HTTP_STATUS.NOT_FOUND);
    }

    cart.removeItem(productId);
    await cart.save();

    // Populate and return
    await cart.populate({
      path: "items.product",
      select: "name slug images price discountPrice stock status isActive",
    });

    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    cart.clearCart();
    await cart.save();

    return cart;
  }

  /**
   * Validate cart items (check stock and availability)
   */
  async validateCart(userId) {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
    }

    const validationErrors = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        validationErrors.push({
          productId: item.product?._id,
          message: "Product is no longer available",
        });
        continue;
      }

      if (item.product.status !== PRODUCT_STATUS.ACTIVE) {
        validationErrors.push({
          productId: item.product._id,
          productName: item.product.name,
          message: "Product is not available for purchase",
        });
      }

      if (item.quantity > item.product.stock) {
        validationErrors.push({
          productId: item.product._id,
          productName: item.product.name,
          message: `Insufficient stock. Only ${item.product.stock} items available`,
          requestedQuantity: item.quantity,
          availableStock: item.product.stock,
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
