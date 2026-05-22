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

  // carregando
  if (loading) {
    return <div>Carregando...</div>;
  }

  // sem sessão
  if (!session) {
    return <Navigate to="/" />;
  }

  // sem perfil
  if (!perfil) {
    return <div>Perfil não encontrado.</div>;
  }

  // validação de função
  if (
    tipoPermitido &&
    perfil.funcao?.toLowerCase() !== tipoPermitido.toLowerCase()
  ) {
    return <Navigate to="/" />;
  }

  return children;
}