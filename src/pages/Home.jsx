import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="agp-shell">
      <div className="agp-page">
        <header className="agp-topbar">
          <div className="agp-brand">
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy">
              <strong>AGP</strong>
              <span>SPORTS INTELLIGENCE PLATFORM</span>
            </div>
          </div>
        </header>

        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="agp-eyebrow">Inteligência aplicada ao desenvolvimento esportivo</span>
            <h1 className="agp-title">
              Da base ao alto rendimento: <span>dados que orientam evolução.</span>
            </h1>
            <p className="agp-lead">
              O AGP valida o histórico físico, fisiológico, técnico, mental, de recuperação e contexto para acompanhar a formação do atleta ao longo do tempo e apoiar decisões responsáveis de desenvolvimento.
            </p>
            <div className="agp-actions">
              <button className="agp-button agp-button-primary" onClick={() => navigate("/divisao")}>Entrar no sistema</button>
              <button className="agp-button agp-button-secondary" onClick={() => navigate("/register")}>Criar acesso</button>
            </div>
          </div>

          <div className="home-intelligence agp-panel" aria-label="Visão da plataforma">
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <div className="home-core">
              <small>AGP CORE</small>
              <strong>360°</strong>
              <span>Performance integrada</span>
            </div>
            <div className="home-signal home-signal-a">Físico</div>
            <div className="home-signal home-signal-b">Técnico</div>
            <div className="home-signal home-signal-c">Mental</div>
            <div className="home-signal home-signal-d">Contexto</div>
          </div>
        </section>

        <section className="home-metrics">
          <article><strong>01</strong><span>Visão individual do atleta</span></article>
          <article><strong>03</strong><span>Áreas públicas de acesso</span></article>
          <article><strong>360°</strong><span>Leitura multidimensional</span></article>
        </section>
      </div>
    </main>
  );
}