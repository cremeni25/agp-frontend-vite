import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { normalizeUserType } from "../config/accessProfiles";
import "../styles/dashboard-master.css";

function resolveType(user) {
  return normalizeUserType(user.tipo_usuario || user.funcao) || "não definido";
}

export default function DashboardMaster() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    const [usersResult, scoresResult] = await Promise.all([
      supabase.from("perfis_atletas").select("*"),
      supabase.from("score_atleta").select("*").order("data_calculo", { ascending: false }).limit(8)
    ]);
    if (usersResult.error) setError(`Falha ao carregar usuários: ${usersResult.error.message}`);
    setUsers(usersResult.data || []);
    setScores(scoresResult.data || []);
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  const summary = useMemo(() => {
    const counts = { master: 0, atleta: 0, comissao: 0, clube: 0, indefinido: 0 };
    users.forEach((user) => {
      const type = resolveType(user);
      if (type === "não definido") counts.indefinido += 1;
      else if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1;
    });
    return { total: users.length, ...counts };
  }, [users]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">AGP Sports Intelligence</span>
            <h1>Centro de comando Master</h1>
            <p>Governança global, homologação e acompanhamento da evolução analítica.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={loadDashboard}>Atualizar dados</button>
            <button className="master-button danger" onClick={signOut}>Sair</button>
          </div>
        </header>

        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="dashboard-section grid master-summary-grid">
          <article className="card master-metric"><span>Usuários cadastrados</span><strong>{loading ? "…" : summary.total}</strong><small>Base institucional visível</small></article>
          <article className="card master-metric"><span>Atletas</span><strong>{loading ? "…" : summary.atleta}</strong><small>Perfis esportivos</small></article>
          <article className="card master-metric"><span>Comissões técnicas</span><strong>{loading ? "…" : summary.comissao}</strong><small>Perfis de acompanhamento</small></article>
          <article className="card master-metric"><span>Clubes e associações</span><strong>{loading ? "…" : summary.clube}</strong><small>Perfis institucionais</small></article>
        </section>

        <section className="dashboard-section">
          <div className="master-section-heading"><div><span className="master-eyebrow">Validação</span><h2>Homologação operacional</h2></div></div>
          <button className="master-action-card" onClick={() => navigate("/master/homologacao")}>
            <strong>Centro de homologação AGP</strong>
            <span>Inicializar e acompanhar o ambiente interno e os dois pilotos técnicos independentes.</span>
          </button>
        </section>

        <section className="dashboard-section">
          <div className="master-section-heading"><div><span className="master-eyebrow">Governança</span><h2>Administração global</h2></div></div>
          <div className="master-action-grid two-columns">
            <button className="master-action-card" onClick={() => navigate("/master/usuarios")}>
              <strong>Gestão de usuários</strong>
              <span>Consultar registros, vínculos, status e dados cadastrais.</span>
            </button>
            <button className="master-action-card" onClick={() => navigate("/master/perfis")}>
              <strong>Perfis e permissões</strong>
              <span>Auditar e corrigir papéis globais da plataforma.</span>
            </button>
          </div>
        </section>

        <section className="master-content-grid">
          <article className="master-panel">
            <div className="master-section-heading"><div><span className="master-eyebrow">Qualidade cadastral</span><h2>Perfis que exigem atenção</h2></div><strong>{summary.indefinido}</strong></div>
            <p>Registros sem tipo reconhecido devem ser regularizados na área específica de perfis e permissões.</p>
            <button className="master-link-button" onClick={() => navigate("/master/perfis")}>Regularizar perfis</button>
          </article>

          <article className="master-panel">
            <div className="master-section-heading"><div><span className="master-eyebrow">Motor analítico</span><h2>Scores recentes</h2></div><strong>{scores.length}</strong></div>
            {scores.length === 0 ? <p>Nenhum score disponível na base para exibição.</p> : (
              <ul className="master-activity-list">
                {scores.slice(0, 5).map((score, index) => (
                  <li key={score.id || `${score.atleta_id}-${index}`}><div><strong>Atleta {score.atleta_id || "não identificado"}</strong><span>{score.nivel_classificacao || "Classificação pendente"}</span></div><b>{score.score_global ?? "—"}</b></li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
