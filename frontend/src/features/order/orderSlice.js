import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { orderAPI } from "../../api/order.api";

// Async Thunks
export const fetchMyOrders = createAsyncThunk(
  "order/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getMyOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchOrderDetails = createAsyncThunk(
  "order/fetchOrderDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getOrderById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details",
      );
    }
  },
);

// Admin Thunks
export const fetchAllOrders = createAsyncThunk(
  "order/fetchAllOrders",
  async (params, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getAllOrders(params);
      console.log("fetchAllOrders - API Response:", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch all orders",
      );
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "order/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await orderAPI.updateOrderStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order status",
      );
    }
  },
);

const initialState = {
  orders: [], // User orders
  adminOrders: [], // Admin all orders
  activeOrder: null,
  loading: false,
  error: null,
  meta: null, // Pagination meta
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
    clearOrderErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Order Details
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin: Fetch All Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        // Check if payload has data property (standard response) or is direct array
        // API contract says: data: OrderDTO[], meta: ...
        // Our api wrapper returns response.data, which is { success, message, data: [], meta: {} }
        // Wait, typical axios returns response object. `response.data` is the body.
        // My api wrapper returns `response.data` (the body).
        // So action.payload is the body.
        // Body structure: { success, message, data: OrderDTO[], meta }
        state.adminOrders = Array.isArray(action.payload)
          ? action.payload
          : action.payload.data || [];
        state.meta = action.payload.meta;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin: Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        // Update in adminOrders list
        const updatedOrder = action.payload.data;
        if (updatedOrder) {
          const index = state.adminOrders.findIndex(
            (o) => o.id === updatedOrder.id,
          );
          if (index !== -1) {
            state.adminOrders[index] = updatedOrder;
          }
          if (state.activeOrder && state.activeOrder.id === updatedOrder.id) {
            state.activeOrder = updatedOrder;
          }
        }
      });
  },
});

export const { clearActiveOrder, clearOrderErrors } = orderSlice.actions;

// Selectors
export const selectOrders = (state) => state.order.orders;
export const selectAdminOrders = (state) => state.order.adminOrders;
export const selectActiveOrder = (state) => state.order.activeOrder;
export const selectOrderLoading = (state) => state.order.loading;
export const selectOrderError = (state) => state.order.error;
export const selectOrderMeta = (state) => state.order.meta;

export default orderSlice.reducer;
