// src/pages/Home.jsx
import { useState } from "react";
import "../styles/home.css";
import AuthBlock from "../components/AuthBlock";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* BLOCO SUPERIOR — LOGO + SUBTÍTULO (INTACTO) */}
        <div
          className="brand-block"
          style={{ transform: "translateX(-27vw)" }}
        >
          <img
            src="/agp-logo.jpg"
            alt="AGP"
            className="logo-agp-img"
          />

          <div
            className="logo-subtitle"
            style={{ transform: "translateY(-72px)" }}
          >
            Sports Intelligence Platform
          </div>
        </div>

        {/* BLOCO INFERIOR — TEXTO + CTA (INTACTO) */}
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

        {/* BLOCO DE LOGIN — SOBREPOSIÇÃO, NÃO AFETA A HOME */}
        {showAuth && <AuthBlock />}

      </div>
    </div>
  );
}
