import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

/** Exige sessão ativa. A autorização real continua sendo do backend. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Carregando sua sessão..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
