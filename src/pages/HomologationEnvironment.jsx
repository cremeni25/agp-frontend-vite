import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectParticipants } from "../services/participantOnboarding";
import AgpEvidenceReadiness from "../components/AgpEvidenceReadiness";
import "../styles/dashboard-master.css";

export default function HomologationEnvironment() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState(null);
  const [project, setProject] = useState(null);
  const [legacyProfiles, setLegacyProfiles] = useState([]);
  const [legacyLinks, setLegacyLinks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState({ metodologia: "", diretrizes: "", localidade: "", data_inicio: "", data_fim: "", status: "preparacao" });
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

    const [projectResult, profileResult] = await Promise.all([
      supabase.from("agp_projetos_validacao").select("*").eq("instituicao_id", institutionData.id).maybeSingle(),
      supabase.from("perfis_atletas").select("*").order("nome")
    ]);
    const firstError = projectResult.error || profileResult.error;
    if (firstError) setError(`Falha ao carregar ambiente: ${firstError.message}`);
    setLegacyProfiles(profileResult.data || []);

    const projectData = projectResult.data || null;
    setProject(projectData);
    if (projectData) {
      setForm({ metodologia: projectData.metodologia || "", diretrizes: projectData.diretrizes || "", localidade: projectData.localidade || institutionData.localidade || "", data_inicio: projectData.data_inicio || "", data_fim: projectData.data_fim || "", status: projectData.status || "preparacao" });
      const { data: links, error: linkError } = await supabase.from("agp_atletas_projeto").select("*").eq("projeto_id", projectData.id).order("created_at");
      if (linkError) setError(`Falha ao carregar vínculos históricos: ${linkError.message}`);
      setLegacyLinks(links || []);
      try { setParticipants(await listProjectParticipants(projectData.id)); }
      catch (requestError) { setParticipants([]); setError(`Núcleo de participantes indisponível: ${requestError.message}`); }
    } else {
      setLegacyLinks([]);
      setParticipants([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  const profileById = useMemo(() => Object.fromEntries(legacyProfiles.map((item) => [item.id, item])), [legacyProfiles]);
  const technicians = participants.filter((item) => ["tecnico", "treinador"].includes(item.funcao_no_projeto));
  const athletes = participants.filter((item) => item.funcao_no_projeto === "atleta");

  async function saveProject() {
    if (!project) return;
    setWorking(true); setMessage(""); setError("");
    const { error: updateError } = await supabase.from("agp_projetos_validacao").update(form).eq("id", project.id);
    if (updateError) setError(`Falha ao salvar projeto: ${updateError.message}`);
    else { setMessage("Configuração do projeto salva."); await load(); }
    setWorking(false);
  }

  if (loading) return <main className="dashboard-master"><div className="dashboard-loading">Carregando ambiente...</div></main>;

  return (
    <main className="dashboard-master"><div className="dashboard-overlay master-page">
      <header className="dashboard-header master-header">
        <div><span className="master-eyebrow">Projeto de validação</span><h1>{institution?.nome || "Homologação"}</h1><p>{project?.objetivo}</p></div>
        <div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/master/participantes")}>Central de Participantes</button><button className="master-button secondary" onClick={() => navigate("/master/homologacao")}>Voltar</button></div>
      </header>
      {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

      {project && <AgpEvidenceReadiness projectId={project.id} athleteLinks={legacyLinks} profileById={profileById} />}

      <section className="master-content-grid">
        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Configuração</span><h2>Diretrizes do piloto</h2></div><strong>{project?.status}</strong></div>
          <input className="master-input" placeholder="Localidade" value={form.localidade} onChange={(e) => setForm({ ...form, localidade: e.target.value })}/>
          <textarea className="master-input" rows="4" placeholder="Metodologia aplicada" value={form.metodologia} onChange={(e) => setForm({ ...form, metodologia: e.target.value })}/>
          <textarea className="master-input" rows="4" placeholder="Diretrizes e propósito da avaliação" value={form.diretrizes} onChange={(e) => setForm({ ...form, diretrizes: e.target.value })}/>
          <div className="master-toolbar"><input className="master-input" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}/><input className="master-input" type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })}/><select className="master-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="preparacao">Preparação</option><option value="homologacao">Homologação</option><option value="em_campo">Em campo</option><option value="concluido">Concluído</option><option value="suspenso">Suspenso</option></select></div>
          <button className="master-button" disabled={working || !project} onClick={saveProject}>Salvar configuração</button>
        </article>

        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Equipe canônica</span><h2>Técnicos vinculados</h2></div><strong>{technicians.length}</strong></div>
          {technicians.length === 0 ? <div className="master-empty"><strong>Nenhum técnico cadastrado neste projeto.</strong><span>O vínculo deve ser criado pela Central de Participantes.</span><button className="master-button" onClick={() => navigate("/master/participantes")}>Cadastrar técnico</button></div> : <ul className="master-activity-list">{technicians.map((item) => <li key={item.participante_id}><div><strong>{item.nome}</strong><span>{item.funcao_no_projeto} · {item.status_calculado}</span></div><b>{item.ativo ? "Ativo" : "Inativo"}</b></li>)}</ul>}
        </article>
      </section>

      <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Participantes canônicos</span><h2>Atletas do projeto</h2></div><strong>{athletes.length}</strong></div>
        {athletes.length === 0 ? <div className="master-empty"><strong>Nenhum atleta cadastrado neste projeto.</strong><span>Cadastre identidade, perfil esportivo, técnico responsável e pendências pela Central de Participantes.</span><button className="master-button" onClick={() => navigate("/master/participantes")}>Cadastrar atleta</button></div> : <ul className="master-activity-list">{athletes.map((item) => <li key={item.participante_id}><div><strong>{item.nome}</strong><span>Onboarding: {item.status_calculado}</span></div><b>{item.ativo ? "Ativo" : "Inativo"}</b></li>)}</ul>}
      </section>

      {legacyLinks.length > 0 && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Compatibilidade temporária</span><h2>Vínculos históricos</h2></div><strong>{legacyLinks.length}</strong></div><p>Estes vínculos permanecem somente para leitura do núcleo de evidências durante a migração. Novos cadastros não são mais realizados nesta tela.</p></section>}
    </div></main>
  );
}
