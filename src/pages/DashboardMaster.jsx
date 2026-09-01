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
            <p>Execute o trabalho do atleta do início ao resultado. Administração e governança ficam separadas da rotina operacional.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={loadDashboard}>Atualizar</button>
            <button className="master-button danger" onClick={signOut}>Sair</button>
          </div>
        </header>

        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="dashboard-section">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Fluxo principal</span>
              <h2>Jornada operacional do atleta</h2>
            </div>
          </div>

          <div className="master-action-grid">
            <button className="master-action-card" onClick={() => navigate("/master/atletas")}>
              <strong>1. Preparar atleta</strong>
              <span>Abra a ficha, confira técnico, consentimento, linha de base e elegibilidade. Continue sempre a partir do atleta.</span>
            </button>

            <button className="master-action-card" onClick={() => navigate("/master/coletas")}>
              <strong>2. Coletar</strong>
              <span>Aplique os instrumentos liberados para o atleta e registre as evidências da coleta.</span>
            </button>

            <button className="master-action-card" onClick={() => navigate("/master/pipeline-analitico")}>
              <strong>3. Analisar</strong>
              <span>Execute o processamento analítico somente sobre coletas completas e rastreáveis.</span>
            </button>

            <button className="master-action-card" onClick={() => navigate("/master/validacao-profissional")}>
              <strong>4. Validar resultado</strong>
              <span>Revise, aprove ou rejeite resultados antes de disponibilizá-los para uso esportivo.</span>
            </button>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Situação atual</span>
              <h2>Base operacional</h2>
            </div>
          </div>

          <div className="dashboard-section grid master-summary-grid">
            <button type="button" className="card master-metric" onClick={() => navigate("/master/atletas")}>
              <span>Atletas ativos</span>
              <strong>{loading ? "…" : summary.athletes}</strong>
              <small>Abrir atletas e continuar operações</small>
            </button>
            <button type="button" className="card master-metric" onClick={() => navigate("/master/comissoes-tecnicas")}>
              <span>Profissionais técnicos</span>
              <strong>{loading ? "…" : summary.technicians}</strong>
              <small>Consultar técnicos e seus atletas</small>
            </button>
            <button type="button" className="card master-metric" onClick={() => navigate("/master/instituicoes")}>
              <span>Instituições ativas</span>
              <strong>{loading ? "…" : summary.institutions}</strong>
              <small>Consultar clubes e organizações</small>
            </button>
            <button type="button" className="card master-metric" onClick={() => navigate("/master/atletas")}>
              <span>Atletas com atenção</span>
              <strong>{loading ? "…" : summary.attention}</strong>
              <small>Revisar pendências antes da coleta</small>
            </button>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Apoio operacional</span>
              <h2>Ciência e gestão da base</h2>
            </div>
          </div>

          <div className="master-action-grid">
            <button className="master-action-card" onClick={() => navigate("/master/catalogo-cientifico")}>
              <strong>Instrumentos e protocolos</strong>
              <span>Gerencie o catálogo científico que libera as coletas dos atletas.</span>
            </button>
            <button className="master-action-card" onClick={() => navigate("/master/participantes")}>
              <strong>Participantes</strong>
              <span>Cadastre novos participantes ou faça manutenção da base quando necessário.</span>
            </button>
            <button className="master-action-card" onClick={() => navigate("/dashboard-master/administracao")}>
              <strong>Administração</strong>
              <span>Instituições, projetos, equipe técnica, usuários, perfis e configurações.</span>
            </button>
            <button className="master-action-card" onClick={() => navigate("/master/homologacao")}>
              <strong>Governança e homologação</strong>
              <span>Acompanhe testes, pilotos e rastreabilidade sem misturar isso com a rotina diária.</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
