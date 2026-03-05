// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Divisao from "./pages/Divisao";
import Register from "./pages/Register";
import LoginDivisao from "./pages/LoginDivisao";
import DashboardAtleta from "./pages/DashboardAtleta";

function App() {

  return (

    <Router>

      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* DIVISÃO */}
        <Route path="/divisao" element={<Divisao />} />

        {/* LOGIN */}
        <Route path="/login/:tipo" element={<LoginDivisao />} />

        {/* CADASTRO */}
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD ATLETA */}
        <Route path="/dashboard-atleta" element={<DashboardAtleta />} />

      </Routes>

    </Router>

  );

}

export default App;
