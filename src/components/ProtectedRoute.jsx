import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeUserType } from "../config/accessProfiles";

export default function ProtectedRoute({ children, tipoPermitido }) {
  const { session, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="agp-shell" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}><div className="agp-panel"><strong>Carregando AGP...</strong></div></main>;
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
  if (
    metadata.agp_initial_password_issued === true &&
    metadata.agp_password_changed !== true
  ) {
    return <Navigate to="/alterar-senha" replace />;
  }

  const normalizedAllowedType = normalizeUserType(tipoPermitido);

  if (!userType) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (
    normalizedAllowedType &&
    userType !== normalizedAllowedType
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
