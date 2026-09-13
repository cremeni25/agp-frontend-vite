import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

export default function DashboardMaster() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [technicalMembers, setTechnicalMembers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [participantsResult, technicalResult, institutionsResult] = await Promise.all([
      supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,status_onboarding,ativo"),
      supabase.from("agp_membros_instituicao").select("id,auth_id,ativo,papel"),
      supabase.from("agp_instituicoes").select("id,status")
    ]);

    const firstError = participantsResult.error || technicalResult.error || institutionsResult.error;
    if (firstError) setError(`Falha ao carregar o painel: ${firstError.message}`);

    setParticipants(participantsResult.data || []);
    setTechnicalMembers(technicalResult.data || []);
    setInstitutions(institutionsResult.data || []);
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  const summary = useMemo(() => ({
    athletes: new Set(
      participants
        .filter((item) => item.ativo && item.funcao_no_projeto === "atleta")
        .map((item) => item.pessoa_id)
        .filter(Boolean)
    ).size,
    technicians: new Set(
      technicalMembers
        .filter((item) => item.ativo)
        .map((item) => item.auth_id || item.id)
        .filter(Boolean)
    ).size,
    institutions: institutions.filter((item) => item.status === "ativo").length,
    attention: participants.filter(
      (item) => item.ativo && item.funcao_no_projeto === "atleta" && !["ativo", "apto_para_coleta"].includes(item.status_onboarding)
    ).length
  }), [participants, technicalMembers, institutions]);

  const nextAction = useMemo(() => {
    if (loading) {
      return {
        eyebrow: "Agora",
        title: "Carregando sua próxima ação",
        description: "O AGP está verificando a situação operacional da base.",
        label: "Aguarde",
        disabled: true,
        path: null
      };
    }

    if (summary.attention > 0) {
      return {
        eyebrow: "Agora",
        title: `${summary.attention} atleta${summary.attention > 1 ? "s" : ""} exige${summary.attention > 1 ? "m" : ""} atenção`,
        description: "Resolva primeiro as pendências que impedem ou fragilizam a operação do atleta.",
        label: "Resolver agora",
        disabled: false,
        path: "/master/atletas"
      };
    }

    if (summary.athletes === 0) {
      return {
        eyebrow: "Agora",
        title: "Cadastre o primeiro atleta",
        description: "A operação do AGP começa pela pessoa e pelo vínculo correto ao projeto.",
        label: "Cadastrar atleta",
        disabled: false,
        path: "/master/participantes"
      };
    }

    return {
      eyebrow: "Agora",
      title: "Continuar a operação dos atletas",
      description: "A base está preparada. Entre pelo atleta e siga somente a próxima ação indicada pelo sistema.",
      label: "Abrir atletas",
      disabled: false,
      path: "/master/atletas"
    };
  }, [loading, summary]);

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
            <h1>Centro operacional</h1>
            <p>O sistema mostra primeiro o que precisa da sua atenção. As demais funções ficam disponíveis sem competir com a operação principal.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={loadDashboard}>Atualizar</button>
            <button className="master-button danger" onClick={signOut}>Sair</button>
          </div>
        </header>

        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="master-now-card">
          <span className="master-eyebrow">{nextAction.eyebrow}</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.description}</p>
          <button
            className="master-button master-primary-action"
            disabled={nextAction.disabled}
            onClick={() => nextAction.path && navigate(nextAction.path)}
          >
            {nextAction.label}
          </button>
        </section>

        <section className="dashboard-section">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Situação atual</span>
              <h2>Base operacional</h2>
            </div>
          </div>

          <div className="dashboard-section grid master-summary-grid">
            <div className="card master-metric">
              <span>Atletas ativos</span>
              <strong>{loading ? "…" : summary.athletes}</strong>
            </div>
            <div className="card master-metric">
              <span>Profissionais técnicos</span>
              <strong>{loading ? "…" : summary.technicians}</strong>
            </div>
            <div className="card master-metric">
              <span>Instituições ativas</span>
              <strong>{loading ? "…" : summary.institutions}</strong>
            </div>
            <div className="card master-metric">
              <span>Exigem atenção</span>
              <strong>{loading ? "…" : summary.attention}</strong>
            </div>
          </div>
        </section>

        <details className="master-secondary-area">
          <summary>Outras funções</summary>

          <section className="dashboard-section">
            <div className="master-action-grid">
              <button className="master-action-card" onClick={() => navigate("/master/coletas")}>
                <strong>Coletas</strong>
                <span>Consultar e operar evidências já liberadas.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/master/pipeline-analitico")}>
                <strong>Análise</strong>
                <span>Processar somente coletas completas e rastreáveis.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/master/validacao-profissional")}>
                <strong>Validação profissional</strong>
                <span>Revisar resultados antes de qualquer uso esportivo.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/master/catalogo-cientifico")}>
                <strong>Instrumentos e protocolos</strong>
                <span>Gerenciar o catálogo científico do AGP.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/master/participantes")}>
                <strong>Participantes</strong>
                <span>Cadastrar e manter participantes da base.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/dashboard-master/administracao")}>
                <strong>Administração</strong>
                <span>Instituições, projetos, equipe, usuários e perfis.</span>
              </button>

              <button className="master-action-card" onClick={() => navigate("/master/homologacao")}>
                <strong>Governança e homologação</strong>
                <span>Testes, pilotos, rastreabilidade e controle operacional.</span>
              </button>
            </div>
          </section>
        </details>
      </div>
    </main>
  );
}
