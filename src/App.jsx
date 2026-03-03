// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Divisao from "./pages/Divisao";
import Register from "./pages/Register";
import LoginDivisao from "./pages/LoginDivisao";

function App() {
  return (
    <Router>
      <Routes>

        {/* 1️⃣ Home */}
        <Route path="/" element={<Home />} />

        {/* 2️⃣ Tela de escolha de divisão */}
        <Route path="/divisao" element={<Divisao />} />

        {/* 3️⃣ Login por divisão */}
        <Route path="/login/:tipo" element={<LoginDivisao />} />

        {/* 4️⃣ Cadastro geral (se necessário manter) */}
        <Route path="/register" element={<Register />} />

      </Routes>
    </Router>
  );
}

export default App;
