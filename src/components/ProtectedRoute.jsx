import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  tipoPermitido
}) {

  const {
    session,
    perfil,
    loading
  } = useAuth();

  // CARREGANDO
  if (loading) {
    return null;
  }

  // SEM LOGIN
  if (!session) {
    return <Navigate to="/divisao" />;
  }

  // SEM PERFIL
  if (!perfil) {
    return <Navigate to="/unauthorized" />;
  }

  // ACESSO NEGADO
  if (
    tipoPermitido &&
    perfil?.tipo_usuario !== tipoPermitido
  ) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}