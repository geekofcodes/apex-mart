import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import {
  fetchAllOrders,
  selectAdminOrders,
  selectOrderLoading,
} from "@/features/order/orderSlice";
import {
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/helpers";

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="card p-6 flex items-start justify-between">
    <div>
      <p className="text-(--color-text-muted) font-medium text-sm mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-(--color-text-primary)">
        {value}
      </h3>
      {trend && (
        <span className="text-xs text-(--color-success) flex items-center gap-1 mt-2 font-medium">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const orders = useAppSelector(selectAdminOrders);
  const loading = useAppSelector(selectOrderLoading);

  // Initial fetch for summary data
  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 5 }));
  }, [dispatch]);

  // Calculate simple stats
  const totalOrders = orders.length; // This is only partial if paginated, but good for now as we don't have dedicated stats API
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );

  // Status color helper (reused)
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          Dashboard Overview
        </h1>
        <p className="text-(--color-text-muted)">
          Welcome back, Admin. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="1,234"
          icon={Users}
          color="bg-blue-500"
          trend="+12% from last month"
        />
        <StatCard
          title="Total Orders"
          value={loading ? "..." : totalOrders}
          icon={ShoppingBag}
          color="bg-purple-500"
          trend="+5% from last month"
        />
        <StatCard
          title="Total Revenue"
          value={loading ? "..." : formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          trend="+8% from last month"
        />
        <StatCard
          title="Products"
          value="156"
          icon={Package}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-(--color-border) flex justify-between items-center">
          <h3 className="font-bold text-lg text-(--color-text-primary)">
            Recent Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-background-alt) text-(--color-text-muted) uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {loading && orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-(--color-text-muted)"
                  >
                    Loading recent orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-(--color-text-muted)"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-(--color-background-alt)/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-(--color-text-primary)">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-(--color-text-muted)">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-(--color-text-primary)">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
