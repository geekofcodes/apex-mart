import axiosInstance from "./axios";

export const cartAPI = {
  // Get current user's cart
  getCart: async () => {
    const response = await axiosInstance.get("/cart");
    return response.data;
  },

  // Add item to cart
  addToCart: async ({ productId, quantity }) => {
    console.log("Adding to cart payload:", { productId, quantity });
    const response = await axiosInstance.post("/cart/items", {
      productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    const response = await axiosInstance.put(`/cart/items/${productId}`, {
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (productId) => {
    const response = await axiosInstance.delete(`/cart/items/${productId}`);
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await axiosInstance.post("/orders", orderData);
    return response.data;
  },
};
