import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Divisao from "./pages/Divisao";
import LoginDivisao from "./pages/LoginDivisao";
import Register from "./pages/Register";
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
          <Route path="/divisao" element={<Divisao />} />

          <Route path="/login" element={<Login />} />
          <Route path="/login/:tipo" element={<LoginDivisao />} />
          <Route path="/acesso-administrativo" element={<LoginDivisao />} />

          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

          <Route
            path="/dashboard-atleta"
            element={
              <ProtectedRoute tipoPermitido="atleta">
                <DashboardAtleta />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-comissao"
            element={
              <ProtectedRoute tipoPermitido="comissao">
                <DashboardComissao />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-clube"
            element={
              <ProtectedRoute tipoPermitido="clube">
                <DashboardClube />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-master"
            element={
              <ProtectedRoute tipoPermitido="master">
                <DashboardMaster />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;