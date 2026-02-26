import "../styles/home.css";

export default function Home({ onEnter }) {
  return (
    <div className="home-container">
      <img
        src="/home-agp.jpg"
        alt="AGP Sports Intelligence Platform"
        className="home-background"
      />

      <div className="home-overlay">
        <h1 className="home-title">AGP</h1>
        <h2 className="home-subtitle">SPORTS INTELLIGENCE PLATFORM</h2>

        <p className="home-slogan">
          Transformando dados em decisões esportivas
        </p>

        <p className="home-description">
          Uma plataforma inteligente para atletas, técnicos, clubes e gestão estratégica.
        </p>

        <button className="home-button" onClick={onEnter}>
          Entrar no sistema
        </button>
      </div>
    </div>
  );
}
