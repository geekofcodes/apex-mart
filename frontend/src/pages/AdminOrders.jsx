import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import {
  fetchAllOrders,
  updateOrderStatus,
  selectAdminOrders,
  selectOrderLoading,
  selectOrderMeta,
} from "@/features/order/orderSlice";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { paymentAPI } from "@/api/payment.api";
import {
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

// Status options for update
const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

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

const getPaymentColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "refunded":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const AdminOrders = () => {
  const dispatch = useDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const loading = useAppSelector(selectOrderLoading);
  const meta = useAppSelector(selectOrderMeta);
  const [loadingId, setLoadingId] = useState(null);

  // Local state for pagination or filters (mocking pagination for now if backend doesn't fully support it via params in the slice yet)
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState(null); // track which order is updating
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 10 }));
  }, [dispatch, page]);

  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter !== "all") {
      if (order.paymentStatus?.toLowerCase() !== statusFilter) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();

      const matches =
        order.id?.toLowerCase().includes(q) ||
        order.user?.name?.toLowerCase().includes(q) ||
        order.user?.id?.toLowerCase().includes(q);

      if (!matches) return false;
    }

    // Date filter (CRITICAL FIX)
    const orderDate = new Date(order.createdAt);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      if (orderDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (orderDate > end) return false;
    }

    return true;
  });

  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusUpdating(orderId);
    await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    setStatusUpdating(null);
  };

  const handleRefund = async (orderId, { reason }) => {
    try {
      setLoadingId(orderId);
      console.log("Initiating refund for order:", orderId);
      await paymentAPI.refundOrder(orderId, { reason });
      toast.success("Refund initiated ✅");
      dispatch(fetchAllOrders());
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            Order Management
          </h1>
          <p className="text-(--color-text-muted)">
            Manage and update customer orders.
          </p>
        </div>

        {/* Placeholder Search/Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search (keep existing UI) */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-(--color-surface) border border-(--color-border) rounded-lg text-sm focus:outline-none focus:border-(--color-primary) w-64"
            />
          </div>

          {/* Date Filters */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-(--color-border) rounded-lg text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-(--color-border) rounded-lg text-sm"
          />

          {/* Status Filter Buttons */}
          <div className="flex gap-2">
            {["all", "completed", "pending", "refunded"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs capitalize border ${
                  statusFilter === status
                    ? "bg-(--color-primary) text-white"
                    : "bg-(--color-surface) text-(--color-text-muted)"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="px-3 py-1 text-xs border rounded"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-background-alt) text-(--color-text-muted) uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {loading && orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-(--color-background-alt)/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-(--color-text-primary)">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-(--color-text-primary)">
                        {order.user?.name || "Unknown User"}
                      </span>{" "}
                      <br />
                      <span className="text-xs text-(--color-text-muted)">
                        ID: {order.user?.id || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-(--color-text-muted)">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {order.items?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-(--color-text-primary)">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Dropdown */}
                        <select
                          value={order.orderStatus}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order.id, e.target.value);
                          }}
                          disabled={statusUpdating === order.id}
                          className="bg-(--color-background) border border-(--color-border) text-xs rounded px-2 py-1 focus:outline-none focus:border-(--color-primary) disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {/* Refund Button */}
                        {order.paymentStatus?.toLowerCase() === "completed" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefund(order.id, {
                                reason: "Admin-initiated refund from dashboard",
                              });
                            }}
                            disabled={loadingId === order.id}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs"
                          >
                            {loadingId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Refund"
                            )}
                          </button>
                        ) : order.paymentStatus?.toLowerCase() ===
                          "refunded" ? (
                          <span className="text-green-600 text-xs font-medium">
                            Refunded
                          </span>
                        ) : null}

                        {/* Loader */}
                        {statusUpdating === order.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-(--color-primary)" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Stats (Mock) */}
        <div className="p-4 border-t border-(--color-border) flex justify-between items-center text-sm text-(--color-text-muted)">
          <span>Showing {filteredOrders.length} orders</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 hover:bg-(--color-background-alt) rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!meta?.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 hover:bg-(--color-background-alt) rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            // className="bg-(--color-surface) rounded-2xl w-[95%] max-w-3xl p-6 relative shadow-xl"
            className="bg-(--color-surface) rounded-2xl w-[95%] max-w-3xl p-6 relative shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-3 right-3 text-gray-500"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  Order #{selectedOrder.id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-sm text-(--color-text-muted)">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm text-(--color-text-muted)">
                  Customer
                </h3>
                <p className="font-medium">{selectedOrder.user?.name}</p>
                <p className="text-xs text-(--color-text-muted)">
                  {selectedOrder.user?.email}
                </p>
              </div>

              {/* Payment */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm text-(--color-text-muted)">
                  Payment
                </h3>

                <p className="text-sm">
                  Status:{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getPaymentColor(
                      selectedOrder.paymentStatus,
                    )}`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                  {selectedOrder.orderStatus === "cancelled" && (
                    <span className="ml-2 text-xs text-red-500 font-medium">
                      • Cancelled
                    </span>
                  )}
                </p>

                <p className="text-sm mt-1">
                  Method: {selectedOrder.paymentMethod || "Razorpay"}
                </p>

                <div className="text-xs mt-1 flex items-center gap-2">
                  <span>Payment ID:</span>

                  <span className="font-mono text-xs">
                    {selectedOrder.razorpayPaymentId || "N/A"}
                  </span>

                  {selectedOrder.razorpayPaymentId && (
                    <button
                      disabled={!selectedOrder.razorpayPaymentId}
                      onClick={() => {
                        if (!selectedOrder.razorpayPaymentId) return;
                        navigator.clipboard.writeText(
                          selectedOrder.razorpayPaymentId,
                        );
                        toast.success("Copied!");
                      }}
                      className="text-blue-500 text-[10px] cursor-pointer hover:underline"
                    >
                      Copy
                    </button>
                  )}
                </div>

                {selectedOrder.razorpayRefundId && (
                  <div className="text-xs mt-1 text-red-500 flex items-center gap-2">
                    <span>Refund ID:</span>

                    <span className="font-mono text-xs">
                      {selectedOrder.razorpayRefundId}
                    </span>

                    <button
                      disabled={!selectedOrder.razorpayRefundId}
                      onClick={() => {
                        if (!selectedOrder.razorpayRefundId) return;
                        navigator.clipboard.writeText(
                          selectedOrder.razorpayRefundId,
                        );
                        toast.success("Copied!");
                      }}
                      className="text-red-400 text-[10px] cursor-pointer hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                )}

                {selectedOrder.refundedAt && (
                  <p className="text-xs text-red-400 mt-1">
                    Refunded on: {formatDate(selectedOrder.refundedAt)}
                  </p>
                )}
              </div>

              {/* Shipping */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 text-sm text-(--color-text-muted)">
                  Shipping
                </h3>

                <p className="text-sm font-medium">
                  {selectedOrder.shippingAddress?.fullName}
                </p>

                <p className="text-xs text-(--color-text-muted)">
                  {selectedOrder.shippingAddress?.addressLine1}
                </p>

                <p className="text-xs text-(--color-text-muted)">
                  {selectedOrder.shippingAddress?.city},{" "}
                  {selectedOrder.shippingAddress?.state}
                </p>

                <p className="text-xs text-(--color-text-muted)">
                  {selectedOrder.shippingAddress?.postalCode},{" "}
                  {selectedOrder.shippingAddress?.country}
                </p>
              </div>
            </div>

            <div className="border-t border-(--color-border) my-5"></div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>

              <div className="space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex justify-between items-center border rounded-lg p-3 bg-(--color-background-alt) hover:shadow-sm transition"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {item?.name || "Product"}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t pt-4">
              <span className="text-sm text-(--color-text-muted)">Total</span>
              <span className="text-xl font-bold text-(--color-primary)">
                {formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
