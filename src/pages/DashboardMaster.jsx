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
  const [participants, setParticipants] = useState([]);
  const [technicalMembers, setTechnicalMembers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true); setError("");
    const [usersResult, participantsResult, technicalResult, institutionsResult, scoresResult] = await Promise.all([
      supabase.from("perfis_atletas").select("id,tipo_usuario,funcao"),
      supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,ativo"),
      supabase.from("agp_membros_instituicao").select("id,auth_id,ativo,papel"),
      supabase.from("agp_instituicoes").select("id,status"),
      supabase.from("score_atleta").select("*").order("data_calculo", { ascending: false }).limit(8)
    ]);
    const firstError = usersResult.error || participantsResult.error || technicalResult.error || institutionsResult.error || scoresResult.error;
    if (firstError) setError(`Falha ao carregar o painel: ${firstError.message}`);
    setUsers(usersResult.data || []);
    setParticipants(participantsResult.data || []);
    setTechnicalMembers(technicalResult.data || []);
    setInstitutions(institutionsResult.data || []);
    setScores(scoresResult.data || []);
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  const summary = useMemo(() => {
    const legacyCounts = { indefinido: 0 };
    users.forEach((user) => { if (resolveType(user) === "não definido") legacyCounts.indefinido += 1; });
    return {
      total: users.length,
      atleta: new Set(participants.filter((item) => item.ativo && item.funcao_no_projeto === "atleta").map((item) => item.pessoa_id).filter(Boolean)).size,
      comissao: new Set(technicalMembers.filter((item) => item.ativo).map((item) => item.auth_id || item.id).filter(Boolean)).size,
      clube: institutions.filter((item) => item.status === "ativo").length,
      indefinido: legacyCounts.indefinido
    };
  }, [users, participants, technicalMembers, institutions]);

  async function signOut() { await supabase.auth.signOut(); navigate("/login", { replace: true }); }

  const metric = (label, value, help, path) => <button type="button" className="card master-metric" onClick={() => navigate(path)}><span>{label}</span><strong>{loading ? "…" : value}</strong><small>{help}</small></button>;

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">AGP Sports Intelligence</span><h1>Centro de comando Master</h1><p>Governança global, homologação e acompanhamento da evolução analítica.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={loadDashboard}>Atualizar dados</button><button className="master-button danger" onClick={signOut}>Sair</button></div></header>
    {error && <div className="master-error" role="alert">{error}</div>}

    <section className="dashboard-section grid master-summary-grid">
      {metric("Usuários cadastrados", summary.total, "Consultar contas e perfis de acesso", "/master/usuarios")}
      {metric("Atletas", summary.atleta, "Consultar atletas canônicos ativos", "/master/atletas")}
      {metric("Comissões técnicas", summary.comissao, "Consultar profissionais institucionais ativos", "/master/comissoes-tecnicas")}
      {metric("Clubes e associações", summary.clube, "Consultar instituições ativas", "/master/instituicoes")}
    </section>

    <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Administração</span><h2>Núcleo Administrativo</h2></div></div><div className="master-action-grid"><button className="master-action-card" onClick={() => navigate("/dashboard-master/administracao")}><strong>Administração</strong><span>Instituições, projetos, clubes, equipe técnica, usuários, perfis e configurações.</span></button></div></section>

    <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Operação</span><h2>Participantes e evidências</h2></div></div><div className="master-action-grid">
      <button className="master-action-card" onClick={() => navigate("/master/participantes")}><strong>Participantes</strong><span>Cadastrar identidades, papéis, acessos, vínculos e pendências de onboarding.</span></button>
      <button className="master-action-card" disabled><strong>Consentimentos</strong><span>Gestão operacional integrada à Central de Participantes.</span></button>
      <button className="master-action-card" disabled><strong>Linha de Base</strong><span>Gestão operacional integrada à Central de Participantes.</span></button>
      <button className="master-action-card" onClick={() => navigate("/master/coletas")}><strong>Coletas</strong><span>Aplicar instrumentos, salvar respostas, validar completude e consultar versões.</span></button>
    </div></section>

    <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Inteligência</span><h2>Ciência, análise e validação</h2></div></div><div className="master-action-grid">
      <button className="master-action-card" onClick={() => navigate("/master/catalogo-cientifico")}><strong>Catálogo Científico</strong><span>Cadastrar, aprovar, versionar e ativar protocolos e instrumentos por projeto.</span></button>
      <button className="master-action-card" disabled><strong>Protocolos</strong><span>Administração integrada ao Catálogo Científico.</span></button>
      <button className="master-action-card" onClick={() => navigate("/master/pipeline-analitico")}><strong>Pipeline Analítico</strong><span>Executar o motor versionado e consultar a rastreabilidade.</span></button>
      <button className="master-action-card" onClick={() => navigate("/master/validacao-profissional")}><strong>Validação Profissional</strong><span>Aprovar, rejeitar ou substituir resultados e emitir parecer.</span></button>
    </div></section>

    <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Governança</span><h2>Controle e rastreabilidade</h2></div></div><div className="master-action-grid">
      <button className="master-action-card" onClick={() => navigate("/master/homologacao")}><strong>Homologação</strong><span>Acompanhar o ambiente interno e os pilotos técnicos independentes.</span></button>
      <button className="master-action-card" disabled><strong>Auditoria</strong><span>Registro consolidado de operações e mudanças.</span></button>
      <button className="master-action-card" disabled><strong>Logs</strong><span>Eventos técnicos e operacionais da plataforma.</span></button>
    </div></section>

    <section className="master-content-grid">
      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Qualidade cadastral</span><h2>Perfis que exigem atenção</h2></div><strong>{summary.indefinido}</strong></div><p>Registros sem tipo reconhecido devem ser regularizados no Núcleo Administrativo.</p><button className="master-link-button" onClick={() => navigate("/master/perfis")}>Regularizar perfis</button></article>
      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Motor analítico legado</span><h2>Scores armazenados</h2></div><strong>{scores.length}</strong></div>{scores.length === 0 ? <p>Nenhum score disponível na base para exibição.</p> : <ul className="master-activity-list">{scores.slice(0, 5).map((score, index) => <li key={score.id || `${score.atleta_id}-${index}`}><div><strong>Atleta {score.atleta_id || "não identificado"}</strong><span>{score.nivel_classificacao || "Classificação pendente"}</span></div><b>{score.score_global ?? "—"}</b></li>)}</ul>}</article>
    </section>
  </div></main>;
}
