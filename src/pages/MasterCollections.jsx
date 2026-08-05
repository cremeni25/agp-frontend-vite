import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectParticipants } from "../services/participantOnboarding";
import { listProjectCatalog } from "../services/protocolCatalog";
import { createCollection, listCollectionVersions, listProjectCollections, updateCollection } from "../services/collectionInstances";
import "../styles/dashboard-master.css";

function schemaFields(schema = {}) {
  const properties = schema.properties || schema.campos || {};
  return Object.entries(properties).map(([name, config]) => ({ name, label: config.title || config.label || name, type: config.type || "string", options: config.enum || config.options || [], required: (schema.required || []).includes(name) }));
}

export default function MasterCollections() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [versions, setVersions] = useState([]);
  const [form, setForm] = useState({ participante_id: "", ativacao_instrumento_id: "", instrumento_id: "", protocolo_id: "", origem: "observacao_profissional", papel_coletor: "tecnico", ciclo_referencia: "", versao_schema: "1.0.0", dados: {} });
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [working, setWorking] = useState(false);

  useEffect(() => { supabase.from("agp_projetos_validacao").select("id,nome,objetivo").order("created_at").then(({ data, error }) => { if (error) setError(error.message); setProjects(data || []); }); }, []);

  async function loadProject(id) {
    setProjectId(id); setSelected(null); setVersions([]); setError(""); setMessage("");
    if (!id) { setParticipants([]); setCatalog([]); setCollections([]); return; }
    try {
      const [participantRows, catalogRows, collectionRows] = await Promise.all([listProjectParticipants(id), listProjectCatalog(id), listProjectCollections(id)]);
      setParticipants((participantRows || []).filter((item) => item.funcao_no_projeto === "atleta" && item.ativo));
      setCatalog(catalogRows || []); setCollections(collectionRows || []);
    } catch (requestError) { setError(`Falha ao carregar operação: ${requestError.message}`); }
  }

  const instrument = useMemo(() => catalog.find((item) => item.ativacao_id === form.ativacao_instrumento_id), [catalog, form.ativacao_instrumento_id]);
  const fields = useMemo(() => schemaFields(instrument?.schema_campos || {}), [instrument]);

  function chooseInstrument(activationId) {
    const item = catalog.find((row) => row.ativacao_id === activationId);
    setForm((current) => ({ ...current, ativacao_instrumento_id: activationId, instrumento_id: item?.instrumento_id || "", protocolo_id: item?.protocolo_id || "", versao_schema: item?.instrumento_versao || "1.0.0", dados: {} }));
  }

  async function save(status) {
    if (!form.participante_id || !form.instrumento_id || !form.ativacao_instrumento_id) return setError("Selecione atleta e instrumento ativado.");
    setWorking(true); setError(""); setMessage("");
    try {
      if (!selected) {
        const created = await createCollection({ ...form, protocolo_id: form.protocolo_id || null });
        setSelected(created);
        if (status !== "rascunho") await updateCollection(created.id, { dados: form.dados, status, justificativa_correcao: null });
      } else {
        await updateCollection(selected.id, { dados: form.dados, status, justificativa_correcao: null });
      }
      setMessage(status === "validada" ? "Coleta validada e bloqueada para edição." : status === "completa" ? "Coleta concluída." : "Rascunho salvo.");
      await loadProject(projectId);
    } catch (requestError) { setError(`Falha ao salvar coleta: ${requestError.message}`); } finally { setWorking(false); }
  }

  async function openCollection(item) {
    setSelected(item); setForm((current) => ({ ...current, participante_id: item.participante_id, ativacao_instrumento_id: item.ativacao_instrumento_id, instrumento_id: item.instrumento_id, protocolo_id: item.protocolo_id || "", versao_schema: item.versao_schema || "1.0.0", dados: item.dados || {} }));
    try { setVersions(await listCollectionVersions(item.coleta_id || item.id)); } catch (requestError) { setError(`Falha ao carregar versões: ${requestError.message}`); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">AGP-38</span><h1>Operação de Coletas</h1><p>Aplicação dinâmica, completude, validação e histórico versionado.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Projeto</span><h2>Escopo operacional</h2></div></div><select className="master-select" value={projectId} onChange={(e) => loadProject(e.target.value)}><option value="">Selecionar projeto</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo || item.id}</option>)}</select></section>

    <section className="master-content-grid"><article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Nova aplicação</span><h2>Instrumento e atleta</h2></div></div>
      <select className="master-select" value={form.participante_id} onChange={(e) => setForm({ ...form, participante_id: e.target.value })}><option value="">Selecionar atleta</option>{participants.map((item) => <option key={item.participante_id} value={item.participante_id}>{item.nome}</option>)}</select>
      <select className="master-select" value={form.ativacao_instrumento_id} onChange={(e) => chooseInstrument(e.target.value)}><option value="">Selecionar instrumento ativado</option>{catalog.map((item) => <option key={item.ativacao_id} value={item.ativacao_id}>{item.instrumento_nome} · {item.protocolo_nome}</option>)}</select>
      <div className="master-toolbar"><input className="master-input" placeholder="Ciclo de referência" value={form.ciclo_referencia} onChange={(e) => setForm({ ...form, ciclo_referencia: e.target.value })}/><select className="master-select" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}><option value="observacao_profissional">Observação profissional</option><option value="autodeclarado">Autodeclarado</option><option value="dispositivo">Dispositivo</option><option value="laboratorio">Laboratório</option><option value="importacao">Importação</option><option value="competicao">Competição</option></select></div>
    </article>
    <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Schema dinâmico</span><h2>{instrument?.instrumento_nome || "Campos do instrumento"}</h2></div><strong>{fields.length}</strong></div>
      {fields.length === 0 ? <div className="master-empty">Selecione um instrumento com schema configurado.</div> : fields.map((field) => <label key={field.name}>{field.label}{field.required ? " *" : ""}{field.options.length ? <select className="master-select" value={form.dados[field.name] ?? ""} onChange={(e) => setForm({ ...form, dados: { ...form.dados, [field.name]: e.target.value } })}><option value="">Selecionar</option>{field.options.map((option) => <option key={String(option)} value={option}>{String(option)}</option>)}</select> : <input className="master-input" type={field.type === "number" || field.type === "integer" ? "number" : field.type === "boolean" ? "checkbox" : "text"} checked={field.type === "boolean" ? Boolean(form.dados[field.name]) : undefined} value={field.type === "boolean" ? undefined : form.dados[field.name] ?? ""} onChange={(e) => setForm({ ...form, dados: { ...form.dados, [field.name]: field.type === "boolean" ? e.target.checked : field.type === "number" || field.type === "integer" ? Number(e.target.value) : e.target.value } })}/>}</label>)}
      <div className="master-toolbar"><button className="master-button secondary" disabled={working || selected?.bloqueado_edicao} onClick={() => save("rascunho")}>Salvar rascunho</button><button className="master-button" disabled={working || selected?.bloqueado_edicao} onClick={() => save("completa")}>Concluir</button><button className="master-button" disabled={working || selected?.bloqueado_edicao} onClick={() => save("validada")}>Validar</button></div>
    </article></section>

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Instâncias</span><h2>Coletas do projeto</h2></div><strong>{collections.length}</strong></div>{collections.length === 0 ? <div className="master-empty">Nenhuma coleta registrada.</div> : <ul className="master-activity-list">{collections.map((item) => <li key={item.coleta_id || item.id}><div><strong>{item.instrumento_nome}</strong><span>{item.participante_nome || item.nome} · {item.status} · completude {item.completude}% · versão {item.ultima_versao || 1}</span></div><button className="master-button secondary" onClick={() => openCollection(item)}>Abrir</button></li>)}</ul>}</section>

    {selected && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Rastreabilidade</span><h2>Histórico de versões</h2></div><strong>{versions.length}</strong></div>{versions.length === 0 ? <div className="master-empty">Nenhuma versão histórica localizada.</div> : <ul className="master-activity-list">{versions.map((item) => <li key={item.id}><div><strong>Versão {item.numero_versao}</strong><span>{item.status} · completude {item.completude}% · {new Date(item.created_at).toLocaleString("pt-BR")}</span></div><b>{item.hash_resposta?.slice(0, 12) || "—"}</b></li>)}</ul>}</section>}
  </div></main>;
}
