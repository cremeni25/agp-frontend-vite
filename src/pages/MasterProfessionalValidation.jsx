import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { listProfessionalResults, listResultValidations, validateProfessionalResult } from "../services/professionalValidation";
import "../styles/dashboard-master.css";

const initialForm = {
  decisao: "aprovado",
  parecer_tecnico: "",
  papel_profissional: "responsável técnico",
  visivel_atleta: false,
  visivel_comissao: true,
  visivel_instituicao: true,
  substitui_resultado_id: "",
  motivo_substituicao: ""
};

export default function MasterProfessionalValidation() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("agp_projetos_validacao").select("id,nome,status").order("nome").then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message);
      setProjects(data || []);
    });
  }, []);

  async function loadResults(id = projectId) {
    if (!id) return;
    setError("");
    try {
      const rows = await listProfessionalResults(id);
      setResults(rows || []);
      if (selected) {
        const refreshed = (rows || []).find((item) => item.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (projectId) loadResults(projectId); }, [projectId]);

  async function chooseResult(result) {
    setSelected(result);
    setForm(initialForm);
    try { setHistory(await listResultValidations(result.id)); }
    catch (err) { setError(err.message); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await validateProfessionalResult(selected.id, {
        ...form,
        substitui_resultado_id: form.decisao === "substituido" ? form.substitui_resultado_id || null : null,
        motivo_substituicao: form.decisao === "substituido" ? form.motivo_substituicao || null : null
      });
      setMessage("Decisão profissional registrada com rastreabilidade.");
      setHistory(await listResultValidations(selected.id));
      await loadResults();
      setForm(initialForm);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const replacementOptions = useMemo(() => results.filter((item) => item.id !== selected?.id), [results, selected]);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">AGP-40</span><h1>Validação profissional</h1><p>Decisão técnica, parecer, substituição e visibilidade institucional dos resultados analíticos.</p></div><button className="master-button secondary" onClick={() => history.back()}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}{message && <div className="master-success">{message}</div>}

    <section className="master-panel"><div className="master-form-grid"><label>Projeto<select value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelected(null); setHistory([]); }}><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.nome || project.id}</option>)}</select></label><div><button className="master-button secondary" type="button" onClick={() => loadResults()}>Atualizar resultados</button></div></div></section>

    <section className="master-content-grid">
      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Resultados</span><h2>Fila de decisão profissional</h2></div><strong>{results.length}</strong></div>{results.length === 0 ? <p>Nenhum resultado disponível para o projeto.</p> : <ul className="master-activity-list">{results.map((result) => <li key={result.id}><button className="master-link-button" onClick={() => chooseResult(result)}><strong>{result.tipo || "Resultado analítico"}</strong><span>{result.status || "preliminar"} · motor {result.versao_motor || "—"}</span></button></li>)}</ul>}</article>

      <article className="master-panel">{!selected ? <p>Selecione um resultado para registrar a decisão profissional.</p> : <><div className="master-section-heading"><div><span className="master-eyebrow">Resultado selecionado</span><h2>{selected.tipo || "Análise"}</h2></div><strong>{selected.status}</strong></div><p>{selected.explicacao || selected.parecer_tecnico || "Sem explicação registrada."}</p><small>Hash: {selected.hash_execucao || selected.hash_resultado || "—"}</small>
      <form onSubmit={submit} className="master-form-grid"><label>Decisão<select value={form.decisao} onChange={(e) => setForm({ ...form, decisao: e.target.value })}><option value="aprovado">Aprovar</option><option value="rejeitado">Rejeitar</option><option value="substituido">Substituir</option></select></label><label>Papel profissional<input value={form.papel_profissional} onChange={(e) => setForm({ ...form, papel_profissional: e.target.value })} required /></label><label className="full-width">Parecer técnico<textarea rows="6" value={form.parecer_tecnico} onChange={(e) => setForm({ ...form, parecer_tecnico: e.target.value })} minLength="10" required /></label>{form.decisao === "substituido" && <><label>Resultado substituto<select value={form.substitui_resultado_id} onChange={(e) => setForm({ ...form, substitui_resultado_id: e.target.value })} required><option value="">Selecione</option>{replacementOptions.map((item) => <option key={item.id} value={item.id}>{item.tipo || item.id} · {item.status}</option>)}</select></label><label>Motivo da substituição<input value={form.motivo_substituicao} onChange={(e) => setForm({ ...form, motivo_substituicao: e.target.value })} required /></label></>}
      <label><input type="checkbox" checked={form.visivel_atleta} onChange={(e) => setForm({ ...form, visivel_atleta: e.target.checked })} /> Visível ao atleta</label><label><input type="checkbox" checked={form.visivel_comissao} onChange={(e) => setForm({ ...form, visivel_comissao: e.target.checked })} /> Visível à comissão</label><label><input type="checkbox" checked={form.visivel_instituicao} onChange={(e) => setForm({ ...form, visivel_instituicao: e.target.checked })} /> Visível à instituição</label><div><button className="master-button" disabled={saving}>{saving ? "Registrando…" : "Registrar decisão"}</button></div></form></>}</article>
    </section>

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Auditoria</span><h2>Histórico de validações</h2></div><strong>{history.length}</strong></div>{history.length === 0 ? <p>Nenhuma decisão anterior para o resultado selecionado.</p> : <ul className="master-activity-list">{history.map((item) => <li key={item.id}><div><strong>{item.decisao}</strong><span>{item.papel_profissional} · {new Date(item.created_at).toLocaleString("pt-BR")}</span><small>{item.parecer_tecnico}</small></div><b>A:{item.visivel_atleta ? "sim" : "não"} C:{item.visivel_comissao ? "sim" : "não"} I:{item.visivel_instituicao ? "sim" : "não"}</b></li>)}</ul>}</section>
  </div></main>;
}
