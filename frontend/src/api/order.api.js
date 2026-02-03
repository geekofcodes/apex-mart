import axiosInstance from "./axios";

export const orderAPI = {
  // Get current user's order history
  getMyOrders: async (page = 1, limit = 10) => {
    // Note: The API contract says /orders/my-orders returns OrderDTO[] directly without pagination meta in the main response format for this specific endpoint,
    // but good practice to handle potential query params if supported later.
    // For now we'll just hit the endpoint.
    const response = await axiosInstance.get("/orders/my-orders");
    return response.data;
  },

  // Get specific order details
  getOrderById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  // Admin: Get all orders
  getAllOrders: async (params) => {
    const response = await axiosInstance.get("/orders", { params });
    return response.data;
  },

  // Admin: Update order status
  updateOrderStatus: async (id, status) => {
    const response = await axiosInstance.put(`/orders/${id}`, {
      orderStatus: status,
    });
    return response.data;
  },
};
