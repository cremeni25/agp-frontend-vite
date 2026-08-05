import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import OwnerActivation from "./pages/OwnerActivation";

import DashboardAtleta from "./pages/DashboardAtleta";
import AthleteDailyReadiness from "./pages/AthleteDailyReadiness";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";
import MasterUsers from "./pages/MasterUsers";
import MasterProfiles from "./pages/MasterProfiles";
import MasterParticipants from "./pages/MasterParticipants";
import MasterHomologation from "./pages/MasterHomologationOperational";
import HomologationEnvironment from "./pages/HomologationEnvironment";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/acesso-administrativo" element={<Navigate to="/login?administrativo=1" replace />} />
          <Route path="/ativar-proprietario" element={<OwnerActivation />} />
          <Route path="/divisao" element={<Navigate to="/login" replace />} />
          <Route path="/login/:tipo" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<Navigate to="/login?administrativo=1&link-antigo=1" replace />} />
          <Route path="/alterar-senha" element={<ChangePassword />} />

          <Route path="/dashboard-atleta" element={<ProtectedRoute tipoPermitido="atleta"><DashboardAtleta /></ProtectedRoute>} />
          <Route path="/atleta/prontidao-diaria" element={<ProtectedRoute tipoPermitido="atleta"><AthleteDailyReadiness /></ProtectedRoute>} />
          <Route path="/dashboard-comissao" element={<ProtectedRoute tipoPermitido="comissao"><DashboardComissao /></ProtectedRoute>} />
          <Route path="/dashboard-clube" element={<ProtectedRoute tipoPermitido="clube"><DashboardClube /></ProtectedRoute>} />
          <Route path="/dashboard-master" element={<ProtectedRoute tipoPermitido="master"><DashboardMaster /></ProtectedRoute>} />
          <Route path="/master/usuarios" element={<ProtectedRoute tipoPermitido="master"><MasterUsers /></ProtectedRoute>} />
          <Route path="/master/perfis" element={<ProtectedRoute tipoPermitido="master"><MasterProfiles /></ProtectedRoute>} />
          <Route path="/master/participantes" element={<ProtectedRoute tipoPermitido="master"><MasterParticipants /></ProtectedRoute>} />
          <Route path="/master/homologacao" element={<ProtectedRoute tipoPermitido="master"><MasterHomologation /></ProtectedRoute>} />
          <Route path="/master/homologacao/:slug" element={<ProtectedRoute tipoPermitido="master"><HomologationEnvironment /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
