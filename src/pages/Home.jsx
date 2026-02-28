// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import agpLogo from "/agp-logo.jpg"; // ajuste o nome se necessário

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* LOGO INSTITUCIONAL */}
        <div className="home-header">
          <img
            src={agpLogo}
            alt="AGP"
            className="logo-agp-img"
          />
          <div className="logo-subtitle">
            Sports Intelligence Platform
          </div>
        </div>

        {/* ESPAÇO VISUAL DA SILHUETA */}
        <div className="silhouette-spacer" />

        {/* TEXTO PRINCIPAL + CTA */}
        <div className="home-hero">
          <div className="hero-title">
            Transformando dados em decisões esportivas
          </div>

          <div className="hero-description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </div>

          <button
            className="cta"
            onClick={() => navigate("/login")}
          >
            Entrar no sistema
          </button>
        </div>

      </div>
    </div>
  );
}
