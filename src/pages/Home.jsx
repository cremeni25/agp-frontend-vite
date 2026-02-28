// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        <div className="home-header">
          <div className="logo-agp">AGP</div>
          <div className="subtitle">SPORTS INTELLIGENCE PLATFORM</div>
        </div>

        <div className="home-content">
          <div className="hero">
            Transformando dados em decisões esportivas
          </div>

          <div className="description">
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
