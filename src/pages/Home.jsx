import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* BLOCO LOGO */}
        <header className="home-header">
          <h1 className="logo-agp">AGP</h1>
          <div className="logo-subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>
        </header>

        {/* SILHUETA CENTRAL (ESPAÇO VISUAL) */}
        <div className="silhouette-spacer" />

        {/* BLOCO INSTITUCIONAL */}
        <section className="home-hero">
          <h2 className="hero-title">
            Transformando dados em decisões esportivas
          </h2>

          <p className="hero-description">
            Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
          </p>

          <button
            className="cta"
            onClick={() => navigate("/login")}
          >
            Entrar no sistema
          </button>
        </section>

      </div>
    </div>
  );
}
