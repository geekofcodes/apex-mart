import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartAPI } from "../../api/cart.api";
import { toast } from "react-hot-toast";

// Async Thunks
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cart",
      );
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart({ productId, quantity });
      toast.success("Added to cart");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add item");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add item",
      );
    }
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartItem(productId, quantity);
      return response.data;
    } catch (error) {
      toast.error("Failed to update quantity");
      return rejectWithValue(
        error.response?.data?.message || "Failed to update quantity",
      );
    }
  },
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      toast.success("Removed from cart");
      return response.data;
    } catch (error) {
      toast.error("Failed to remove item");
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item",
      );
    }
  },
);

export const clearCart = createAsyncThunk("cart/clear", async () => {
  // Logic to clear cart on frontend if needed, or re-fetch empty cart
  return null;
});

const initialState = {
  items: [],
  totalAmount: 0,
  isLoading: false,
  error: null,
  updatingItemId: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Cart Item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const updatedItems = action.payload.items;

        updatedItems.forEach((updatedItem) => {
          const existing = state.items.find(
            (i) => i.product.id === updatedItem.product.id,
          );

          if (state.updatingItemId !== updatedItem.product.id && existing) {
            existing.quantity = updatedItem.quantity;
          }
        });

        state.totalAmount = action.payload.totalAmount;
        state.updatingItemId = null;
      })
      .addCase(updateCartItem.pending, (state, action) => {
        const { productId, quantity } = action.meta.arg;

        state.updatingItemId = productId;

        const item = state.items.find((i) => i.product.id === productId);
        if (item) {
          item.quantity = quantity;
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload;
        state.updatingItemId = null;
      })

      // Remove from Cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalAmount = action.payload.totalAmount;
      });
  },
});

export const { resetCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => {
    const price = item.product.discountPrice || item.product.price;
    return total + price * item.quantity;
  }, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartLoading = (state) => state.cart.isLoading;

export default cartSlice.reducer;
