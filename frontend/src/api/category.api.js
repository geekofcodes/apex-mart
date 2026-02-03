import axiosInstance from "./axios";

export const categoryAPI = {
  // Fetch all categories
  getCategories: async () => {
    const response = await axiosInstance.get("/categories");
    return response.data;
  },

  // Create a new category (Admin only)
  createCategory: async (categoryData) => {
    const response = await axiosInstance.post("/categories", categoryData);
    return response.data;
  },

  // Fetch category tree
  getCategoryTree: async () => {
    const response = await axiosInstance.get("/categories/tree");
    return response.data;
  },
};
