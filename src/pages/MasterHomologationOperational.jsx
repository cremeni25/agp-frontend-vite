import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const DEFINITIONS = [
  { slug: "agp-homologacao-master", nome: "AGP Homologação Master", localidade: "Ambiente interno", projeto: "Homologação integral dos módulos", objetivo: "Validar o fluxo completo do AGP antes da liberação aos avaliadores.", status: "homologacao" },
  { slug: "agp-piloto-tecnico-a", nome: "Piloto Técnico A", localidade: "Localidade a definir", projeto: "Avaliação independente A", objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico A.", status: "preparacao" },
  { slug: "agp-piloto-tecnico-b", nome: "Piloto Técnico B", localidade: "Localidade a definir", projeto: "Avaliação independente B", objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico B.", status: "preparacao" }
];

const MODULES = ["Estrutura institucional", "Técnicos e permissões", "Cadastro e vínculo de atletas", "Avaliação multidimensional inicial", "Registro diário e carga de treinamento", "Motor de score AGP", "Histórico longitudinal", "Tendências e intervenções", "Relatório individual", "Comparativo final dos pilotos"];

export default function MasterHomologationOperational() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(DEFINITIONS[0].slug);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [technician, setTechnician] = useState({ nome: "", email: "", auth_id: "", localidade: "", metodologia: "", diretrizes: "", data_inicio: "", data_fim: "" });
  const [athlete, setAthlete] = useState({ atleta_id: "", tecnico_responsavel_auth_id: "" });

  async function load() {
    setLoading(true);
    setError("");
    const [i, p, m, a] = await Promise.all([
      supabase.from("agp_instituicoes").select("*").order("created_at"),
      supabase.from("agp_projetos_validacao").select("*").order("created_at"),
      supabase.from("agp_membros_instituicao").select("*").order("created_at"),
      supabase.from("agp_atletas_projeto").select("*").order("created_at")
    ]);
    if (i.error) {
      setError("Estrutura de homologação indisponível no banco de dados.");
      setInstitutions([]); setProjects([]); setMembers([]); setAthletes([]);
    } else {
      setInstitutions(i.data || []); setProjects(p.data || []); setMembers(m.data || []); setAthletes(a.data || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const environments = useMemo(() => DEFINITIONS.map((definition) => {
    const institution = institutions.find((item) => item.slug === definition.slug);
    const project = projects.find((item) => item.instituicao_id === institution?.id);
    const environmentMembers = members.filter((item) => item.instituicao_id === institution?.id);
    const environmentAthletes = athletes.filter((item) => item.projeto_id === project?.id);
    return { ...definition, institution, project, members: environmentMembers, athletes: environmentAthletes };
  }), [institutions, projects, members, athletes]);

  const selected = environments.find((item) => item.slug === selectedSlug) || environments[0];

  async function initialize() {
    setWorking(true); setError(""); setMessage("");
    for (const definition of DEFINITIONS) {
      const { data: institution, error: institutionError } = await supabase.from("agp_instituicoes").upsert({ nome: definition.nome, slug: definition.slug, tipo: "homologacao", localidade: definition.localidade, status: "ativo" }, { onConflict: "slug" }).select("*").single();
      if (institutionError) { setError(institutionError.message); setWorking(false); return; }
      const { data: existing } = await supabase.from("agp_projetos_validacao").select("id").eq("instituicao_id", institution.id).maybeSingle();
      if (!existing) {
        const { error: projectError } = await supabase.from("agp_projetos_validacao").insert({ instituicao_id: institution.id, nome: definition.projeto, objetivo: definition.objetivo, localidade: definition.localidade, status: definition.status, versao_motor: "agp-core-v2" });
        if (projectError) { setError(projectError.message); setWorking(false); return; }
      }
    }
    setMessage("Ambientes de homologação inicializados."); await load(); setWorking(false);
  }

  async function saveTechnician(event) {
    event.preventDefault();
    if (!selected?.institution || !selected?.project) return;
    setWorking(true); setError(""); setMessage("");
    const { error: projectError } = await supabase.from("agp_projetos_validacao").update({ localidade: technician.localidade || selected.localidade, metodologia: technician.metodologia || null, diretrizes: technician.diretrizes || null, data_inicio: technician.data_inicio || null, data_fim: technician.data_fim || null }).eq("id", selected.project.id);
    if (projectError) { setError(projectError.message); setWorking(false); return; }
    if (technician.auth_id) {
      const { error: memberError } = await supabase.from("agp_membros_instituicao").upsert({ instituicao_id: selected.institution.id, auth_id: technician.auth_id, nome: technician.nome || null, email: technician.email || null, papel: "tecnico", acesso_total_tecnico: true, ativo: true, fim_acesso: technician.data_fim ? `${technician.data_fim}T23:59:59Z` : null }, { onConflict: "instituicao_id,auth_id" });
      if (memberError) { setError(memberError.message); setWorking(false); return; }
    }
    await supabase.from("agp_eventos_auditoria").insert({ instituicao_id: selected.institution.id, projeto_id: selected.project.id, evento: "configuracao_tecnico", entidade: "projeto_validacao", entidade_id: selected.project.id, detalhes: { nome: technician.nome, email: technician.email } });
    setMessage("Configuração do técnico e do projeto salva."); await load(); setWorking(false);
  }

  async function linkAthlete(event) {
    event.preventDefault();
    if (!selected?.project || !athlete.atleta_id) return;
    setWorking(true); setError(""); setMessage("");
    const { error: athleteError } = await supabase.from("agp_atletas_projeto").upsert({ projeto_id: selected.project.id, atleta_id: athlete.atleta_id, tecnico_responsavel_auth_id: athlete.tecnico_responsavel_auth_id || null, status: "ativo" }, { onConflict: "projeto_id,atleta_id" });
    if (athleteError) { setError(athleteError.message); setWorking(false); return; }
    await supabase.from("agp_eventos_auditoria").insert({ instituicao_id: selected.institution.id, projeto_id: selected.project.id, evento: "atleta_vinculado", entidade: "atleta", entidade_id: athlete.atleta_id });
    setAthlete({ atleta_id: "", tecnico_responsavel_auth_id: "" });
    setMessage("Atleta vinculado ao projeto de validação."); await load(); setWorking(false);
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Validação controlada</span><h1>Centro de homologação AGP</h1><p>Operação interna e dois pilotos técnicos independentes.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button><button className="master-button" disabled={working} onClick={initialize}>{working ? "Processando..." : "Inicializar ambientes"}</button></div></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-action-grid">{environments.map((environment) => <button type="button" className="master-action-card" key={environment.slug} onClick={() => setSelectedSlug(environment.slug)}><strong>{environment.nome}</strong><span>{loading ? "Verificando..." : environment.institution ? `${environment.members.length} técnico(s) · ${environment.athletes.length} atleta(s)` : "Pendente"}</span></button>)}</section>
    {selected?.institution && selected?.project && <section className="master-content-grid">
      <form className="master-panel" onSubmit={saveTechnician}><div className="master-section-heading"><div><span className="master-eyebrow">Projeto selecionado</span><h2>{selected.nome}</h2></div><strong>{selected.project.status}</strong></div>
        <input className="master-input" placeholder="Nome do técnico" value={technician.nome} onChange={(e) => setTechnician({ ...technician, nome: e.target.value })}/>
        <input className="master-input" type="email" placeholder="E-mail do técnico" value={technician.email} onChange={(e) => setTechnician({ ...technician, email: e.target.value })}/>
        <input className="master-input" placeholder="UUID Auth do técnico" value={technician.auth_id} onChange={(e) => setTechnician({ ...technician, auth_id: e.target.value })}/>
        <input className="master-input" placeholder="Localidade" value={technician.localidade} onChange={(e) => setTechnician({ ...technician, localidade: e.target.value })}/>
        <textarea className="master-input" placeholder="Metodologia" value={technician.metodologia} onChange={(e) => setTechnician({ ...technician, metodologia: e.target.value })}/>
        <textarea className="master-input" placeholder="Diretrizes" value={technician.diretrizes} onChange={(e) => setTechnician({ ...technician, diretrizes: e.target.value })}/>
        <div className="master-toolbar"><input className="master-input" type="date" value={technician.data_inicio} onChange={(e) => setTechnician({ ...technician, data_inicio: e.target.value })}/><input className="master-input" type="date" value={technician.data_fim} onChange={(e) => setTechnician({ ...technician, data_fim: e.target.value })}/></div>
        <button className="master-button" disabled={working}>Salvar técnico e projeto</button>
      </form>
      <form className="master-panel" onSubmit={linkAthlete}><div className="master-section-heading"><div><span className="master-eyebrow">Amostra real</span><h2>Vincular atleta</h2></div><strong>{selected.athletes.length}</strong></div>
        <input className="master-input" placeholder="UUID do atleta em perfis_atletas" value={athlete.atleta_id} onChange={(e) => setAthlete({ ...athlete, atleta_id: e.target.value })}/>
        <input className="master-input" placeholder="UUID Auth do técnico responsável" value={athlete.tecnico_responsavel_auth_id} onChange={(e) => setAthlete({ ...athlete, tecnico_responsavel_auth_id: e.target.value })}/>
        <button className="master-button" disabled={working || !athlete.atleta_id}>Vincular atleta</button>
        <ul className="master-activity-list">{selected.athletes.map((item) => <li key={item.id}><div><strong>{item.atleta_id}</strong><span>{item.status}</span></div><b>{item.data_entrada}</b></li>)}</ul>
      </form>
    </section>}
    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Roteiro</span><h2>Módulos de homologação</h2></div><strong>{MODULES.length}</strong></div><ol className="master-activity-list">{MODULES.map((module, index) => <li key={module}><div><strong>{String(index + 1).padStart(2, "0")}</strong><span>{module}</span></div><b>Pendente</b></li>)}</ol></section>
  </div></main>;
}
