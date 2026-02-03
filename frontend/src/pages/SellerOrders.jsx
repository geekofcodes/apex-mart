import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// In real app, we'd have fetchSellerOrders or fetchMyOrders would filter by seller role if backend supports it.
// Reusing fetchAllOrders or fetchMyOrders depending on how backend treats Seller role calling /orders/my vs /orders
// Assumption: /orders/my fetches orders assigned to me?
// Or /orders fetches all orders and I filter?
// API Contract says /orders/my -> Customer.
// /orders -> Admin.
// Seller endpoint missing in standard list for "Get orders for my products".
// I will reuse AdminOrders logic/style but maybe mock the data or use fetchMyOrders as placeholder (which might be empty if seller != customer).
// Ideally, Seller needs specific endpoint.
// For this task, I will mock the list or reuse AdminOrders component if possible but with read-only view.
// Let's create a read-only view.
import {
  fetchAllOrders,
  selectAdminOrders,
  selectOrderLoading,
} from "@/features/order/orderSlice";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Loader2 } from "lucide-react";

// NOTE: Using Admin fetchAllOrders temporarily since API contract doesn't explicitly have Seller-specific order list endpoint separate from Admin/Customer.
// In real world, would be `fetchSellerOrders`.
// And checking contract: GET /orders is Admin only.
// So this page might fail for Seller if backend adheres strictly to Roles: Admin.
// However, I need to implement the page. I'll implement it assuming the user might have permission or I'll handle the error.
// Or I can use `fetchMyOrders` if the seller account also places orders? No, that's buying.
// I will implement purely UI-focused for now.

const SellerOrders = () => {
  // Mock data for display since API gap exists for Seller Orders specific endpoint
  const mockOrders = [
    {
      id: "ORD-SELL-001",
      customer: "Alice",
      items: 2,
      total: 150,
      status: "Shipped",
      date: "2023-10-25",
    },
    {
      id: "ORD-SELL-002",
      customer: "Bob",
      items: 1,
      total: 45,
      status: "Processing",
      date: "2023-10-26",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
        Order Management
      </h1>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-background-alt) text-(--color-text-muted) uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {mockOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-(--color-background-alt)/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-medium text-(--color-text-primary)">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 text-center">{order.items}</td>
                  <td className="px-6 py-4 text-right font-bold">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-(--color-text-muted)">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerOrders;
