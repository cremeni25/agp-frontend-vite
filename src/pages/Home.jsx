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
          <button className="agp-button agp-button-secondary" onClick={() => navigate("/divisao")}>
            Acessar plataforma
          </button>
        </header>

        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="agp-eyebrow">Inteligência aplicada ao desempenho</span>
            <h1 className="agp-title">
              Dados esportivos que se transformam em <span>decisões melhores.</span>
            </h1>
            <p className="agp-lead">
              Uma plataforma integrada para atletas, comissão técnica, clubes e gestores acompanharem evolução, contexto e performance em uma única visão.
            </p>
            <div className="agp-actions">
              <button className="agp-button agp-button-primary" onClick={() => navigate("/divisao")}>
                Entrar no sistema
              </button>
              <button className="agp-button agp-button-secondary" onClick={() => navigate("/register")}>
                Criar acesso
              </button>
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
          <article><strong>04</strong><span>Perfis de acesso integrados</span></article>
          <article><strong>360°</strong><span>Leitura multidimensional</span></article>
        </section>
      </div>
    </main>
  );
}
