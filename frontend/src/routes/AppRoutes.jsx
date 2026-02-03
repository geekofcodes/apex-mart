import { Routes, Route } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import ProtectedRoute from "./ProtectedRoute";
import { USER_ROLES } from "../utils/constants";

// Pages
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Profile from "../pages/Profile";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsers from "../pages/AdminUsers";
import AdminCategories from "../pages/AdminCategories";
import AdminProducts from "../pages/AdminProducts";
import AdminOrders from "../pages/AdminOrders";
import SellerDashboard from "../pages/SellerDashboard";
import SellerProducts from "../pages/SellerProducts";
import SellerOrders from "../pages/SellerOrders";
import About from "../pages/About";
import AddCategory from "../pages/AddCategory";
import AddProduct from "../pages/AddProduct";
import Categories from "../pages/Categories";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />

        {/* Customer Protected Routes (also need PublicLayout) */}
        <Route
          element={<ProtectedRoute allowedRoles={[USER_ROLES.CUSTOMER]} />}
        >
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/categories/new" element={<AddCategory />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/new" element={<AddProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
      </Route>

      {/* Seller Routes */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.SELLER]} />}>
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/products" element={<SellerProducts />} />
        <Route path="/seller/products/new" element={<AddProduct />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
