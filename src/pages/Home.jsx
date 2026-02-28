// src/pages/Home.jsx
import { useState } from "react";
import Login from "./Login";
import "../styles/home.css";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="home">
      <div className="home-background" />

      <div className="home-overlay">
        <div className="home-content">

          <div className="logo-agp">AGP</div>

          <div className="subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>

          <h1 className="hero">
            Transformando dados em decisões esportivas
          </h1>

          <p className="description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </p>

          {!showLogin && (
            <button
              className="cta"
              onClick={() => setShowLogin(true)}
            >
              Entrar no sistema
            </button>
          )}

          {showLogin && (
            <div className="login-slot">
              <Login />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
