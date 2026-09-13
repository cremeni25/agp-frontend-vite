import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listProfessionalResults, listResultValidations, validateProfessionalResult } from "../services/professionalValidation";
import "../styles/dashboard-comissao.css";

const EMPTY = { decisao: "aprovado", parecer_tecnico: "", papel_profissional: "responsável técnico", visivel_atleta: false, visivel_comissao: true, visivel_instituicao: true, substitui_resultado_id: "", motivo_substituicao: "" };

export default function ProfessionalValidation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId = params.get("projeto") || "";
  const participantId = params.get("participante") || "";
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!projectId) { setLoading(false); setError("Projeto profissional não identificado."); return; }
    setLoading(true); setError("");
    try {
      const rows = await listProfessionalResults(projectId);
      const scoped = participantId ? (rows || []).filter((item) => String(item.participante_id || item.atleta_participante_id || "") === String(participantId)) : (rows || []);
      setResults(scoped);
      if (selected) setSelected(scoped.find((item) => item.id === selected.id) || null);
    } catch (e) { setError(e.message); setResults([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [projectId, participantId]);

  async function choose(result) {
    setSelected(result); setForm(EMPTY); setMessage("");
    try { setHistory(await listResultValidations(result.id)); }
    catch (e) { setError(e.message); }
  }

  async function submit(e) {
    e.preventDefault(); if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await validateProfessionalResult(selected.id, {
        ...form,
        substitui_resultado_id: form.decisao === "substituido" ? form.substitui_resultado_id || null : null,
        motivo_substituicao: form.decisao === "substituido" ? form.motivo_substituicao || null : null
      });
      setMessage("Decisão profissional registrada e rastreável.");
      setHistory(await listResultValidations(selected.id));
      await load();
      setForm(EMPTY);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const replacements = useMemo(() => results.filter((item) => item.id !== selected?.id), [results, selected]);

  return <main className="dashboard-comissao"><div className="dashboard-overlay">
    <header className="dashboard-header"><div><span>AGP · Decisão profissional</span><h1>O que precisa ser validado?</h1><p>Valide somente resultados do projeto sob sua responsabilidade.</p></div><button onClick={() => navigate("/dashboard-comissao")}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}{message && <div className="master-success">{message}</div>}
    <section className="dashboard-section"><h2>Fila de decisão</h2>{loading ? <p>Carregando...</p> : results.length === 0 ? <p>Nenhum resultado aguardando decisão neste contexto.</p> : <div className="athlete-grid">{results.map((result) => <article className="athlete-card" key={result.id}><strong>{result.tipo || "Resultado analítico"}</strong><span>{result.status || "preliminar"}</span><button onClick={() => choose(result)}>Abrir decisão</button></article>)}</div>}</section>
    {selected && <section className="dashboard-section"><h2>{selected.tipo || "Resultado analítico"}</h2><p>{selected.explicacao || selected.parecer_tecnico || "Sem explicação registrada."}</p><form onSubmit={submit}><label>Decisão<select value={form.decisao} onChange={(e) => setForm({ ...form, decisao: e.target.value })}><option value="aprovado">Aprovar</option><option value="rejeitado">Rejeitar</option><option value="substituido">Substituir</option></select></label><label>Parecer técnico<textarea rows="5" minLength="10" required value={form.parecer_tecnico} onChange={(e) => setForm({ ...form, parecer_tecnico: e.target.value })} /></label>{form.decisao === "substituido" && <><label>Resultado substituto<select required value={form.substitui_resultado_id} onChange={(e) => setForm({ ...form, substitui_resultado_id: e.target.value })}><option value="">Selecionar</option>{replacements.map((item) => <option key={item.id} value={item.id}>{item.tipo || item.id}</option>)}</select></label><label>Motivo<input required value={form.motivo_substituicao} onChange={(e) => setForm({ ...form, motivo_substituicao: e.target.value })} /></label></>}<button disabled={saving}>{saving ? "Registrando..." : "Registrar decisão"}</button></form></section>}
    {history.length > 0 && <details className="dashboard-section"><summary>Histórico desta decisão</summary>{history.map((item) => <article className="athlete-card" key={item.id}><strong>{item.decisao}</strong><span>{new Date(item.created_at).toLocaleString("pt-BR")}</span><p>{item.parecer_tecnico}</p></article>)}</details>}
  </div></main>;
}
