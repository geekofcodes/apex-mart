import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import DashboardLayout from "../components/layout/DashboardLayout";
import { USER_ROLES } from "../utils/constants";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAppSelector(
    (state) => state.auth,
  );
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // If role is Admin or Seller, use DashboardLayout
  if ([USER_ROLES.ADMIN, USER_ROLES.SELLER].includes(user?.role)) {
    return (
      <DashboardLayout role={user.role}>
        <Outlet />
      </DashboardLayout>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
