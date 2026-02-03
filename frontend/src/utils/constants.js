// User Roles
export const USER_ROLES = {
  CUSTOMER: "customer",
  SELLER: "seller",
  ADMIN: "admin",
};

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
};

// Payment Methods
export const PAYMENT_METHOD = {
  CARD: "card",
  UPI: "upi",
  NET_BANKING: "net_banking",
  WALLET: "wallet",
  COD: "cod",
};

// Product Status
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  OUT_OF_STOCK: "out_of_stock",
};

// API Base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48];

// Navigation Links
export const NAV_LINKS = {
  PUBLIC: [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
  ],
  CUSTOMER: [
    { name: "My Orders", path: "/orders" },
    { name: "Profile", path: "/profile" },
  ],
  SELLER: [
    { name: "Dashboard", path: "/seller/dashboard" },
    { name: "My Products", path: "/seller/products" },
    { name: "Orders", path: "/seller/orders" },
  ],
  ADMIN: [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Users", path: "/admin/users" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders" },
  ],
};

// Toast Duration
export const TOAST_DURATION = 3000;
