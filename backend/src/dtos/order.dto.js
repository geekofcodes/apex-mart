import UserDTO from "./user.dto.js";

/**
 * Order DTO - Shapes order related responses.
 *
 * The repository (#normalise) already maps snapshot fields:
 *   productNameSnapshot → item.name
 *   imageSnapshot       → item.image
 *   priceSnapshot       → item.price
 *
 * DTOs must NOT re-reference item.product (a relation) as that will be null
 * for deleted products. Snapshots are always available.
 */
class OrderDTO {
  /**
   * Map a normalised item from the repository into the API shape.
   * Uses snapshots only — safe even after product deletion.
   */
  static #itemResponse(item) {
    return {
      id: item.id,
      productId: item.product,
      name: item.name || "Product",
      image: item.image || null,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    };
  }

  /**
   * Detailed order response
   */
  static orderDetailResponse(order) {
    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      user: UserDTO.userResponse(order.user),
      items: (order.items ?? []).map((item) => this.#itemResponse(item)),
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
   * Order list response (for "My Orders" page)
   */
  static orderListResponse(order) {
    if (!order) return null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      totalAmount: order.totalPrice,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      itemCount: (order.items ?? []).length,
      // Minimal preview — snapshot fields only, no product relation needed
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        name: item.name || "Product",
        image: item.image || null,
        quantity: item.quantity,
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
   * Admin order response (includes more data)
   */
  static adminOrderResponse(order) {
    if (!order) return null;
    return {
      ...this.orderDetailResponse(order),
      user: UserDTO.minimalUserResponse(order.user),
      updatedAt: order.updatedAt,
      notes: order.notes || [],
    };
  }
}

export default OrderDTO;
