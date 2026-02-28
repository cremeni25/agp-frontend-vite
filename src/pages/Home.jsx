// src/pages/Home.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthBlock from "../components/AuthBlock";
import "../styles/home.css";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* BLOCO SUPERIOR — LOGO + SUBTÍTULO */}
        <div className="brand-block">
          <img
            src="/agp-logo.jpg"
            alt="AGP"
            className="logo-agp-img"
          />

          <div className="logo-subtitle">
            Sports Intelligence Platform
          </div>
        </div>

        {/* BLOCO CENTRAL — SILHUETA + FRASES */}
        <div className="content-block">

          <div className="hero-title">
            Transformando dados em decisões esportivas
          </div>

          <div className="hero-description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </div>

          {/* BOTÃO SÓ APARECE SE NÃO ESTIVER LOGANDO */}
          {!showAuth && (
            <button
              className="cta"
              onClick={() => setShowAuth(true)}
            >
              Entrar no sistema
            </button>
          )}

        </div>

        {/* BLOCO DE LOGIN / CADASTRO (ESTADO DA HOME) */}
        {showAuth && (
          <AuthBlock />
        )}

      </div>
    </div>
  );
}
