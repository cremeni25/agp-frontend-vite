import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeUserType } from "../config/accessProfiles";

export default function ProtectedRoute({ children, tipoPermitido }) {
  const { session, perfil, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const metadata = session.user?.user_metadata || {};
  if (metadata.agp_initial_password_issued === true && metadata.agp_password_changed !== true) {
    return <Navigate to="/alterar-senha" replace />;
  }

  if (!perfil) {
    return <Navigate to="/unauthorized" replace />;
  }

  const normalizedProfileType =
    perfil.tipo_usuario_normalizado ||
    normalizeUserType(perfil.tipo_usuario || perfil.funcao);
  const normalizedAllowedType = normalizeUserType(tipoPermitido);

  if (
    normalizedAllowedType &&
    normalizedProfileType !== normalizedAllowedType
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
