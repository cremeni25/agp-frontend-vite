import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/acesso-administrativo" element={<Navigate to="/login?administrativo=1" replace />} />
          <Route path="/divisao" element={<Navigate to="/login" replace />} />
          <Route path="/login/:tipo" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

          <Route path="/dashboard-atleta" element={<ProtectedRoute tipoPermitido="atleta"><DashboardAtleta /></ProtectedRoute>} />
          <Route path="/dashboard-comissao" element={<ProtectedRoute tipoPermitido="comissao"><DashboardComissao /></ProtectedRoute>} />
          <Route path="/dashboard-clube" element={<ProtectedRoute tipoPermitido="clube"><DashboardClube /></ProtectedRoute>} />
          <Route path="/dashboard-master" element={<ProtectedRoute tipoPermitido="master"><DashboardMaster /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
