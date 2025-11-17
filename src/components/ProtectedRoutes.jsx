import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);

  // 🚨 If no user found, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ✅ Handle both string and array roles safely
  const hasAccess = Array.isArray(user.role)
    ? user.role.some((r) => allowedRoles.includes(r))
    : allowedRoles.includes(user.role);

  // 🚫 Redirect if user doesn't have access
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  // ✅ Otherwise, allow access
  return <Outlet />;
};

export default ProtectedRoute;
