import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">

        {/* LOGO – ALINHADO À CABEÇA DA SILHUETA */}
        <header className="home-header">
          <div className="logo-agp">AGP</div>
          <div className="logo-subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>
        </header>

        {/* TEXTO – ALINHADO AOS PÉS DA SILHUETA */}
        <section className="home-hero">
          <h1 className="hero-title">
            Transformando dados em decisões esportivas
          </h1>

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
