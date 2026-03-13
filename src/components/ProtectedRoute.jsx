/**
 * ProtectedRoute — redirects to /login when the user is not authenticated.
 * Optionally accepts a `roles` array to enforce role-based access.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">
          This page is only accessible to:{" "}
          <strong>{roles.join(", ")}</strong>.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Your current role is <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
