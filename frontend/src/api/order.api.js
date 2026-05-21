import axiosInstance from "./axios";

export const orderAPI = {
  createOrder: async (data) => {
    const response = await axiosInstance.post("/orders", data);
    return response.data.data;
  },
  // Get current user's order history
  getMyOrders: async (page = 1, limit = 10) => {
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
