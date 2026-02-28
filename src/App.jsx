import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Unauthorized from "./pages/Unauthorized";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

export default function App() {
  return (
    <Routes>
      {/* ROTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ROTAS DIRETAS (GUARDA TEMPORÁRIA VIA BACKEND/SUPABASE) */}
      <Route path="/atleta" element={<DashboardAtleta />} />
      <Route path="/comissao" element={<DashboardComissao />} />
      <Route path="/clube" element={<DashboardClube />} />
      <Route path="/master" element={<DashboardMaster />} />

      {/* SETUP DE PERFIL */}
      <Route path="/setup" element={<ProfileSetup />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
