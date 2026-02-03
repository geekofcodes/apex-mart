import cartService from "../services/cart.service.js";
import CartDTO from "../dtos/cart.dto.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Cart Controller - Thin layer handling HTTP requests/responses
 * All business logic is delegated to CartService
 */

/**
 * @route   GET /api/v1/cart
 * @desc    Get current user's cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);

  return ApiResponse.success(
    res,
    "Cart fetched successfully",
    CartDTO.cartResponse(cart),
  );
});

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
export const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await cartService.addItemToCart(
    req.user._id,
    productId,
    quantity,
  );

  return ApiResponse.success(
    res,
    "Item added to cart successfully",
    CartDTO.cartResponse(cart),
  );
});

/**
 * @route   PUT /api/v1/cart/items/:productId
 * @desc    Update item quantity in cart
 * @access  Private
 */
export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateItemQuantity(
    req.user._id,
    productId,
    quantity,
  );

  return ApiResponse.success(
    res,
    "Cart item updated successfully",
    CartDTO.cartResponse(cart),
  );
});

/**
 * @route   DELETE /api/v1/cart/items/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
export const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await cartService.removeItemFromCart(req.user._id, productId);

  return ApiResponse.success(
    res,
    "Item removed from cart successfully",
    CartDTO.cartResponse(cart),
  );
});

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);

  return ApiResponse.success(
    res,
    "Cart cleared successfully",
    CartDTO.cartSummaryResponse(cart),
  );
});

/**
 * @route   GET /api/v1/cart/validate
 * @desc    Validate cart items (stock and availability)
 * @access  Private
 */
export const validateCart = asyncHandler(async (req, res) => {
  const validation = await cartService.validateCart(req.user._id);

  return ApiResponse.success(res, "Cart validated successfully", {
    isValid: validation.isValid,
    errors: validation.errors,
    cart: CartDTO.cartResponse(validation.cart),
  });
});
