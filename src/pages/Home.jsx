// src/pages/Home.jsx
import { useState } from "react";
import "../styles/home.css";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="home">
      {/* Background puro */}
      <div className="home-background" />

      {/* Overlay */}
      <div className="home-overlay">
        <div className="home-content">

          {/* Logo */}
          <div className="logo-agp">AGP</div>

          {/* Subtítulo */}
          <div className="subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>

          {/* Hero */}
          <h1 className="hero">
            Transformando dados em decisões esportivas
          </h1>

          {/* Descrição */}
          <p className="description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </p>

          {/* CTA */}
          {!showLogin && (
            <button
              className="cta"
              onClick={() => setShowLogin(true)}
            >
              Entrar no sistema
            </button>
          )}

          {/* Slot vazio — login entra na próxima etapa */}
          <div className="login-slot">
            {showLogin && (
              <div className="login-placeholder">
                {/* LoginContainer entra na ETAPA 2 */}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
