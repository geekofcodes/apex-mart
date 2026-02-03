import { Package, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";

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

const SellerDashboard = () => {
  // Placeholder stats for seller (would fetch specific seller stats in real prod)
  const stats = [
    {
      title: "My Products",
      value: "12",
      icon: Package,
      color: "bg-blue-500",
      trend: "+2 this month",
    },
    { title: "Low Stock", value: "3", icon: AlertCircle, color: "bg-red-500" },
    {
      title: "Total Sales",
      value: "145",
      icon: ShoppingBag,
      color: "bg-purple-500",
      trend: "+15% growth",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          Seller Dashboard
        </h1>
        <p className="text-(--color-text-muted)">
          Overview of your store performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4">Top Performing Products</h3>
          <p className="text-(--color-text-muted) text-sm">
            No data available yet.
          </p>
        </div>
        <div className="card">
          <h3 className="font-bold text-lg mb-4">Recent Sales</h3>
          <p className="text-(--color-text-muted) text-sm">No recent sales.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
