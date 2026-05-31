import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Divisao from "./pages/Divisao";
import LoginDivisao from "./pages/LoginDivisao";
import Register from "./pages/Register";

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
          {/* HOME */}
          <Route path="/" element={<Home />} />

          {/* DIVISÃO */}
          <Route path="/divisao" element={<Divisao />} />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/:tipo" element={<LoginDivisao />} />

          {/* CADASTRO */}
          <Route path="/register" element={<Register />} />

          {/* DASHBOARD ATLETA */}
          <Route
            path="/dashboard-atleta"
            element={
              <ProtectedRoute tipoPermitido="atleta">
                <DashboardAtleta />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD COMISSÃO */}
          <Route
            path="/dashboard-comissao"
            element={
              <ProtectedRoute tipoPermitido="comissao">
                <DashboardComissao />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD CLUBE */}
          <Route
            path="/dashboard-clube"
            element={
              <ProtectedRoute tipoPermitido="clube">
                <DashboardClube />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD MASTER */}
          <Route
            path="/dashboard-master"
            element={
              <ProtectedRoute tipoPermitido="master">
                <DashboardMaster />
              </ProtectedRoute>
            }
          />

          {/* ACESSO NEGADO */}
          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;