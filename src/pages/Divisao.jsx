import { useNavigate } from "react-router-dom";
import "../styles/divisao.css";

const profiles = [
  { id: "atletas", code: "01", label: "Atletas", description: "Performance, evolução, rotina e histórico individual." },
  { id: "comissao", code: "02", label: "Comissão Técnica", description: "Acompanhamento técnico, avaliações e planejamento." },
  { id: "clubes", code: "03", label: "Clubes & Associações", description: "Gestão coletiva, indicadores e visão institucional." },
  { id: "master", code: "04", label: "Master", description: "Governança, usuários, parâmetros e operação da plataforma." }
];

export default function Divisao() {
  const navigate = useNavigate();

  return (
    <main className="agp-shell">
      <div className="agp-page">
        <header className="agp-topbar">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy">
              <strong>AGP</strong>
              <span>SPORTS INTELLIGENCE PLATFORM</span>
            </div>
          </div>
          <button className="agp-button agp-button-secondary" onClick={() => navigate("/")}>Voltar ao início</button>
        </header>

        <section className="division-intro">
          <span className="agp-eyebrow">Ambiente de acesso</span>
          <h1>Escolha sua área na plataforma.</h1>
          <p>Cada divisão possui permissões, dados e experiências específicas para sua atuação no ecossistema esportivo.</p>
        </section>

        <section className="division-grid">
          {profiles.map((profile) => (
            <article className="division-card agp-panel" key={profile.id} onClick={() => navigate(`/login/${profile.id}`)}>
              <div className="division-card-top">
                <span>{profile.code}</span>
                <span className="division-arrow">↗</span>
              </div>
              <div>
                <h2>{profile.label}</h2>
                <p>{profile.description}</p>
              </div>
              <button className="agp-button agp-button-primary">Acessar divisão</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
