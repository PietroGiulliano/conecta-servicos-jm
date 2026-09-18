import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/api";

/** Restringe uma área a determinados papéis (ex.: /empresa/* somente EMPRESA). */
export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="Carregando sua sessão..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={homeRouteFor(user.role)} replace />;
  return <Outlet />;
}
