import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { productAPI } from "@/api/product.api";

const initialState = {
  products: [],
  activeProduct: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  },
  filters: {
    search: "",
    category: null,
    minPrice: null,
    maxPrice: null,
    sort: null,
  },
};

// Fetch products (handles both initial load and infinite scroll)
export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (
    { isNewSearch = false, ...params },
    { getState, rejectWithValue, signal },
  ) => {
    try {
      const state = getState().product;
      const page = isNewSearch ? 1 : state.pagination.page;
      const currentFilters = state.filters;

      const queryParams = {
        page,
        limit: state.pagination.limit,
        ...currentFilters,
        ...params, // Override with any passed params
      };

      const response = await productAPI.getProducts(queryParams, signal);
      return { data: response.data, meta: response.meta, isNewSearch };
    } catch (error) {
      if (error.name === "CanceledError" || error.name === "AbortError") {
        return rejectWithValue("__ABORTED__");
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products",
      );
    }
  },
);

// Fetch single product details
export const fetchProductDetails = createAsyncThunk(
  "product/fetchProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product details",
      );
    }
  },
);

// Create product (Seller/Admin)
export const createProduct = createAsyncThunk(
  "product/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productAPI.createProduct(productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create product",
      );
    }
  },
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to page 1 on filter change
      state.pagination.hasMore = true;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    resetProductState: (state) => {
      return initialState;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        const { data, meta, isNewSearch } = action.payload;

        if (isNewSearch) {
          state.products = data;
          state.pagination.page = 2; // Next page is 2
        } else {
          // Filter out duplicates
          const newProducts = data.filter(
            (newP) =>
              !state.products.some(
                (existingP) =>
                  existingP.id === newP.id || existingP._id === newP._id,
              ),
          );
          state.products = [...state.products, ...newProducts];
          state.pagination.page =
            (meta?.page ||
              Math.floor(state.products.length / state.pagination.limit)) + 1;
        }

        state.pagination.total = meta?.total || 0;

        // Determine if more products exist
        if (data.length < state.pagination.limit) {
          state.pagination.hasMore = false;
        } else {
          state.pagination.hasMore = true;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.payload === "__ABORTED__") return;
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Product Details
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.activeProduct = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activeProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, resetProductState, resetPagination } =
  productSlice.actions;

// Selectors
export const selectProducts = (state) => state.product.products;
export const selectProductLoading = (state) => state.product.loading;
export const selectProductError = (state) => state.product.error;
export const selectPagination = (state) => state.product.pagination;
export const selectFilters = (state) => state.product.filters;
export const selectActiveProduct = (state) => state.product.activeProduct;

export default productSlice.reducer;
