import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLoading from "./AuthLoading.jsx";

export default function GuestRoute() {
  const { isAuthenticated, initialized } = useAuth();

  if (!initialized) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
