import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Unauthorized from "./pages/Unauthorized";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

// Guards
import AuthGuard from "./guards/AuthGuard";
import ProfileGuard from "./guards/ProfileGuard";
import CommercialStateGuard from "./guards/CommercialStateGuard";

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Setup de perfil */}
      <Route
        path="/profile-setup"
        element={
          <AuthGuard>
            <ProfileSetup />
          </AuthGuard>
        }
      />

      {/* Dashboards protegidos */}
      <Route
        path="/dashboard/atleta"
        element={
          <AuthGuard>
            <ProfileGuard>
              <CommercialStateGuard>
                <DashboardAtleta />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/comissao"
        element={
          <AuthGuard>
            <ProfileGuard>
              <CommercialStateGuard>
                <DashboardComissao />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/clube"
        element={
          <AuthGuard>
            <ProfileGuard>
              <CommercialStateGuard>
                <DashboardClube />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/master"
        element={
          <AuthGuard>
            <ProfileGuard>
              <DashboardMaster />
            </ProfileGuard>
          </AuthGuard>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
