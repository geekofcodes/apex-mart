import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector } from "@/app/hooks";
import { selectCartItems, selectCartTotal } from "@/features/cart/cartSlice";
import { cartAPI } from "@/api/cart.api"; // Direct API call for checkout to handle success redirection manually
import { formatCurrency } from "@/utils/helpers";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// Validation Schema
const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{6}$/, "ZIP code must be 6 digits"),
  phone: z.string().min(10, "Phone number must be 10 digits"),
});

const Checkout = () => {
  const navigate = useNavigate();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      // Could pre-fill from user profile
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Construct payload matching API contract orderDTO structure roughly
      // API expects: { shippingAddress: { line1, city, state, pincode } }
      const orderPayload = {
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          addressLine1: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.zipCode,
        },
        paymentMethod: "COD", // Defaulting to COD as per UI
      };

      await cartAPI.createOrder(orderPayload);
      toast.success("Order placed successfully! 🎉");
      // navigate("/order-confirmation"); // Prepare for next step or just /orders
      navigate("/orders");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/products" className="btn-primary">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-(--color-background) min-h-screen pb-12">
      <div className="bg-(--color-surface) border-b border-(--color-border) sticky top-0 z-40">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-(--color-text-primary)">
              ApexMart
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-2 text-sm font-medium">
            <span className="text-(--color-text-muted)">Cart</span>
            <span className="text-(--color-border)">/</span>
            <span className="text-(--color-primary)">Information</span>
            <span className="text-(--color-border)">/</span>
            <span className="text-(--color-text-disabled)">Shipping</span>
            <span className="text-(--color-border)">/</span>
            <span className="text-(--color-text-disabled)">Payment</span>
          </div>
          <SecureBadge />
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Form Area */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Contact Info */}
              <section>
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-(--color-text-muted)">
                      Email Address
                    </label>
                    <input
                      {...register("email")}
                      className={`input-field ${errors.email ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-(--color-error)">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-(--color-text-muted)">
                      Phone Number
                    </label>
                    <input
                      {...register("phone")}
                      className={`input-field ${errors.phone ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {errors.phone && (
                      <p className="text-xs text-(--color-error)">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section>
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-(--color-text-muted)">
                      Full Name
                    </label>
                    <input
                      {...register("fullName")}
                      className={`input-field ${errors.fullName ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <p className="text-xs text-(--color-error)">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-(--color-text-muted)">
                      Address
                    </label>
                    <input
                      {...register("address")}
                      className={`input-field ${errors.address ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      placeholder="123 Main St, Apt 4B"
                    />
                    {errors.address && (
                      <p className="text-xs text-(--color-error)">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-(--color-text-muted)">
                        City
                      </label>
                      <input
                        {...register("city")}
                        className={`input-field ${errors.city ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-(--color-error)">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-(--color-text-muted)">
                        State
                      </label>
                      <input
                        {...register("state")}
                        className={`input-field ${errors.state ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      />
                      {errors.state && (
                        <p className="text-xs text-(--color-error)">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-1">
                      <label className="text-sm font-medium text-(--color-text-muted)">
                        ZIP Code
                      </label>
                      <input
                        {...register("zipCode")}
                        className={`input-field ${errors.zipCode ? "border-(--color-error) focus:ring-(--color-error)" : ""}`}
                      />
                      {errors.zipCode && (
                        <p className="text-xs text-(--color-error)">
                          {errors.zipCode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method (Visual only for now) */}
              <section>
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                  Payment Method
                </h2>
                <div className="p-4 border border-(--color-primary) bg-(--color-primary-light)/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-(--color-primary)" />
                    <span className="font-medium">Cash on Delivery</span>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-(--color-primary)" />
                </div>
                <p className="text-xs text-(--color-text-muted) mt-2">
                  * More payment options will be available soon.
                </p>
              </section>
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="card sticky top-24 bg-(--color-background-alt)/50 border-(--color-border)">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-(--color-surface) rounded-md border border-(--color-border) overflow-hidden shrink-0 relative">
                      <span className="absolute top-0 right-0 bg-(--color-text-muted) text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-md font-bold">
                        {item.quantity}
                      </span>
                      <img
                        src={item.product.images?.[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-(--color-text-primary) line-clamp-2">
                        {item.product.title}
                      </p>
                      <p className="text-sm text-(--color-text-muted)">
                        {formatCurrency(
                          item.product.discountPrice || item.product.price,
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-(--color-text-primary)">
                      {formatCurrency(
                        (item.product.discountPrice || item.product.price) *
                          item.quantity,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-(--color-border) pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-(--color-text-muted)">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-(--color-text-muted)">Shipping</span>
                  <span className="font-medium text-(--color-success)">
                    Free
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-(--color-border) mt-2">
                  <span>Total</span>
                  <span className="text-xl text-(--color-primary)">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="w-full btn-primary h-12 mt-6 flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform active:scale-[0.99] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="w-5 h-5 mr-2" />
                )}
                {isSubmitting
                  ? "Processing..."
                  : `Pay ${formatCurrency(cartTotal)}`}
              </button>

              <p className="text-xs text-center text-(--color-text-muted) mt-4 flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecureBadge = () => (
  <div className="flex items-center space-x-1 text-(--color-success) bg-(--color-success-light) px-3 py-1 rounded-full text-xs font-semibold">
    <ShieldCheck className="w-3 h-3" />
    <span>100% Secure</span>
  </div>
);

export default Checkout;
