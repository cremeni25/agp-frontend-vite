import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { activateInstrument, createInstrument, createProtocol, listProjectCatalog, listProtocols } from "../services/protocolCatalog";
import "../styles/dashboard-master.css";

const protocolInitial = { instituicao_id: "", codigo: "", nome: "", dominio: "fisico", modalidade: "", categoria: "", versao: "1.0.0", objetivo: "", limites_interpretacao: "", aprovar: true };
const instrumentInitial = { protocolo_id: "", codigo: "", nome: "", descricao: "", versao: "1.0.0", tipo: "questionario", respondente: "atleta", periodicidade: "diaria", aprovar: true };
const activationInitial = { instrumento_id: "", instituicao_id: "", projeto_id: "", modalidade: "", categoria: "", versao_configuracao: "1.0.0", obrigatorio: true, ordem: 0, periodicidade_override: "", data_inicio: new Date().toISOString().slice(0, 10), data_fim: "" };

export default function MasterProtocolCatalog() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [protocolForm, setProtocolForm] = useState(protocolInitial);
  const [instrumentForm, setInstrumentForm] = useState(instrumentInitial);
  const [activationForm, setActivationForm] = useState(activationInitial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    const [institutionResult, projectResult] = await Promise.all([
      supabase.from("agp_instituicoes").select("id,nome").order("nome"),
      supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,objetivo").order("created_at")
    ]);
    if (institutionResult.error || projectResult.error) setError((institutionResult.error || projectResult.error).message);
    setInstitutions(institutionResult.data || []);
    setProjects(projectResult.data || []);
    try { setProtocols(await listProtocols()); } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { load(); }, []);

  async function submitProtocol(event) {
    event.preventDefault(); setWorking(true); setMessage(""); setError("");
    try {
      await createProtocol({ ...protocolForm, instituicao_id: protocolForm.instituicao_id || null, modalidade: protocolForm.modalidade || null, categoria: protocolForm.categoria || null, limites_interpretacao: protocolForm.limites_interpretacao || null, criterios: {} });
      setMessage("Protocolo cadastrado com governança de versão e aprovação."); setProtocolForm(protocolInitial); await load();
    } catch (requestError) { setError(requestError.message); } finally { setWorking(false); }
  }

  async function submitInstrument(event) {
    event.preventDefault(); setWorking(true); setMessage(""); setError("");
    try {
      const result = await createInstrument({ ...instrumentForm, descricao: instrumentForm.descricao || null, periodicidade: instrumentForm.periodicidade || null, schema_campos: {}, regra_completude: {} });
      setActivationForm((current) => ({ ...current, instrumento_id: result.id || "" }));
      setMessage("Instrumento cadastrado. A ativação institucional ou por projeto pode ser concluída abaixo."); setInstrumentForm(instrumentInitial);
    } catch (requestError) { setError(requestError.message); } finally { setWorking(false); }
  }

  async function submitActivation(event) {
    event.preventDefault(); setWorking(true); setMessage(""); setError("");
    try {
      await activateInstrument({ ...activationForm, instituicao_id: activationForm.instituicao_id || null, projeto_id: activationForm.projeto_id || null, modalidade: activationForm.modalidade || null, categoria: activationForm.categoria || null, periodicidade_override: activationForm.periodicidade_override || null, data_fim: activationForm.data_fim || null, ordem: Number(activationForm.ordem), configuracao: {} });
      setMessage("Instrumento ativado no escopo selecionado.");
      if (activationForm.projeto_id) setCatalog(await listProjectCatalog(activationForm.projeto_id));
    } catch (requestError) { setError(requestError.message); } finally { setWorking(false); }
  }

  async function loadCatalog(projectId) {
    setActivationForm((current) => ({ ...current, projeto_id: projectId }));
    if (!projectId) return setCatalog([]);
    try { setCatalog(await listProjectCatalog(projectId)); } catch (requestError) { setError(requestError.message); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Governança científica</span><h1>Catálogo de Protocolos e Instrumentos</h1><p>Cadastro, aprovação, versionamento e ativação operacional por instituição, projeto, modalidade e categoria.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

    <section className="master-content-grid">
      <form className="master-panel" onSubmit={submitProtocol}><div className="master-section-heading"><div><span className="master-eyebrow">Etapa 1</span><h2>Novo protocolo</h2></div></div>
        <select className="master-select" value={protocolForm.instituicao_id} onChange={(e) => setProtocolForm({ ...protocolForm, instituicao_id: e.target.value })}><option value="">Protocolo global</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
        <div className="master-toolbar"><input className="master-input" required placeholder="Código" value={protocolForm.codigo} onChange={(e) => setProtocolForm({ ...protocolForm, codigo: e.target.value })}/><input className="master-input" required placeholder="Nome" value={protocolForm.nome} onChange={(e) => setProtocolForm({ ...protocolForm, nome: e.target.value })}/><input className="master-input" required placeholder="Versão" value={protocolForm.versao} onChange={(e) => setProtocolForm({ ...protocolForm, versao: e.target.value })}/></div>
        <div className="master-toolbar"><input className="master-input" required placeholder="Domínio científico" value={protocolForm.dominio} onChange={(e) => setProtocolForm({ ...protocolForm, dominio: e.target.value })}/><input className="master-input" placeholder="Modalidade" value={protocolForm.modalidade} onChange={(e) => setProtocolForm({ ...protocolForm, modalidade: e.target.value })}/><input className="master-input" placeholder="Categoria" value={protocolForm.categoria} onChange={(e) => setProtocolForm({ ...protocolForm, categoria: e.target.value })}/></div>
        <textarea className="master-input" required rows="3" placeholder="Objetivo" value={protocolForm.objetivo} onChange={(e) => setProtocolForm({ ...protocolForm, objetivo: e.target.value })}/><textarea className="master-input" rows="3" placeholder="Limites de interpretação" value={protocolForm.limites_interpretacao} onChange={(e) => setProtocolForm({ ...protocolForm, limites_interpretacao: e.target.value })}/><label><input type="checkbox" checked={protocolForm.aprovar} onChange={(e) => setProtocolForm({ ...protocolForm, aprovar: e.target.checked })}/> Aprovar e ativar imediatamente</label><button className="master-button" disabled={working}>Salvar protocolo</button>
      </form>

      <form className="master-panel" onSubmit={submitInstrument}><div className="master-section-heading"><div><span className="master-eyebrow">Etapa 2</span><h2>Novo instrumento</h2></div></div>
        <select className="master-select" required value={instrumentForm.protocolo_id} onChange={(e) => setInstrumentForm({ ...instrumentForm, protocolo_id: e.target.value })}><option value="">Selecionar protocolo</option>{protocols.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.versao} · {item.status_catalogo}</option>)}</select>
        <div className="master-toolbar"><input className="master-input" required placeholder="Código" value={instrumentForm.codigo} onChange={(e) => setInstrumentForm({ ...instrumentForm, codigo: e.target.value })}/><input className="master-input" required placeholder="Nome" value={instrumentForm.nome} onChange={(e) => setInstrumentForm({ ...instrumentForm, nome: e.target.value })}/><input className="master-input" required placeholder="Versão" value={instrumentForm.versao} onChange={(e) => setInstrumentForm({ ...instrumentForm, versao: e.target.value })}/></div>
        <div className="master-toolbar"><input className="master-input" required placeholder="Tipo" value={instrumentForm.tipo} onChange={(e) => setInstrumentForm({ ...instrumentForm, tipo: e.target.value })}/><input className="master-input" required placeholder="Respondente" value={instrumentForm.respondente} onChange={(e) => setInstrumentForm({ ...instrumentForm, respondente: e.target.value })}/><input className="master-input" placeholder="Periodicidade" value={instrumentForm.periodicidade} onChange={(e) => setInstrumentForm({ ...instrumentForm, periodicidade: e.target.value })}/></div>
        <textarea className="master-input" rows="3" placeholder="Descrição" value={instrumentForm.descricao} onChange={(e) => setInstrumentForm({ ...instrumentForm, descricao: e.target.value })}/><label><input type="checkbox" checked={instrumentForm.aprovar} onChange={(e) => setInstrumentForm({ ...instrumentForm, aprovar: e.target.checked })}/> Aprovar e ativar no catálogo</label><button className="master-button" disabled={working}>Salvar instrumento</button>
      </form>
    </section>

    <form className="master-panel" onSubmit={submitActivation}><div className="master-section-heading"><div><span className="master-eyebrow">Etapa 3</span><h2>Ativação operacional</h2></div></div>
      <input className="master-input" required placeholder="ID do instrumento" value={activationForm.instrumento_id} onChange={(e) => setActivationForm({ ...activationForm, instrumento_id: e.target.value })}/>
      <div className="master-toolbar"><select className="master-select" value={activationForm.instituicao_id} onChange={(e) => setActivationForm({ ...activationForm, instituicao_id: e.target.value })}><option value="">Sem escopo institucional direto</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><select className="master-select" value={activationForm.projeto_id} onChange={(e) => loadCatalog(e.target.value)}><option value="">Sem projeto específico</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo || item.id}</option>)}</select></div>
      <div className="master-toolbar"><input className="master-input" placeholder="Modalidade" value={activationForm.modalidade} onChange={(e) => setActivationForm({ ...activationForm, modalidade: e.target.value })}/><input className="master-input" placeholder="Categoria" value={activationForm.categoria} onChange={(e) => setActivationForm({ ...activationForm, categoria: e.target.value })}/><input className="master-input" placeholder="Periodicidade adaptada" value={activationForm.periodicidade_override} onChange={(e) => setActivationForm({ ...activationForm, periodicidade_override: e.target.value })}/></div>
      <div className="master-toolbar"><input className="master-input" type="date" required value={activationForm.data_inicio} onChange={(e) => setActivationForm({ ...activationForm, data_inicio: e.target.value })}/><input className="master-input" type="date" value={activationForm.data_fim} onChange={(e) => setActivationForm({ ...activationForm, data_fim: e.target.value })}/><input className="master-input" type="number" min="0" value={activationForm.ordem} onChange={(e) => setActivationForm({ ...activationForm, ordem: e.target.value })}/></div>
      <label><input type="checkbox" checked={activationForm.obrigatorio} onChange={(e) => setActivationForm({ ...activationForm, obrigatorio: e.target.checked })}/> Instrumento obrigatório</label><button className="master-button" disabled={working}>Ativar instrumento</button>
    </form>

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Projeto selecionado</span><h2>Catálogo operacional ativo</h2></div><strong>{catalog.length}</strong></div>{catalog.length === 0 ? <div className="master-empty">Selecione um projeto para consultar suas ativações vigentes.</div> : <ul className="master-activity-list">{catalog.map((item) => <li key={item.ativacao_id || `${item.instrumento_id}-${item.ordem}`}><div><strong>{item.instrumento_nome}</strong><span>{item.protocolo_nome} · {item.dominio} · {item.modalidade || "todas as modalidades"} · {item.categoria || "todas as categorias"}</span></div><b>{item.obrigatorio ? "Obrigatório" : "Opcional"}</b></li>)}</ul>}</section>
  </div></main>;
}
