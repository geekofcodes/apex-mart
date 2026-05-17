import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderAPI } from "@/api/order.api";
import { formatCurrency } from "@/utils/helpers";
import { CheckCircle, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

// Show last 6 chars of CUID as a readable short code
const formatOrderId = (id) => {
  if (!id) return "";
  return id.slice(-6).toUpperCase();
};

// Calculate estimated delivery date (5 business days from now)
const getEstimatedDelivery = () => {
  const date = new Date();
  let added = 0;
  while (added < 5) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++; // skip weekends
  }
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getOrderById(id);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrder();
  }, [id]);

  if (!order) {
    return (
      <div className="container-custom py-16 text-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="container-custom py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">
          Order Placed Successfully 🎉
        </h1>

        <p className="text-gray-500 mb-1">
          Your order has been placed and will be processed soon.
        </p>

        <p className="text-sm text-gray-400 mb-6">
          Estimated Delivery:{" "}
          <span className="font-medium text-gray-600">
            {getEstimatedDelivery()}
          </span>
        </p>

        <div className="bg-gray-50 rounded-xl p-6 text-left mb-4">
          {/* Order ID */}
          <p className="text-sm text-gray-500">Order ID</p>
          <p className="font-bold mb-4">Order #{formatOrderId(order.id)}</p>

          {/* Shipping address summary */}
          {addr && (
            <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg p-3 mb-4">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Delivering to</p>
                <p className="font-medium text-sm">{addr.fullName}</p>
                <p className="text-sm text-gray-500">
                  {[addr.city, addr.state].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Items */}
          <p className="text-sm text-gray-500 mb-2">Items</p>

          {order.items.map((item) => (
            <div
              key={item.product?.id || item.id}
              className="flex justify-between mb-2 text-sm"
            >
              <span>
                {item.name || item.product?.title || "Product"} × {item.quantity}
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}

          <div className="border-t mt-4 pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.totalPrice ?? order.totalAmount)}</span>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/products" className="btn-secondary">
            Continue Shopping
          </Link>

          <Link to="/orders" className="btn-primary flex items-center">
            View Orders
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
