import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Unauthorized from "./pages/Unauthorized";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

import ProtectedRoute from "./guards/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* ROTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ROTAS PROTEGIDAS */}
      <Route
        path="/atleta"
        element={
          <ProtectedRoute perfil="atleta">
            <DashboardAtleta />
          </ProtectedRoute>
        }
      />

      <Route
        path="/comissao"
        element={
          <ProtectedRoute perfil="comissao">
            <DashboardComissao />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clube"
        element={
          <ProtectedRoute perfil="clube">
            <DashboardClube />
          </ProtectedRoute>
        }
      />

      <Route
        path="/master"
        element={
          <ProtectedRoute perfil="master">
            <DashboardMaster />
          </ProtectedRoute>
        }
      />

      {/* SETUP DE PERFIL */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
