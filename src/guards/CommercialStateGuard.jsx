import { Navigate } from "react-router-dom";

export default function CommercialStateGuard({ commercialState, children }) {
  if (commercialState === "encerrado") {
    return <Navigate to="/relatorios" replace />;
  }

  return children;
}
