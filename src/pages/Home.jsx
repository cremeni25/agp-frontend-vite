import "../styles/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      {/* Background neutro (arte entra depois) */}
      <div className="home-background" />

      {/* Overlay para contraste */}
      <div className="home-overlay" />

      {/* Conteúdo */}
      <div className="home-content">
        <h1 className="home-title">AGP</h1>
        <h2 className="home-subtitle">Sports Intelligence Platform</h2>

        <p className="home-description">
          Transformando dados em decisões esportivas
        </p>

        <button
          className="home-button"
          onClick={() => (window.location.href = "/login")}
        >
          Entrar no sistema
        </button>
      </div>
    </div>
  );
}
