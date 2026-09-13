import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectCollections } from "../services/collectionInstances";
import { executeAnalysis, listProjectExecutions } from "../services/analyticPipeline";
import "../styles/dashboard-master.css";

export default function MasterAnalyticPipeline() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialProject = params.get("projeto") || "";
  const initialParticipant = params.get("participante") || "";
  const contextual = Boolean(initialProject);
  const [projects, setProjects] = useState([]), [projectId, setProjectId] = useState(initialProject), [participants, setParticipants] = useState([]), [collections, setCollections] = useState([]), [executions, setExecutions] = useState([]), [selectedParticipant, setSelectedParticipant] = useState(initialParticipant), [selectedCollections, setSelectedCollections] = useState([]), [age, setAge] = useState(18), [level, setLevel] = useState("base"), [selectedExecution, setSelectedExecution] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");

  useEffect(() => {
    supabase.from("agp_projetos_validacao").select("id,nome,objetivo").order("created_at").then(({data,error}) => { if(error) setError(error.message); else setProjects(data||[]); });
  }, []);

  async function loadProject(id = projectId) {
    if (!id) return;
    setBusy(true); setError("");
    try {
      const [collectionRows, executionRows, participantRows] = await Promise.all([
        listProjectCollections(id), listProjectExecutions(id), supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,ativo,agp_pessoas(nome)").eq("projeto_id", id).eq("funcao_no_projeto", "atleta").eq("ativo", true)
      ]);
      if (participantRows.error) throw participantRows.error;
      setProjectId(id); setCollections(collectionRows || []); setExecutions(executionRows || []); setParticipants(participantRows.data || []);
      if (initialParticipant) setSelectedParticipant(initialParticipant);
      setSelectedCollections([]);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  useEffect(() => { if (initialProject) loadProject(initialProject); }, [initialProject]);
  useEffect(() => { setSelectedCollections([]); }, [selectedParticipant]);

  const eligibleCollections = useMemo(() => collections.filter((item) => String(item.participante_id) === String(selectedParticipant) && item.status === "validada" && item.bloqueada_em && item.liberado_motor_em), [collections, selectedParticipant]);
  function toggleCollection(id) { setSelectedCollections((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function runAnalysis() {
    if (!selectedParticipant || selectedCollections.length === 0) return setError("É necessária ao menos uma evidência validada e liberada ao motor.");
    setBusy(true); setError("");
    try { const result = await executeAnalysis({ participante_id: selectedParticipant, coleta_ids: selectedCollections, idade: Number(age), nivel: level, tipo: "score_global", parametros: {} }); setSelectedExecution(result); await loadProject(projectId); }
    catch (e) { setError(e.message); setBusy(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Análise</span><h1>Gerar leitura a partir de evidências validadas</h1><p>O motor usa somente entradas previamente validadas e liberadas.</p></div><button className="master-button secondary" onClick={() => navigate(initialParticipant ? `/master/atletas/${initialParticipant}` : "/dashboard-master")}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}

    {!contextual && <section className="master-panel"><select className="master-select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelectedParticipant(""); }}><option value="">Selecionar projeto</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.nome||p.objetivo}</option>)}</select><button className="master-button" onClick={() => loadProject()} disabled={!projectId||busy}>Carregar</button></section>}

    {!initialParticipant && projectId && <section className="master-panel"><select className="master-select" value={selectedParticipant} onChange={(e)=>setSelectedParticipant(e.target.value)}><option value="">Selecionar atleta</option>{participants.map((p)=><option key={p.id} value={p.id}>{p.agp_pessoas?.nome||p.pessoa_id}</option>)}</select></section>}

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Entradas disponíveis</span><h2>Evidências prontas para análise</h2></div><strong>{eligibleCollections.length}</strong></div>{eligibleCollections.length===0?<div className="master-empty">Nenhuma evidência validada e liberada ao motor.</div>:<div className="master-action-grid">{eligibleCollections.map((item)=><label key={item.id} className="master-action-card"><input type="checkbox" checked={selectedCollections.includes(item.id)} onChange={()=>toggleCollection(item.id)}/><strong>{item.instrumento_nome||item.instrumento_codigo||"Evidência"}</strong><span>Completude {item.completude??"—"}%</span></label>)}</div>}
    <details><summary>Parâmetros técnicos da execução</summary><div className="master-form-grid"><label>Idade<input type="number" min="5" max="100" value={age} onChange={(e)=>setAge(e.target.value)}/></label><label>Nível<select value={level} onChange={(e)=>setLevel(e.target.value)}><option value="base">Base</option><option value="competitivo">Competitivo</option><option value="elite">Elite</option></select></label></div></details><button className="master-button" onClick={runAnalysis} disabled={busy||selectedCollections.length===0}>{busy?"Processando…":"Gerar análise"}</button></section>

    {selectedExecution && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Resultado</span><h2>Leitura gerada</h2></div><strong>{selectedExecution.status}</strong></div><p>{selectedExecution.explicacao||"Resultado produzido sem explicação textual."}</p><p><strong>Limitações:</strong> {selectedExecution.limitacoes||"Nenhuma registrada."}</p><p><strong>Confiança:</strong> {selectedExecution.confianca??"—"}</p></section>}

    {executions.length>0 && <details className="master-panel"><summary>Histórico de análises</summary>{executions.map((item)=><button key={item.id} className="master-link-button" onClick={()=>setSelectedExecution(item)}>{item.tipo} · {item.status} · {item.versao_motor}</button>)}</details>}
  </div></main>;
}
