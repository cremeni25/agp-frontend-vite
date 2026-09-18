import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";

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
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,prova_posicao,categoria,nivel,status,status_federativo")
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
    } catch (e) {
      setError(`Falha ao carregar atletas: ${e.message}`);
      setRows([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (technicianId && String(item.tecnico_responsavel_pessoa_id || "") !== String(technicianId)) return false;
      if (!term) return true;
      return [item.person.nome, item.profile.modalidade, item.profile.categoria, item.project.nome, item.institution.nome]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, search, technicianId]);

  function statusLabel(item){
    const raw=String(item.status_onboarding||"").replaceAll("_"," ");
    return raw || "acompanhamento ativo";
  }

  return <SwimmingShell
    eyebrow="Governança · Atletas"
    title={technicianId ? `Atletas de ${technicianName || "este profissional"}` : "Atletas"}
    subtitle="Consulte os atletas reais vinculados ao AGP Swim e acesse o acompanhamento longitudinal sem sair da experiência visual do produto."
    actions={[
      {label:"Voltar",onClick:()=>navigate(technicianId?"/master/comissoes-tecnicas":"/dashboard-master")},
      {label:"Atualizar",onClick:load}
    ]}
  >
    {error&&<div className="swim-notice">{error}</div>}

    <section className="swim-panel">
      <div className="swim-panel-head">
        <div><span className="swim-panel-label">Busca</span><h2>Encontrar atleta</h2></div>
        <span className="swim-pill">{filtered.length} atleta(s)</span>
      </div>
      <input className="training-select" style={{width:"100%"}} placeholder="Buscar por nome, modalidade, categoria, projeto ou instituição" value={search} onChange={(e)=>setSearch(e.target.value)} />
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Base esportiva</span>
      <h2>Atletas vinculados</h2>
      {loading?<div className="swim-empty">Carregando atletas...</div>:filtered.length===0?<div className="swim-empty">Nenhum atleta encontrado.</div>:
        <div className="swim-list">{filtered.map((item)=><article className="swim-row" key={item.id}>
          <div>
            <strong>{item.person.nome||"Atleta"}</strong>
            <span>{[
              item.profile.modalidade||"Natação",
              item.profile.categoria,
              item.institution.nome||item.project.nome
            ].filter(Boolean).join(" · ")}</span>
            <small>{statusLabel(item)}</small>
          </div>
          <div className="workflow-actions">
            {item.profile.status_federativo&&<span className="swim-pill">{String(item.profile.status_federativo).replaceAll("_"," ")}</span>}
            <button className="swim-primary" onClick={()=>navigate(`/master/atletas/${item.id}`)}>Abrir atleta</button>
          </div>
        </article>)}</div>}
    </section>
  </SwimmingShell>;
}
