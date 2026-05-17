import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import { useDebounce } from "../hooks/useDebounce";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  selectCartItems,
  selectCartTotal,
  selectCartLoading,
} from "@/features/cart/cartSlice";
import { formatCurrency } from "@/utils/helpers";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const isLoading = useAppSelector(selectCartLoading);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localQuantities, setLocalQuantities] = useState({});
  const debouncedQuantities = useDebounce(localQuantities, 500);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    setLocalQuantities((prev) => {
      const updated = { ...prev };

      cartItems.forEach((item) => {
        if (!(item.product.id in updated)) {
          updated[item.product.id] = item.quantity;
        }
      });

      return updated;
    });
  }, [cartItems]);

  useEffect(() => {
    Object.entries(debouncedQuantities).forEach(([productId, quantity]) => {
      const item = cartItems.find((i) => i.product.id === productId);

      if (!item) return;

      if (item.quantity !== quantity) {
        dispatch(updateCartItem({ productId, quantity }));
      }
    });
  }, [debouncedQuantities, cartItems, dispatch]);

  const handleUpdateQuantity = (productId, change) => {
    if (isUpdating) return;

    setLocalQuantities((prev) => {
      const current = prev[productId] ?? 1;
      const newQty = current + change;

      if (newQty < 1) return prev;

      return {
        ...prev,
        [productId]: newQty,
      };
    });
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      dispatch(removeFromCart(productId));
    }
  };

  if (isLoading && cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-(--color-background-alt) mb-6">
          <ShoppingCart className="w-10 h-10 text-(--color-text-disabled)" />
        </div>
        <h1 className="text-3xl font-bold text-(--color-text-primary) mb-3">
          Your cart is empty
        </h1>
        <p className="text-(--color-text-muted) mb-8 max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. Explore our
          products and find something you love!
        </p>
        <Link to="/products" className="btn-primary inline-flex items-center">
          Start Shopping
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="text-3xl font-bold text-(--color-text-primary) mb-8">
        Shopping Cart ({cartItems.length} items)
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
        {/* Cart Items List */}
        <div className="flex-1 space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => {
              const quantity =
                localQuantities[item.product.id] ?? item.quantity;

              const price = item.product.discountPrice || item.product.price;

              return (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="card flex gap-4 md:gap-6 items-start md:items-center p-4 md:p-6"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 bg-(--color-background-alt) rounded-lg overflow-hidden border border-(--color-border)">
                    <img
                      src={
                        item.product.images?.[0] ||
                        "https://via.placeholder.com/100"
                      }
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.product.id}`}
                        className="text-lg font-medium text-(--color-text-primary) hover:text-(--color-primary) transition-colors line-clamp-1"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-sm text-(--color-text-muted)">
                        Unit Price: {formatCurrency(price)}
                      </p>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 w-full md:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-(--color-border) rounded-lg">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.product.id, -1)
                          }
                          disabled={quantity <= 1}
                          className="p-2 text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-background-alt) disabled:opacity-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-medium text-(--color-text-primary)">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.product.id, 1)
                          }
                          disabled={quantity >= (item.product.stock || 99)}
                          className="p-2 text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-background-alt) disabled:opacity-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Total & Remove */}
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-lg text-(--color-text-primary) min-w-[80px] text-right">
                          {formatCurrency(price * quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-(--color-text-muted) hover:text-(--color-error) p-2 rounded-full hover:bg-(--color-error-light)/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-(--color-text-primary) mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-(--color-text-muted)">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-(--color-text-muted)">
                <span>Shipping estimate</span>
                <span className="text-(--color-success)">Free</span>
              </div>
              <div className="flex justify-between text-(--color-text-muted)">
                <span>Tax estimate</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="border-t border-(--color-border) pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-(--color-text-primary)">
                  Order Total
                </span>
                <span className="text-2xl font-bold text-(--color-primary)">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full btn-primary h-12 text-lg shadow-lg shadow-(--color-primary)/20 flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <Link
              to="/products"
              className="block text-center mt-4 text-sm text-(--color-text-muted) hover:text-(--color-primary) transition-colors"
            >
              or Continue Shopping
            </Link>
          </div>

          {/* Trust Badges - Mini */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {/* Simplified trust indicators if needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
