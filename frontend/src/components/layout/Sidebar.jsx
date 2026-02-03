import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
} from "lucide-react";
import { USER_ROLES } from "@/utils/constants";

const Sidebar = ({ role, isCollapsed, onToggle }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const adminMenuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Categories", path: "/admin/categories", icon: FolderTree },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  ];

  const sellerMenuItems = [
    { name: "Dashboard", path: "/seller/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/seller/products", icon: Package },
    { name: "Orders", path: "/seller/orders", icon: ShoppingBag },
  ];

  const menuItems =
    role === USER_ROLES.ADMIN ? adminMenuItems : sellerMenuItems;

  const isActive = (path) => location.pathname === path;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "256px" }}
      className="bg-(--color-sidebar-bg) text-(--color-sidebar-text) h-screen sticky top-0 flex flex-col transition-all duration-300"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-(--color-sidebar-hover)">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold">ApexMart</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-(--color-sidebar-hover) rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {/* Back to Home Link */}
          <li>
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-gray-300 hover:bg-(--color-sidebar-hover) hover:text-white cursor-pointer"
              title={isCollapsed ? "Back to Store" : ""}
            >
              <Home className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">Back to Store</span>
              )}
            </Link>
          </li>

          <div className="h-px bg-(--color-sidebar-hover) my-2 mx-2" />

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                    active
                      ? "bg-(--color-primary) text-white"
                      : "text-gray-300 hover:bg-(--color-sidebar-hover) hover:text-white"
                  }`}
                  title={isCollapsed ? item.name : ""}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-(--color-sidebar-hover) space-y-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-gray-300 hover:bg-(--color-error-light)/20 hover:text-(--color-error) w-full cursor-pointer"
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>

        {!isCollapsed && (
          <div className="text-xs text-gray-400">
            <p className="font-medium text-white mb-1">
              {role === USER_ROLES.ADMIN ? "Admin Panel" : "Seller Panel"}
            </p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
