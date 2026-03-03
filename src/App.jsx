// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";

import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard-atleta" element={<DashboardAtleta />} />
        <Route path="/dashboard-comissao" element={<DashboardComissao />} />
        <Route path="/dashboard-clube" element={<DashboardClube />} />
        <Route path="/dashboard-master" element={<DashboardMaster />} />
      </Routes>
    </BrowserRouter>
  );
}
