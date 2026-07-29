import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AgpOperationalDemo from "../components/AgpOperationalDemo";
import "../styles/dashboard-master.css";

export default function HomologationEnvironment() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState(null);
  const [project, setProject] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ metodologia: "", diretrizes: "", localidade: "", data_inicio: "", data_fim: "", status: "preparacao" });
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const { data: institutionData, error: institutionError } = await supabase.from("agp_instituicoes").select("*").eq("slug", slug).maybeSingle();
    if (institutionError || !institutionData) { setError("Ambiente de homologação não encontrado."); setLoading(false); return; }
    setInstitution(institutionData);

    const [projectResult, memberResult, profileResult] = await Promise.all([
      supabase.from("agp_projetos_validacao").select("*").eq("instituicao_id", institutionData.id).maybeSingle(),
      supabase.from("agp_membros_instituicao").select("*").eq("instituicao_id", institutionData.id).order("created_at"),
      supabase.from("perfis_atletas").select("*").order("nome")
    ]);

    const firstError = projectResult.error || memberResult.error || profileResult.error;
    if (firstError) setError(`Falha ao carregar ambiente: ${firstError.message}`);
    const projectData = projectResult.data || null;
    setProject(projectData);
    setMembers(memberResult.data || []);
    setProfiles(profileResult.data || []);

    if (projectData) {
      setForm({ metodologia: projectData.metodologia || "", diretrizes: projectData.diretrizes || "", localidade: projectData.localidade || institutionData.localidade || "", data_inicio: projectData.data_inicio || "", data_fim: projectData.data_fim || "", status: projectData.status || "preparacao" });
      const { data: linkData, error: linkError } = await supabase.from("agp_atletas_projeto").select("*").eq("projeto_id", projectData.id).order("created_at");
      if (linkError) setError(`Falha ao carregar atletas: ${linkError.message}`);
      setLinks(linkData || []);
    } else setLinks([]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  const profileById = useMemo(() => Object.fromEntries(profiles.map((item) => [item.id, item])), [profiles]);
  const technicians = profiles.filter((item) => ["comissao", "comissão", "tecnico", "técnico", "treinador"].includes(String(item.tipo_usuario || item.funcao || "").toLowerCase()));
  const athletes = profiles.filter((item) => String(item.tipo_usuario || item.funcao || "").toLowerCase() === "atleta");

  async function saveProject() {
    if (!project) return;
    setWorking(true); setMessage(""); setError("");
    const { error: updateError } = await supabase.from("agp_projetos_validacao").update(form).eq("id", project.id);
    if (updateError) setError(`Falha ao salvar projeto: ${updateError.message}`);
    else { setMessage("Configuração do projeto salva."); await load(); }
    setWorking(false);
  }

  async function addTechnician() {
    const profile = profiles.find((item) => item.id === selectedTechnician);
    if (!profile?.auth_id || !institution) { setError("Selecione um técnico com conta de acesso vinculada."); return; }
    setWorking(true); setMessage(""); setError("");
    const { error: memberError } = await supabase.from("agp_membros_instituicao").upsert({ instituicao_id: institution.id, auth_id: profile.auth_id, nome: profile.nome, email: profile.email, papel: "tecnico", acesso_total_tecnico: true, ativo: true }, { onConflict: "instituicao_id,auth_id" });
    if (memberError) setError(`Falha ao vincular técnico: ${memberError.message}`);
    else { setMessage("Técnico vinculado com acesso integral ao ambiente."); setSelectedTechnician(""); await load(); }
    setWorking(false);
  }

  async function addAthlete() {
    if (!project || !selectedAthlete) return;
    setWorking(true); setMessage(""); setError("");
    const technician = members.find((item) => item.papel === "tecnico" && item.ativo);
    const { error: linkError } = await supabase.from("agp_atletas_projeto").upsert({ projeto_id: project.id, atleta_id: selectedAthlete, tecnico_responsavel_auth_id: technician?.auth_id || null, status: "ativo" }, { onConflict: "projeto_id,atleta_id" });
    if (linkError) setError(`Falha ao vincular atleta: ${linkError.message}`);
    else { setMessage("Atleta incluído no projeto de validação."); setSelectedAthlete(""); await load(); }
    setWorking(false);
  }

  if (loading) return <main className="dashboard-master"><div className="dashboard-loading">Carregando ambiente...</div></main>;

  return (
    <main className="dashboard-master"><div className="dashboard-overlay master-page">
      <header className="dashboard-header master-header"><div><span className="master-eyebrow">Projeto de validação</span><h1>{institution?.nome || "Homologação"}</h1><p>{project?.objetivo}</p></div><button className="master-button secondary" onClick={() => navigate("/master/homologacao")}>Voltar</button></header>
      {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

      {slug === "agp-homologacao-master" && <AgpOperationalDemo />}

      <section className="master-content-grid">
        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Configuração</span><h2>Diretrizes do piloto</h2></div><strong>{project?.status}</strong></div>
          <input className="master-input" placeholder="Localidade" value={form.localidade} onChange={(e) => setForm({ ...form, localidade: e.target.value })}/>
          <textarea className="master-input" rows="4" placeholder="Metodologia aplicada" value={form.metodologia} onChange={(e) => setForm({ ...form, metodologia: e.target.value })}/>
          <textarea className="master-input" rows="4" placeholder="Diretrizes e propósito da avaliação" value={form.diretrizes} onChange={(e) => setForm({ ...form, diretrizes: e.target.value })}/>
          <div className="master-toolbar"><input className="master-input" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}/><input className="master-input" type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })}/><select className="master-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="preparacao">Preparação</option><option value="homologacao">Homologação</option><option value="em_campo">Em campo</option><option value="concluido">Concluído</option><option value="suspenso">Suspenso</option></select></div>
          <button className="master-button" disabled={working || !project} onClick={saveProject}>Salvar configuração</button>
        </article>

        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Equipe</span><h2>Técnico avaliador</h2></div><strong>{members.filter((m) => m.papel === "tecnico").length}</strong></div>
          <select className="master-select" value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)}><option value="">Selecionar técnico existente</option>{technicians.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.email || "sem e-mail"}</option>)}</select>
          <button className="master-button" disabled={working || !selectedTechnician} onClick={addTechnician}>Vincular técnico</button>
          <ul className="master-activity-list">{members.filter((m) => m.papel === "tecnico").map((m) => <li key={m.id}><div><strong>{m.nome}</strong><span>{m.email}</span></div><b>{m.ativo ? "Ativo" : "Inativo"}</b></li>)}</ul>
        </article>
      </section>

      <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Participantes</span><h2>Atletas do projeto</h2></div><strong>{links.length}</strong></div>
        <div className="master-toolbar"><select className="master-select" value={selectedAthlete} onChange={(e) => setSelectedAthlete(e.target.value)}><option value="">Selecionar atleta existente</option>{athletes.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.email || item.id}</option>)}</select><button className="master-button" disabled={working || !selectedAthlete} onClick={addAthlete}>Adicionar atleta</button></div>
        {links.length === 0 ? <div className="master-empty">Nenhum atleta vinculado a este piloto.</div> : <ul className="master-activity-list">{links.map((link) => { const athlete = profileById[link.atleta_id]; return <li key={link.id}><div><strong>{athlete?.nome || link.atleta_id}</strong><span>{athlete?.nivel || athlete?.categoria || "Perfil esportivo"}</span></div><b>{link.status}</b></li>; })}</ul>}
      </section>
    </div></main>
  );
}
