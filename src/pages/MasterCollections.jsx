import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectParticipants } from "../services/participantOnboarding";
import { listProjectCatalog } from "../services/protocolCatalog";
import { createCollection, listProjectCollections, updateCollection } from "../services/collectionInstances";
import "../styles/dashboard-master.css";

function fieldsFrom(schema = {}) {
  const props = schema.properties || schema.campos || {};
  return Object.entries(props).map(([name, config]) => ({
    name,
    label: config.title || config.label || name,
    type: config.type || "string",
    options: config.enum || config.options || [],
    required: (schema.required || []).includes(name)
  }));
}

export default function MasterCollections() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialProjectId = params.get("projeto") || "";
  const initialParticipantId = params.get("participante") || "";
  const contextual = Boolean(initialProjectId && initialParticipantId);

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState({ participante_id: "", ativacao_instrumento_id: "", instrumento_id: "", protocolo_id: "", versao_schema: "1.0.0", origem: "observacao_profissional", papel_coletor: "tecnico", dados: {} });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function loadProject(id, preferredParticipantId = "") {
    setProjectId(id);
    if (!id) return;
    try {
      const [participantRows, catalogRows, collectionRows] = await Promise.all([
        listProjectParticipants(id),
        listProjectCatalog(id),
        listProjectCollections(id)
      ]);
      const athletes = (participantRows || []).filter((item) => item.funcao_no_projeto === "atleta" && item.ativo);
      const activeCatalog = catalogRows || [];
      const chosenParticipant = preferredParticipantId && athletes.some((item) => String(item.participante_id) === String(preferredParticipantId)) ? preferredParticipantId : "";
      const onlyInstrument = activeCatalog.length === 1 ? activeCatalog[0] : null;
      setParticipants(athletes);
      setCatalog(activeCatalog);
      setCollections(collectionRows || []);
      setForm((current) => ({
        ...current,
        participante_id: chosenParticipant || current.participante_id,
        ativacao_instrumento_id: onlyInstrument?.ativacao_id || current.ativacao_instrumento_id,
        instrumento_id: onlyInstrument?.instrumento_id || current.instrumento_id,
        protocolo_id: onlyInstrument?.protocolo_id || current.protocolo_id,
        versao_schema: onlyInstrument?.instrumento_versao || current.versao_schema,
        dados: onlyInstrument ? {} : current.dados
      }));
    } catch (e) { setError(`Falha ao carregar a operação: ${e.message}`); }
  }

  useEffect(() => {
    async function init() {
      const { data, error: projectError } = await supabase.from("agp_projetos_validacao").select("id,nome,objetivo").order("created_at");
      if (projectError) return setError(projectError.message);
      setProjects(data || []);
      if (initialProjectId) await loadProject(initialProjectId, initialParticipantId);
    }
    init();
  }, [initialProjectId, initialParticipantId]);

  const instrument = useMemo(() => catalog.find((item) => item.ativacao_id === form.ativacao_instrumento_id), [catalog, form.ativacao_instrumento_id]);
  const fields = useMemo(() => fieldsFrom(instrument?.schema_campos || {}), [instrument]);
  const athleteName = useMemo(() => participants.find((item) => String(item.participante_id) === String(form.participante_id))?.nome || "", [participants, form.participante_id]);

  function chooseInstrument(id) {
    const item = catalog.find((row) => row.ativacao_id === id);
    setForm((current) => ({ ...current, ativacao_instrumento_id: id, instrumento_id: item?.instrumento_id || "", protocolo_id: item?.protocolo_id || "", versao_schema: item?.instrumento_versao || "1.0.0", dados: {} }));
  }

  async function register() {
    if (!form.participante_id || !form.instrumento_id || !form.ativacao_instrumento_id) return setError("O AGP ainda não conseguiu determinar o contexto desta evidência.");
    setWorking(true); setError(""); setMessage("");
    try {
      const created = await createCollection({ ...form, protocolo_id: form.protocolo_id || null });
      await updateCollection(created.id, { dados: form.dados, status: "completa", justificativa_correcao: null });
      setMessage("Evidência registrada com sucesso.");
      await loadProject(projectId, form.participante_id);
    } catch (e) { setError(`Falha ao registrar evidência: ${e.message}`); }
    finally { setWorking(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header">
      <div><span className="master-eyebrow">Agora</span><h1>{contextual && athleteName ? athleteName : "Registrar evidência"}</h1><p>{instrument?.instrumento_nome || "O AGP mostra apenas o que precisa ser preenchido."}</p></div>
      <button className="master-button secondary" onClick={() => navigate(contextual ? `/master/atletas/${initialParticipantId}` : "/dashboard-master")}>Voltar</button>
    </header>

    {message && <div className="master-feedback success">{message}</div>}
    {error && <div className="master-error" role="alert">{error}</div>}

    {!contextual && <section className="master-panel">
      <h2>Contexto</h2>
      <select className="master-select" value={projectId} onChange={(e) => loadProject(e.target.value)}><option value="">Selecionar projeto</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo}</option>)}</select>
      {projectId && <select className="master-select" value={form.participante_id} onChange={(e) => setForm({ ...form, participante_id: e.target.value })}><option value="">Selecionar atleta</option>{participants.map((item) => <option key={item.participante_id} value={item.participante_id}>{item.nome}</option>)}</select>}
      {projectId && catalog.length > 1 && <select className="master-select" value={form.ativacao_instrumento_id} onChange={(e) => chooseInstrument(e.target.value)}><option value="">Selecionar instrumento</option>{catalog.map((item) => <option key={item.ativacao_id} value={item.ativacao_id}>{item.instrumento_nome}</option>)}</select>}
    </section>}

    <section className="master-panel">
      <div className="master-section-heading"><div><span className="master-eyebrow">Preenchimento</span><h2>{instrument?.instrumento_nome || "Evidência"}</h2></div></div>
      {fields.length === 0 ? <div className="master-empty">Nenhum campo disponível.</div> : fields.map((field) => <label key={field.name}>{field.label}{field.required ? " *" : ""}{field.options.length ? <select className="master-select" value={form.dados[field.name] ?? ""} onChange={(e) => setForm({ ...form, dados: { ...form.dados, [field.name]: e.target.value } })}><option value="">Selecionar</option>{field.options.map((option) => <option key={String(option)} value={option}>{String(option)}</option>)}</select> : <input className="master-input" type={field.type === "number" || field.type === "integer" ? "number" : "text"} value={form.dados[field.name] ?? ""} onChange={(e) => setForm({ ...form, dados: { ...form.dados, [field.name]: field.type === "number" || field.type === "integer" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value } })}/>}</label>)}
      <button className="master-button" disabled={working} onClick={register}>{working ? "Registrando..." : "Registrar evidência"}</button>
    </section>

    {collections.length > 0 && <details className="master-panel"><summary>Histórico</summary><ul className="master-activity-list">{collections.slice(0,10).map((item) => <li key={item.coleta_id || item.id}><div><strong>{item.instrumento_nome}</strong><span>{item.participante_nome || item.nome} · {item.status}</span></div></li>)}</ul></details>}
  </div></main>;
}
