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
import {
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

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

const AdminOrders = () => {
  const dispatch = useDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const loading = useAppSelector(selectOrderLoading);
  const meta = useAppSelector(selectOrderMeta);

  // Local state for pagination or filters (mocking pagination for now if backend doesn't fully support it via params in the slice yet)
  const [page, setPage] = useState(1);
  const [statusUpdating, setStatusUpdating] = useState(null); // track which order is updating

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 10 }));
  }, [dispatch, page]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusUpdating(orderId);
    await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    setStatusUpdating(null);
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
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-9 pr-4 py-2 bg-(--color-surface) border border-(--color-border) rounded-lg text-sm focus:outline-none focus:border-(--color-primary) w-64"
            />
          </div>
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
                orders.map((order) => (
                  <tr
                    key={order.id}
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
                        {/* Status Dropdown / Controls */}
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          disabled={statusUpdating === order.id}
                          className="bg-(--color-background) border border-(--color-border) text-xs rounded px-2 py-1 focus:outline-none focus:border-(--color-primary) disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
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
          <span>Showing {orders.length} orders</span>
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
    </div>
  );
};

export default AdminOrders;
