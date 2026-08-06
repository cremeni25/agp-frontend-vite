import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectEligibility } from "../services/eligibilityManagement";
import "../styles/dashboard-master.css";

export default function MasterAthletes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const initialParticipants = await supabase
        .from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,status_onboarding,ativo,tecnico_responsavel_pessoa_id")
        .eq("funcao_no_projeto", "atleta")
        .order("created_at", { ascending: false });
      if (initialParticipants.error) throw initialParticipants.error;

      const projectIds = [...new Set((initialParticipants.data || []).map((item) => item.projeto_id).filter(Boolean))];
      await Promise.all(projectIds.map((projectId) => listProjectEligibility(projectId)));

      const [participantsResult, peopleResult, projectsResult, institutionsResult, profilesResult] = await Promise.all([
        supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,status_onboarding,ativo,tecnico_responsavel_pessoa_id").eq("funcao_no_projeto", "atleta").order("created_at", { ascending: false }),
        supabase.from("agp_pessoas").select("id,nome,email_contato,telefone_contato,data_nascimento,status"),
        supabase.from("agp_projetos_validacao").select("id,nome,instituicao_id,status"),
        supabase.from("agp_instituicoes").select("id,nome,status"),
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,prova_posicao,categoria,nivel,status")
      ]);
      const firstError = participantsResult.error || peopleResult.error || projectsResult.error || institutionsResult.error || profilesResult.error;
      if (firstError) throw firstError;

      const people = Object.fromEntries((peopleResult.data || []).map((item) => [item.id, item]));
      const projects = Object.fromEntries((projectsResult.data || []).map((item) => [item.id, item]));
      const institutions = Object.fromEntries((institutionsResult.data || []).map((item) => [item.id, item]));
      const profiles = Object.fromEntries((profilesResult.data || []).filter((item) => item.status === "ativo").map((item) => [item.pessoa_id, item]));

      setRows((participantsResult.data || []).map((participant) => {
        const person = people[participant.pessoa_id] || {};
        const project = projects[participant.projeto_id] || {};
        const institution = institutions[project.instituicao_id] || {};
        const profile = profiles[participant.pessoa_id] || {};
        return { ...participant, person, project, institution, profile };
      }));
    } catch (requestError) {
      setError(`Falha ao consultar atletas: ${requestError.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((item) => [item.person.nome, item.person.email_contato, item.project.nome, item.institution.nome, item.profile.modalidade, item.profile.categoria].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [rows, search]);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Operação</span><h1>Atletas</h1><p>Consulta global dos participantes canônicos ativos e seus vínculos institucionais.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button><button className="master-button" onClick={load}>Atualizar</button></div></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-panel"><input className="master-input" placeholder="Buscar por atleta, instituição, projeto, modalidade ou categoria" value={search} onChange={(event) => setSearch(event.target.value)} /></section>
    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Base canônica</span><h2>Atletas cadastrados</h2></div><strong>{filtered.length}</strong></div>
      {loading ? <div className="master-empty">Carregando atletas...</div> : filtered.length === 0 ? <div className="master-empty">Nenhum atleta encontrado.</div> : <ul className="master-activity-list">{filtered.map((item) => <li key={item.id}><div><strong>{item.person.nome || "Nome não informado"}</strong><span>{item.institution.nome || "Instituição não identificada"} · {item.project.nome || "Projeto não identificado"}</span><small>{item.profile.modalidade || "Modalidade não informada"}{item.profile.prova_posicao ? ` · ${item.profile.prova_posicao}` : ""}{item.profile.categoria ? ` · ${item.profile.categoria}` : ""} · {item.ativo ? "Ativo" : "Inativo"}</small></div><div className="master-row-actions"><b>{item.status_onboarding || "rascunho"}</b><button className="master-button secondary" onClick={() => navigate(`/master/participantes?instituicao=${item.project.instituicao_id || ""}&projeto=${item.projeto_id}&participante=${item.id}`)}>Abrir cadastro</button></div></li>)}</ul>}
    </section>
  </div></main>;
}
