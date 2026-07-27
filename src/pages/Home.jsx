import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="agp-shell">
      <div className="agp-page">
        <header className="agp-topbar">
          <div className="agp-brand" aria-label="AGP Sports Intelligence Platform">
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
        </header>

        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="agp-eyebrow">Inteligência integrada para o desenvolvimento esportivo</span>
            <h1 className="agp-title">Decisões coordenadas para formar <span>atletas de alto rendimento.</span></h1>
            <p className="agp-lead">
              O AGP conecta atletas, comissão técnica, profissionais da saúde, clubes, associações e gestão em uma única plataforma, integrando histórico, avaliações, acompanhamento e contexto para orientar cada etapa do desenvolvimento esportivo.
            </p>
            <div className="agp-actions">
              <button className="agp-button agp-button-primary" onClick={() => navigate("/login")}>Entrar na plataforma</button>
            </div>
          </div>

          <div className="home-intelligence agp-panel" aria-label="Visão integrada de performance">
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <div className="home-core"><small>AGP CORE</small><strong>360°</strong><span>Performance integrada</span></div>
            <div className="home-signal home-signal-a">Atleta</div>
            <div className="home-signal home-signal-b">Comissão</div>
            <div className="home-signal home-signal-c">Saúde</div>
            <div className="home-signal home-signal-d">Gestão</div>
          </div>
        </section>

        <section className="home-metrics">
          <article><strong>01</strong><span>Login único e seguro</span></article>
          <article><strong>04</strong><span>Perfis integrados por função</span></article>
          <article><strong>360°</strong><span>Leitura multidimensional</span></article>
        </section>
      </div>
    </main>
  );
}
