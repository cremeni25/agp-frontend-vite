import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, tipoPermitido }) {

  const { session, perfil, loading } = useAuth();

  if (loading) return null;

  if (!session) {
    return <Navigate to="/divisao" />;
  }

  if (tipoPermitido && perfil?.tipo_usuario !== tipoPermitido) {
    return <Navigate to="/divisao" />;
  }

  return children;
}
