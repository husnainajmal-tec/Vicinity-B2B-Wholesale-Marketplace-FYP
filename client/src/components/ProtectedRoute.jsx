import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * Route guard.
 * - Redirects unauthenticated users to /login (preserving intended path).
 * - If `allowedRoles` is provided, users without a matching role are sent
 *   to /unauthorized.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={["seller"]}><SellerDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
