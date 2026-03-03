// src/pages/LoginDivisao.jsx

import { useParams, useNavigate } from "react-router-dom";
import "../styles/home.css";
import "../styles/loginDivisao.css";

export default function LoginDivisao() {
  const { tipo } = useParams();
  const navigate = useNavigate();

  const labels = {
    atletas: "Atletas",
    comissao: "Comissão Técnica",
    clubes: "Clubes & Associações",
    master: "Master"
  };

  const titulo = labels[tipo] || "Acesso";

  return (
    <div className="home-container">
      <div className="home-overlay">

        <div className="brand-block">
          <img
            src="/agp-logo.png"
            alt="AGP"
            className="logo-agp-img"
          />
          <div className="logo-subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>
        </div>

        <div className="login-divisao-wrapper">
          <div className="login-divisao-card">
            <h2>{titulo}</h2>

            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Senha" />

            <button>Entrar</button>

            <div className="login-links">
              <span onClick={() => navigate("/register")}>
                Criar conta
              </span>
              <span onClick={() => navigate("/divisao")}>
                Voltar
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
