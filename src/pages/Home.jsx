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

        {/* ⚠️ TODA A HOME ORIGINAL PERMANECE IGUAL */}
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

        <div className="content-block">
          <div className="hero-title">
            Transformando dados em decisões esportivas
          </div>

          <div className="hero-description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </div>

          {!showAuth && (
            <button
              className="cta"
              onClick={() => setShowAuth(true)}
            >
              Entrar no sistema
            </button>
          )}
        </div>

        {/* ✅ LOGIN ENTRA SEM MEXER EM NADA */}
        {showAuth && <AuthBlock />}

      </div>
    </div>
  );
}
