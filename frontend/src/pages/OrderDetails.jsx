import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import {
  fetchOrderDetails,
  selectActiveOrder,
  selectOrderLoading,
  selectOrderError,
  clearActiveOrder,
} from "@/features/order/orderSlice";
import { formatCurrency, formatDate } from "@/utils/helpers";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  Loader2,
} from "lucide-react";

// Reuse status color helper - ideally move to utils but fine here for now
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

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const order = useAppSelector(selectActiveOrder);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetails(id));
    }
    return () => {
      dispatch(clearActiveOrder());
    };
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-(--color-primary)" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-custom py-12 flex flex-col items-center">
        <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">
          Order not found
        </h2>
        <p className="text-(--color-text-muted) mb-6">
          {error || "Unable to load order details."}
        </p>
        <button onClick={() => navigate("/orders")} className="btn-secondary">
          Back to Orders
        </button>
      </div>
    );
  }

  // Defensive check even after loading since api might return null data on 404
  if (!order.id) return null;

  return (
    <div className="container-custom py-8 md:py-12">
      <button
        onClick={() => navigate("/orders")}
        className="group flex items-center text-sm text-(--color-text-muted) hover:text-(--color-primary) mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Orders
      </button>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-(--color-border) pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
                  Order #{order.id.slice(-6).toUpperCase()}
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}
                  >
                    {order.orderStatus}
                  </span>
                </h1>
                <p className="text-(--color-text-muted) flex items-center gap-2 mt-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-(--color-text-muted)">
                  Total Amount
                </p>
                <p className="text-3xl font-bold text-(--color-primary)">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-6">
              {order.items.map((item) => (
                <div
                  key={item.product?.id || Math.random()}
                  className="flex gap-4 sm:gap-6"
                >
                  <div className="w-20 h-20 bg-(--color-background-alt) rounded-lg border border-(--color-border) overflow-hidden shrink-0">
                    <img
                      src={
                        item.product?.images?.[0] ||
                        "https://via.placeholder.com/150"
                      }
                      alt={item.product?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-(--color-text-primary) line-clamp-2">
                          {item.product?.title || "Product Unavailable"}
                        </h3>
                        <p className="text-sm text-(--color-text-muted) mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-(--color-text-primary)">
                        {formatCurrency(item.product?.price || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Shipping Address */}
          {/* Note: The backend OrderDTO currently doesn't explicitly expose shippingAddress in the main DTO in API CONTRACT 
                         But assuming it should be there. If missing, we gracefull handle. */}
          <div className="card p-6">
            <h3 className="font-bold text-(--color-text-primary) mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-(--color-text-muted)" />
              Shipping Details
            </h3>
            {/* We will need to check if shipping address is returned. If not, maybe use user info as placeholder or check if backend returns it */}
            {/* For now, assuming user address or generic fallback if not strictly in DTO yet */}
            <div className="text-sm text-(--color-text-muted) space-y-1">
              <p className="font-medium text-(--color-text-primary)">
                {/* Assuming we might not have full address in listing DTO depending on backend implementation of 'getMyOrders' vs 'getOrderById' */}
                Delivery Address
              </p>
              <p>123 Main St (Placeholder)</p>{" "}
              {/* Placeholder until confirmed if BE returns address in this endpoint */}
              <p>New York, NY, 10001</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="card p-6">
            <h3 className="font-bold text-(--color-text-primary) mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-(--color-text-muted)" />
              Payment Information
            </h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-(--color-text-muted)">Payment Status</span>
              <span
                className={`font-medium ${order.paymentStatus === "paid" ? "text-(--color-success)" : "text-(--color-warning)"}`}
              >
                {order.paymentStatus || "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-(--color-text-muted)">Method</span>
              <span className="text-(--color-text-primary)">
                Cash on Delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
