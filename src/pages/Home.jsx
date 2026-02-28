// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* BLOCO SUPERIOR — LOGO + SUBTÍTULO */}
        <div
          className="brand-block"
          style={{ transform: "translateX(-520px)" }}
        >
          <img
            src="/agp-logo.jpg"
            alt="AGP"
            className="logo-agp-img"
          />

          <div
            className="logo-subtitle"
            style={{ transform: "translateY(-82px)" }}
          >
            Sports Intelligence Platform
          </div>
        </div>

        {/* BLOCO INFERIOR — TEXTO + CTA */}
        <div className="content-block">
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
