import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Divisao from "./pages/Divisao";
import Register from "./pages/Register";
import LoginDivisao from "./pages/LoginDivisao";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

function App() {

  return (

    <AuthProvider>

      <Router>

        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/divisao" element={<Divisao />} />

          <Route path="/login/:tipo" element={<LoginDivisao />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard-atleta"
            element={
              <ProtectedRoute tipoPermitido="atletas">
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
            path="/dashboard-clubes"
            element={
              <ProtectedRoute tipoPermitido="clubes">
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

        </Routes>

      </Router>

    </AuthProvider>

  );

}

export default App;
