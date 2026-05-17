import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import {
  fetchMyOrders,
  selectOrders,
  selectOrderLoading,
} from "@/features/order/orderSlice";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { ShoppingBag, ArrowRight, Loader2, Package } from "lucide-react";
import { motion } from "framer-motion";

// Status Badge Helper
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-(--color-warning-light) text-(--color-warning-dark)";
    case "processing":
      return "bg-(--color-info-light) text-(--color-info-dark)";
    case "shipped":
      return "bg-(--color-primary-light) text-(--color-primary)";
    case "delivered":
      return "bg-(--color-success-light) text-(--color-success-dark)";
    case "cancelled":
      return "bg-(--color-error-light) text-(--color-error-dark)";
    default:
      return "bg-(--color-background-alt) text-(--color-text-muted)";
  }
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrderLoading);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="container-custom py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-(--color-primary)" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-(--color-text-primary) mb-8">
          My Orders
        </h1>
        <div className="card text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-(--color-background-alt) rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-(--color-text-disabled)" />
          </div>
          <h3 className="text-lg font-medium text-(--color-text-primary) mb-2">
            No orders yet
          </h3>
          <p className="text-(--color-text-muted) mb-6">
            You haven't placed any orders yet. Start shopping to fill your
            history!
          </p>
          <Link to="/products" className="btn-primary flex items-center gap-2">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-(--color-text-primary) mb-8">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-0 hover:border-(--color-border-highlight) transition-colors overflow-hidden cursor-pointer group"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Order Header Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between sm:justify-start sm:gap-4 mb-2">
                  <span className="font-mono text-sm text-(--color-text-muted)">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-(--color-text-muted)">
                  <div className="flex items-center gap-1">
                    <span className="">Placed on:</span>
                    <span className="font-medium text-(--color-text-primary)">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side Info */}
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-right">
                  <p className="text-sm text-(--color-text-muted)">
                    Total Amount
                  </p>
                  <p className="text-lg font-bold text-(--color-text-primary)">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-(--color-background-alt) items-center justify-center group-hover:bg-(--color-primary) group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Expanded items preview (optional visual) */}
            <div className="bg-(--color-background-alt)/30 border-t border-(--color-border) px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
              {order.items.slice(0, 5).map((item) => (
                <div
                  key={item.id || item.productId}
                  className="w-8 h-8 rounded-md border border-(--color-border) bg-white p-0.5"
                  title={item.name}
                >
                  <img
                    src={item.image || "https://placehold.co/50"}
                    className="w-full h-full object-cover rounded-sm"
                    alt={item.name || ""}
                  />
                </div>
              ))}
              {order.items.length > 5 && (
                <span className="text-xs text-(--color-text-muted) font-medium">
                  +{order.items.length - 5} more
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
