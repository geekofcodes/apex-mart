import ProductDTO from "./product.dto.js";
import UserDTO from "./user.dto.js";

/**
 * Order DTO - Shapes order related responses
 */
class OrderDTO {
  /**
   * Detailed order response
   */
  static orderDetailResponse(order) {
    if (!order) return null;

    return {
      id: order.id,
      user: UserDTO.userResponse(order.user),
      items: order.items.map((item) => ({
        product: item.product
          ? ProductDTO.productListResponse(item.product)
          : null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        total: item.price * item.quantity,
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
      totalPrice: order.totalPrice,
      totalAmount: order.totalPrice,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * Order list response for current user
   */
  static orderListResponse(order) {
    if (!order) return null;
    return {
      id: order.id,
      totalPrice: order.totalPrice,
      totalAmount: order.totalPrice, // Frontend compatibility
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        product: {
          id: item.product,
          images: [item.image],
          title: item.name,
        },
      })),
    };
  }

  /**
   * Order list array response
   */
  static orderListArrayResponse(orders) {
    if (!orders || !Array.isArray(orders)) return [];
    return orders.map((order) => this.orderListResponse(order));
  }

  /**
   * Admin order response (includes more sensitive data)
   */
  static adminOrderResponse(order) {
    if (!order) return null;
    return {
      ...this.orderDetailResponse(order),
      user: UserDTO.minimalUserResponse(order.user),
      orderNumber: order.orderNumber,
      updatedAt: order.updatedAt,
      notes: order.notes || [],
    };
  }
}

export default OrderDTO;
