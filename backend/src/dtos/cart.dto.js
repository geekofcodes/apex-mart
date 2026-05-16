import ProductDTO from "./product.dto.js";

/**
 * Cart DTO - Shapes cart related responses
 */
class CartDTO {
  /**
   * Cart response
   */
  static cartResponse(cart) {
    if (!cart) return null;

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        product:
          typeof item.product === "object"
            ? ProductDTO.productDetailResponse(item.product)
            : item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    };
  }
}

export default CartDTO;
