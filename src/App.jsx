// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Divisao from "./pages/Divisao";
import Register from "./pages/Register";
import LoginDivisao from "./pages/LoginDivisao";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Tela de escolha de divisão */}
        <Route path="/divisao" element={<Divisao />} />

        {/* Login simples */}
        <Route path="/login" element={<Login />} />

        {/* Login por divisão */}
        <Route path="/login/:tipo" element={<LoginDivisao />} />

        {/* Cadastro */}
        <Route path="/register" element={<Register />} />

      </Routes>
    </Router>
  );
}

export default App;
