// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* TOPO INSTITUCIONAL */}
        <div className="home-header">
          <div className="logo-agp">AGP</div>
          <div className="logo-subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>
        </div>

        {/* ESPAÇO DA SILHUETA */}
        <div className="silhouette-spacer" />

        {/* MENSAGEM + CTA */}
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
