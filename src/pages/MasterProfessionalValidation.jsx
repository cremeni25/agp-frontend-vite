import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProfessionalResults, listResultValidations, validateProfessionalResult } from "../services/professionalValidation";
import "../styles/dashboard-master.css";

const initialForm = { decisao: "aprovado", parecer_tecnico: "", papel_profissional: "responsável técnico", visivel_atleta: false, visivel_comissao: true, visivel_instituicao: true, substitui_resultado_id: "", motivo_substituicao: "" };

export default function MasterProfessionalValidation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contextualProject = params.get("projeto") || "";
  const contextualParticipant = params.get("participante") || "";
  const [projects, setProjects] = useState([]), [projectId, setProjectId] = useState(contextualProject), [results, setResults] = useState([]), [selected, setSelected] = useState(null), [history, setHistory] = useState([]), [form, setForm] = useState(initialForm), [message, setMessage] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("agp_projetos_validacao").select("id,nome,status").order("nome").then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message); else setProjects(data || []);
    });
  }, []);

  async function loadResults(id = projectId) {
    if (!id) return;
    setError("");
    try {
      const rows = await listProfessionalResults(id);
      const filtered = contextualParticipant ? (rows || []).filter((item) => String(item.participante_id || item.atleta_participante_id || "") === String(contextualParticipant)) : (rows || []);
      setResults(filtered);
      if (selected) setSelected(filtered.find((item) => item.id === selected.id) || null);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (projectId) loadResults(projectId); }, [projectId, contextualParticipant]);

  async function chooseResult(result) {
    setSelected(result); setForm(initialForm); setMessage("");
    try { setHistory(await listResultValidations(result.id)); } catch (err) { setError(err.message); }
  }

  async function submit(event) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await validateProfessionalResult(selected.id, { ...form, substitui_resultado_id: form.decisao === "substituido" ? form.substitui_resultado_id || null : null, motivo_substituicao: form.decisao === "substituido" ? form.motivo_substituicao || null : null });
      setMessage("Decisão profissional registrada.");
      setHistory(await listResultValidations(selected.id));
      await loadResults(); setForm(initialForm);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  const replacementOptions = useMemo(() => results.filter((item) => item.id !== selected?.id), [results, selected]);
  const contextual = Boolean(contextualProject);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Decisão profissional</span><h1>O que precisa ser validado?</h1><p>O AGP mostra os resultados que aguardam decisão técnica.</p></div><button className="master-button secondary" onClick={() => navigate(contextualParticipant ? `/master/atletas/${contextualParticipant}` : "/dashboard-master")}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}{message && <div className="master-success">{message}</div>}

    {!contextual && <section className="master-panel"><select className="master-select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelected(null); setHistory([]); }}><option value="">Selecionar projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.nome || project.id}</option>)}</select></section>}

    <section className="master-content-grid">
      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Agora</span><h2>Fila de decisão</h2></div><strong>{results.length}</strong></div>{results.length === 0 ? <div className="master-empty">Nenhum resultado aguardando decisão.</div> : <ul className="master-activity-list">{results.map((result) => <li key={result.id}><button className="master-link-button" onClick={() => chooseResult(result)}><strong>{result.tipo || "Resultado analítico"}</strong><span>{result.status || "preliminar"}</span></button></li>)}</ul>}</article>

      <article className="master-panel">{!selected ? <div className="master-empty">Selecione um resultado para decidir.</div> : <><div className="master-section-heading"><div><span className="master-eyebrow">Resultado</span><h2>{selected.tipo || "Análise"}</h2></div><strong>{selected.status}</strong></div><p>{selected.explicacao || selected.parecer_tecnico || "Sem explicação registrada."}</p>
      <form onSubmit={submit} className="master-form-grid"><label>Decisão<select value={form.decisao} onChange={(e) => setForm({ ...form, decisao: e.target.value })}><option value="aprovado">Aprovar</option><option value="rejeitado">Rejeitar</option><option value="substituido">Substituir</option></select></label><label className="full-width">Parecer técnico<textarea rows="5" value={form.parecer_tecnico} onChange={(e) => setForm({ ...form, parecer_tecnico: e.target.value })} minLength="10" required /></label>{form.decisao === "substituido" && <><label>Resultado substituto<select value={form.substitui_resultado_id} onChange={(e) => setForm({ ...form, substitui_resultado_id: e.target.value })} required><option value="">Selecionar</option>{replacementOptions.map((item) => <option key={item.id} value={item.id}>{item.tipo || item.id}</option>)}</select></label><label>Motivo<input value={form.motivo_substituicao} onChange={(e) => setForm({ ...form, motivo_substituicao: e.target.value })} required /></label></>}
      <details className="full-width"><summary>Visibilidade da decisão</summary><label><input type="checkbox" checked={form.visivel_atleta} onChange={(e) => setForm({ ...form, visivel_atleta: e.target.checked })} /> Atleta</label><label><input type="checkbox" checked={form.visivel_comissao} onChange={(e) => setForm({ ...form, visivel_comissao: e.target.checked })} /> Comissão</label><label><input type="checkbox" checked={form.visivel_instituicao} onChange={(e) => setForm({ ...form, visivel_instituicao: e.target.checked })} /> Instituição</label></details><button className="master-button" disabled={saving}>{saving ? "Registrando…" : "Registrar decisão"}</button></form></>}</article>
    </section>

    {history.length > 0 && <details className="master-panel"><summary>Histórico desta decisão</summary><ul className="master-activity-list">{history.map((item) => <li key={item.id}><div><strong>{item.decisao}</strong><span>{new Date(item.created_at).toLocaleString("pt-BR")}</span><small>{item.parecer_tecnico}</small></div></li>)}</ul></details>}
  </div></main>;
}
