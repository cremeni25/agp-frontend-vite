import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectCollections } from "../services/collectionInstances";
import { executeAnalysis, listProjectExecutions } from "../services/analyticPipeline";
import "../styles/dashboard-master.css";

export default function MasterAnalyticPipeline() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [collections, setCollections] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [age, setAge] = useState(18);
  const [level, setLevel] = useState("base");
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadProject() {
    if (!projectId) return;
    setBusy(true); setError("");
    try {
      const [collectionRows, executionRows, participantRows] = await Promise.all([
        listProjectCollections(projectId),
        listProjectExecutions(projectId),
        supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,ativo,agp_pessoas(nome)").eq("projeto_id", projectId).eq("funcao_no_projeto", "atleta").eq("ativo", true)
      ]);
      if (participantRows.error) throw participantRows.error;
      setCollections(collectionRows || []);
      setExecutions(executionRows || []);
      setParticipants(participantRows.data || []);
      setSelectedCollections([]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { setSelectedCollections([]); }, [selectedParticipant]);

  const eligibleCollections = useMemo(() => collections.filter((item) =>
    item.participante_id === selectedParticipant && item.status === "validada" && item.bloqueada_em && item.liberado_motor_em
  ), [collections, selectedParticipant]);

  function toggleCollection(id) {
    setSelectedCollections((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function runAnalysis() {
    if (!selectedParticipant || selectedCollections.length === 0) return setError("Selecione o atleta e ao menos uma coleta validada.");
    setBusy(true); setError("");
    try {
      const result = await executeAnalysis({ participante_id: selectedParticipant, coleta_ids: selectedCollections, idade: Number(age), nivel: level, tipo: "score_global", parametros: {} });
      setSelectedExecution(result);
      await loadProject();
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <main className="dashboard-master"><div className="dashboard-overlay master-page">
      <header className="dashboard-header master-header">
        <div><span className="master-eyebrow">AGP-39</span><h1>Pipeline analítico rastreável</h1><p>Selecione entradas validadas, execute o motor versionado e consulte a explicação oficial.</p></div>
        <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
      </header>
      {error && <div className="master-error" role="alert">{error}</div>}

      <section className="master-panel">
        <div className="master-form-grid">
          <label>Projeto<input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="UUID do projeto" /></label>
          <button className="master-button" onClick={loadProject} disabled={!projectId || busy}>Carregar operação</button>
          <label>Atleta<select value={selectedParticipant} onChange={(e) => setSelectedParticipant(e.target.value)}><option value="">Selecione</option>{participants.map((p) => <option key={p.id} value={p.id}>{p.agp_pessoas?.nome || p.pessoa_id}</option>)}</select></label>
          <label>Idade<input type="number" min="5" max="100" value={age} onChange={(e) => setAge(e.target.value)} /></label>
          <label>Nível<select value={level} onChange={(e) => setLevel(e.target.value)}><option value="base">Base</option><option value="competitivo">Competitivo</option><option value="elite">Elite</option></select></label>
        </div>
      </section>

      <section className="master-panel">
        <div className="master-section-heading"><div><span className="master-eyebrow">Entradas explícitas</span><h2>Coletas liberadas ao motor</h2></div><strong>{selectedCollections.length}</strong></div>
        {eligibleCollections.length === 0 ? <p>Nenhuma coleta validada e liberada para o atleta selecionado.</p> : (
          <div className="master-action-grid">{eligibleCollections.map((item) => <label key={item.id} className="master-action-card">
            <input type="checkbox" checked={selectedCollections.includes(item.id)} onChange={() => toggleCollection(item.id)} />
            <strong>{item.instrumento_nome || item.instrumento_codigo || item.id}</strong>
            <span>Status {item.status} · completude {item.completude}% · versão {item.ultima_versao || "—"}</span>
          </label>)}</div>
        )}
        <button className="master-button" onClick={runAnalysis} disabled={busy || selectedCollections.length === 0}>Executar motor AGP</button>
      </section>

      <section className="master-content-grid">
        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Histórico</span><h2>Execuções do projeto</h2></div><strong>{executions.length}</strong></div>
          {executions.map((item) => <button key={item.id} className="master-link-button" onClick={() => setSelectedExecution(item)}>{item.tipo} · {item.status} · {item.versao_motor}</button>)}
        </article>
        <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Rastreabilidade</span><h2>Resultado selecionado</h2></div></div>
          {!selectedExecution ? <p>Selecione uma execução.</p> : <>
            <p><strong>Status:</strong> {selectedExecution.status}</p><p><strong>Motor:</strong> {selectedExecution.versao_motor}</p>
            <p><strong>Explicação:</strong> {selectedExecution.explicacao || "—"}</p><p><strong>Limitações:</strong> {selectedExecution.limitacoes || "—"}</p>
            <p><strong>Confiança:</strong> {selectedExecution.confianca ?? "—"}</p><p><strong>Hash:</strong> {selectedExecution.hash_execucao || "—"}</p>
            <pre>{JSON.stringify(selectedExecution.resultado || {}, null, 2)}</pre>
          </>}
        </article>
      </section>
    </div></main>
  );
}
