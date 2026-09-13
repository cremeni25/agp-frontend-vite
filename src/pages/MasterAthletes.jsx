import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

export default function MasterAthletes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const technicianId = params.get("tecnico") || "";
  const technicianName = params.get("tecnico_nome") || "";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [participantsResult, peopleResult, projectsResult, institutionsResult, profilesResult] = await Promise.all([
        supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,status_onboarding,ativo,tecnico_responsavel_pessoa_id").eq("funcao_no_projeto", "atleta").eq("ativo", true).order("created_at", { ascending: false }),
        supabase.from("agp_pessoas").select("id,nome"),
        supabase.from("agp_projetos_validacao").select("id,nome,instituicao_id"),
        supabase.from("agp_instituicoes").select("id,nome"),
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,prova_posicao,categoria,nivel,status")
      ]);
      const firstError = participantsResult.error || peopleResult.error || projectsResult.error || institutionsResult.error || profilesResult.error;
      if (firstError) throw firstError;
      const people = Object.fromEntries((peopleResult.data || []).map((x) => [x.id, x]));
      const projects = Object.fromEntries((projectsResult.data || []).map((x) => [x.id, x]));
      const institutions = Object.fromEntries((institutionsResult.data || []).map((x) => [x.id, x]));
      const profiles = Object.fromEntries((profilesResult.data || []).filter((x) => x.status === "ativo").map((x) => [x.pessoa_id, x]));
      setRows((participantsResult.data || []).map((p) => {
        const project = projects[p.projeto_id] || {};
        return { ...p, person: people[p.pessoa_id] || {}, project, institution: institutions[project.instituicao_id] || {}, profile: profiles[p.pessoa_id] || {} };
      }));
    } catch (e) { setError(`Falha ao carregar atletas: ${e.message}`); setRows([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (technicianId && String(item.tecnico_responsavel_pessoa_id || "") !== String(technicianId)) return false;
      if (!term) return true;
      return [item.person.nome, item.profile.modalidade, item.profile.categoria, item.project.nome, item.institution.nome].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, search, technicianId]);

  function actionLabel(item) {
    const status = String(item.status_onboarding || "").toLowerCase();
    return ["apto", "concluido", "ativo", "apto_para_coleta"].includes(status) ? "Continuar" : "Concluir preparação";
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header">
      <div><span className="master-eyebrow">Atletas</span><h1>{technicianId ? `Atletas de ${technicianName || "este profissional"}` : "Quem precisa de atenção?"}</h1><p>Escolha o atleta. O AGP indica a próxima ação dentro do acompanhamento.</p></div>
      <button className="master-button secondary" onClick={() => navigate(technicianId ? "/master/comissoes-tecnicas" : "/dashboard-master")}>Voltar</button>
    </header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-panel"><input className="master-input" placeholder="Buscar atleta" value={search} onChange={(e) => setSearch(e.target.value)} /></section>
    <section className="master-panel">
      {loading ? <div className="master-empty">Carregando...</div> : filtered.length === 0 ? <div className="master-empty">Nenhum atleta encontrado.</div> : <ul className="master-activity-list">{filtered.map((item) => <li key={item.id}><div><strong>{item.person.nome || "Atleta"}</strong><span>{item.profile.modalidade || "Modalidade não informada"}{item.profile.categoria ? ` · ${item.profile.categoria}` : ""}</span><small>{item.institution.nome || item.project.nome || "Vínculo ativo"}</small></div><button className="master-button" onClick={() => navigate(`/master/atletas/${item.id}`)}>{actionLabel(item)}</button></li>)}</ul>}
    </section>
  </div></main>;
}
