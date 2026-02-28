// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">
        <h1 className="logo-agp">AGP</h1>

        <h2 className="subtitle">
          SPORTS INTELLIGENCE PLATFORM
        </h2>

        <p className="hero">
          Transformando dados em decisões esportivas
        </p>

        <p className="description">
          Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
        </p>

        <button
          className="cta"
          onClick={() => navigate("/login")}
        >
          Entrar no sistema
        </button>
      </div>
    </div>
  );
}
