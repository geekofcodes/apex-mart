import axiosInstance from "./axios";

export const productAPI = {
  // Fetch all products with pagination and filters
  getProducts: async (
    { page = 1, limit = 12, category, minPrice, maxPrice, search, sort },
    signal,
  ) => {
    const params = {
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      search,
      sort,
    };

    // Remove undefined/null/empty keys
    Object.keys(params).forEach((key) => {
      if (params[key] == null || params[key] === "") {
        delete params[key];
      }
    });

    const response = await axiosInstance.get("/products", {
      params,
      signal,
    });
    return response.data;
  },

  // Get single product by ID
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  // Create product (Seller/Admin)
  createProduct: async (productData) => {
    const response = await axiosInstance.post("/products", productData);
    return response.data;
  },

  // Update product (Seller/Admin)
  updateProduct: async (id, productData) => {
    const response = await axiosInstance.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (Admin)
  deleteProduct: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },
};
