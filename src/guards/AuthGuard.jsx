import { Navigate } from "react-router-dom";

export default function AuthGuard({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
