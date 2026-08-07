import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { createInstitutionParticipant, listProjectParticipants } from "../services/participantOnboarding";
import { grantParticipantConsent, listProjectConsents, revokeConsent } from "../services/consentManagement";
import { listProjectBaselines, saveParticipantBaseline } from "../services/baselineManagement";
import { assignAthleteTechnician, formatEligibilityPending, listAthleteTechnicianHistory, listProjectEligibility } from "../services/eligibilityManagement";
import { listCanonicalTechnicalTeam } from "../services/technicalTeamManagement";
import "../styles/dashboard-master.css";

const SERVICES = {
  cadastro: { title: "Cadastrar participante", eyebrow: "Onboarding institucional" },
  tecnico: { title: "Técnico responsável", eyebrow: "Vínculo técnico-atleta" },
  consentimento: { title: "Consentimentos", eyebrow: "Consentimento operacional" },
  "linha-base": { title: "Linha de base", eyebrow: "Parâmetros iniciais" },
  elegibilidade: { title: "Elegibilidade", eyebrow: "Situação operacional" }
};

const SPORT_LEVELS = [
  { value: "SAUDE", label: "Saúde" },
  { value: "COMPETITIVO", label: "Competitivo" },
  { value: "ALTO_RENDIMENTO", label: "Alto rendimento" }
];

const SWIM_CATEGORIES = ["Iniciação", "Pré-Mirim", "Mirim I", "Mirim II", "Petiz I", "Petiz II", "Infantil I", "Infantil II", "Juvenil I", "Juvenil II", "Júnior I", "Júnior II", "Sênior", "Master"];

const EMPTY_NEW = { nome: "", data_nascimento: "", email_contato: "", telefone_contato: "", papel: "atleta", instituicao_id: "", projeto_id: "", esporte_id: "", modalidade: "", prova_posicao: "", categoria: "", nivel: "", tecnico_responsavel_pessoa_id: "" };
const EMPTY_BASELINE = { participante_id: "", categoria: "", idade_cronologica: "", sexo_registrado: "", modalidade: "", prova_posicao: "", estagio_maturacional: "", altura_cm: "", massa_kg: "", envergadura_cm: "", data_referencia: new Date().toISOString().slice(0, 10), origem: "avaliacao_institucional", observacoes: "", validar: true };

function baselineFromAthlete(athlete, current) {
  return {
    ...EMPTY_BASELINE,
    participante_id: athlete?.participante_id || "",
    categoria: current?.categoria || athlete?.categoria || "",
    idade_cronologica: current?.idade_cronologica || "",
    sexo_registrado: current?.sexo_registrado || "",
    modalidade: current?.modalidade || athlete?.modalidade || "",
    prova_posicao: current?.prova_posicao || athlete?.prova_posicao || "",
    estagio_maturacional: current?.estagio_maturacional || "",
    altura_cm: current?.altura_cm || "",
    massa_kg: current?.massa_kg || "",
    envergadura_cm: current?.envergadura_cm || "",
    data_referencia: current?.data_referencia || new Date().toISOString().slice(0, 10),
    origem: current?.origem || "avaliacao_institucional",
    observacoes: current?.observacoes || "",
    validar: true
  };
}

export default function MasterParticipantService() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const serviceId = params.get("servico") || "cadastro";
  const service = SERVICES[serviceId] || SERVICES.cadastro;
  const requestedInstitution = params.get("instituicao") || "";
  const requestedProject = params.get("projeto") || "";
  const requestedParticipant = params.get("participante") || "";

  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sports, setSports] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [technicalTeam, setTechnicalTeam] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [consents, setConsents] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [eligibility, setEligibility] = useState([]);
  const [newForm, setNewForm] = useState(EMPTY_NEW);
  const [selectedParticipantId, setSelectedParticipantId] = useState(requestedParticipant);
  const [technicianId, setTechnicianId] = useState("");
  const [history, setHistory] = useState([]);
  const [baselineForm, setBaselineForm] = useState(EMPTY_BASELINE);
  const [consentForm, setConsentForm] = useState({ versao_termo: "1.0.0", finalidade: "monitoramento_esportivo", tipo_consentimento: "tratamento_dados_esportivos" });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const contextInstitution = newForm.instituicao_id || requestedInstitution;
  const contextProject = newForm.projeto_id || requestedProject;
  const athletes = useMemo(() => participants.filter((item) => item.funcao_no_projeto === "atleta" && item.ativo), [participants]);
  const selectedAthlete = useMemo(() => athletes.find((item) => String(item.participante_id) === String(selectedParticipantId)), [athletes, selectedParticipantId]);
  const currentConsent = useMemo(() => consents.find((item) => String(item.participante_id) === String(selectedParticipantId) && item.vigente), [consents, selectedParticipantId]);
  const currentBaseline = useMemo(() => baselines.find((item) => String(item.participante_id) === String(selectedParticipantId) && item.vigente), [baselines, selectedParticipantId]);
  const currentEligibility = useMemo(() => eligibility.find((item) => String(item.participante_id) === String(selectedParticipantId)), [eligibility, selectedParticipantId]);
  const availableProjects = useMemo(() => projects.filter((item) => !newForm.instituicao_id || String(item.instituicao_id) === String(newForm.instituicao_id)), [projects, newForm.instituicao_id]);
  const availableModalities = useMemo(() => modalities.filter((item) => !newForm.esporte_id || String(item.esporte_id) === String(newForm.esporte_id)), [modalities, newForm.esporte_id]);
  const technicians = useMemo(() => technicalTeam.filter((item) => item.ativo && item.pessoa_id && (!contextInstitution || String(item.instituicao_id) === String(contextInstitution))), [technicalTeam, contextInstitution]);

  async function loadProject(projectId, participantId = selectedParticipantId) {
    if (!projectId) { setParticipants([]); setConsents([]); setBaselines([]); setEligibility([]); return; }
    await listProjectEligibility(projectId);
    const [participantRows, consentRows, baselineRows, eligibilityRows] = await Promise.all([
      listProjectParticipants(projectId), listProjectConsents(projectId), listProjectBaselines(projectId), listProjectEligibility(projectId)
    ]);
    setParticipants(participantRows || []);
    setConsents(consentRows || []);
    setBaselines(baselineRows || []);
    setEligibility(eligibilityRows || []);
    const targetId = participantId || requestedParticipant;
    if (targetId) {
      const athlete = (participantRows || []).find((item) => String(item.participante_id) === String(targetId));
      const baseline = (baselineRows || []).find((item) => String(item.participante_id) === String(targetId) && item.vigente);
      if (athlete) {
        setSelectedParticipantId(targetId);
        setTechnicianId(athlete.tecnico_responsavel_pessoa_id || "");
        setBaselineForm(baselineFromAthlete(athlete, baseline));
      }
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      try {
        const [institutionResult, projectResult, sportResult, modalityResult, teamRows] = await Promise.all([
          supabase.from("agp_instituicoes").select("id,nome,status").order("nome"),
          supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,objetivo,status").order("created_at"),
          supabase.from("esportes").select("id,nome,slug").order("nome"),
          supabase.from("modalidades").select("id,nome,esporte_id").order("nome"),
          listCanonicalTechnicalTeam()
        ]);
        const firstError = institutionResult.error || projectResult.error || sportResult.error || modalityResult.error;
        if (firstError) throw firstError;
        const projectRows = projectResult.data || [];
        setInstitutions(institutionResult.data || []); setProjects(projectRows); setSports(sportResult.data || []); setModalities(modalityResult.data || []); setTechnicalTeam(teamRows || []);
        const selectedProject = projectRows.find((item) => String(item.id) === String(requestedProject));
        const institutionId = requestedInstitution || selectedProject?.instituicao_id || "";
        setNewForm((current) => ({ ...current, instituicao_id: institutionId, projeto_id: selectedProject?.id || requestedProject || "" }));
        if (selectedProject?.id || requestedProject) await loadProject(selectedProject?.id || requestedProject, requestedParticipant);
      } catch (requestError) { setError(`Falha ao carregar serviço: ${requestError.message}`); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleProject(projectId) {
    setNewForm((current) => ({ ...current, projeto_id: projectId }));
    setSelectedParticipantId(""); setTechnicianId(""); setHistory([]); setBaselineForm(EMPTY_BASELINE);
    await loadProject(projectId, "");
  }

  function selectAthlete(participantId) {
    setSelectedParticipantId(participantId); setHistory([]);
    const athlete = athletes.find((item) => String(item.participante_id) === String(participantId));
    const baseline = baselines.find((item) => String(item.participante_id) === String(participantId) && item.vigente);
    setTechnicianId(athlete?.tecnico_responsavel_pessoa_id || "");
    setBaselineForm(baselineFromAthlete(athlete, baseline));
  }

  async function submitNew(event) {
    event.preventDefault(); setWorking(true); setMessage(""); setError("");
    try {
      const sport = sports.find((item) => String(item.id) === String(newForm.esporte_id));
      const result = await createInstitutionParticipant(newForm.instituicao_id, {
        nome: newForm.nome.trim(), data_nascimento: newForm.data_nascimento || null, email_contato: newForm.email_contato || null, telefone_contato: newForm.telefone_contato || null,
        papel: newForm.papel, projeto_id: newForm.projeto_id || null, tecnico_responsavel_pessoa_id: newForm.papel === "atleta" ? newForm.tecnico_responsavel_pessoa_id || null : null,
        escopo: {}, acesso: newForm.email_contato ? { email_acesso: newForm.email_contato } : null,
        perfil_esportivo: newForm.papel === "atleta" ? { modalidade: newForm.modalidade, prova_posicao: newForm.prova_posicao || null, categoria: newForm.categoria || null, nivel: newForm.nivel || null, dados_complementares: { esporte_id: newForm.esporte_id, esporte_nome: sport?.nome || null, esporte_slug: sport?.slug || null } } : null
      });
      setMessage(`Participante criado com sucesso. Estado: ${result.status_onboarding}.`);
      await loadProject(newForm.projeto_id, result.participante_id || "");
      setNewForm((current) => ({ ...EMPTY_NEW, instituicao_id: current.instituicao_id, projeto_id: current.projeto_id }));
    } catch (requestError) { setError(`Falha no cadastro: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  async function saveTechnician() {
    if (!selectedParticipantId || !technicianId) return setError("Selecione atleta e técnico.");
    setWorking(true); setMessage(""); setError("");
    try {
      await assignAthleteTechnician(selectedParticipantId, technicianId);
      setMessage(`Técnico responsável atualizado para ${selectedAthlete?.nome || "o atleta"}.`);
      await loadProject(contextProject, selectedParticipantId);
      setHistory(await listAthleteTechnicianHistory(selectedParticipantId));
    } catch (requestError) { setError(`Falha ao vincular técnico: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  async function loadHistory() {
    if (!selectedParticipantId) return;
    try { setHistory(await listAthleteTechnicianHistory(selectedParticipantId)); }
    catch (requestError) { setError(`Falha ao consultar histórico: ${requestError.message}`); }
  }

  async function grantConsent() {
    if (!selectedParticipantId) return setError("Selecione o atleta.");
    setWorking(true); setMessage(""); setError("");
    try {
      await grantParticipantConsent(selectedParticipantId, { ...consentForm, escopo: { coleta_prontidao_diaria: true, analise_longitudinal: true, uso_institucional: true } });
      setMessage(`Consentimento registrado para ${selectedAthlete?.nome || "o atleta"}.`); await loadProject(contextProject, selectedParticipantId);
    } catch (requestError) { setError(`Falha ao registrar consentimento: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  async function revokeCurrentConsent() {
    if (!currentConsent?.consentimento_id) return;
    setWorking(true); setMessage(""); setError("");
    try { await revokeConsent(currentConsent.consentimento_id); setMessage(`Consentimento revogado para ${selectedAthlete?.nome || "o atleta"}.`); await loadProject(contextProject, selectedParticipantId); }
    catch (requestError) { setError(`Falha ao revogar consentimento: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  async function submitBaseline(event) {
    event.preventDefault(); if (!selectedParticipantId) return setError("Selecione o atleta.");
    setWorking(true); setMessage(""); setError("");
    try {
      const payload = { ...baselineForm, idade_cronologica: Number(baselineForm.idade_cronologica), altura_cm: Number(baselineForm.altura_cm), massa_kg: Number(baselineForm.massa_kg), envergadura_cm: baselineForm.envergadura_cm ? Number(baselineForm.envergadura_cm) : null };
      delete payload.participante_id;
      const result = await saveParticipantBaseline(selectedParticipantId, payload);
      setMessage(`Linha de base registrada com ${result.completude}% de completude.`); await loadProject(contextProject, selectedParticipantId);
    } catch (requestError) { setError(`Falha ao registrar linha de base: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  const contextControls = serviceId !== "cadastro" && <section className="master-panel">
    <div className="master-section-heading"><div><span className="master-eyebrow">Contexto</span><h2>Seleção operacional</h2></div></div>
    <div className="master-toolbar">
      <select className="master-select" value={newForm.instituicao_id} onChange={(e) => { setNewForm((c) => ({ ...c, instituicao_id: e.target.value, projeto_id: "" })); setParticipants([]); setSelectedParticipantId(""); }}><option value="">Selecionar instituição</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
      <select className="master-select" value={newForm.projeto_id} onChange={(e) => handleProject(e.target.value)}><option value="">Selecionar projeto</option>{availableProjects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo}</option>)}</select>
      <select className="master-select" value={selectedParticipantId} onChange={(e) => selectAthlete(e.target.value)}><option value="">Selecionar atleta</option>{athletes.map((item) => <option key={item.participante_id} value={item.participante_id}>{item.nome}</option>)}</select>
    </div>
  </section>;

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">{service.eyebrow}</span><h1>{service.title}</h1><p>Serviço isolado da Central de Participantes.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate(`/master/participantes${requestedParticipant ? `?instituicao=${requestedInstitution}&projeto=${requestedProject}&participante=${requestedParticipant}` : ""}`)}>Voltar à Central</button></div></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}
    {loading ? <div className="master-empty">Carregando serviço...</div> : <>
      {contextControls}

      {serviceId === "cadastro" && <form className="master-panel" onSubmit={submitNew}>
        <div className="master-section-heading"><div><span className="master-eyebrow">Novo cadastro</span><h2>Participante</h2></div></div>
        <input className="master-input" required minLength="2" placeholder="Nome completo" value={newForm.nome} onChange={(e) => setNewForm({ ...newForm, nome: e.target.value })} />
        <div className="master-toolbar"><input className="master-input" type="date" value={newForm.data_nascimento} onChange={(e) => setNewForm({ ...newForm, data_nascimento: e.target.value })} /><select className="master-select" value={newForm.papel} onChange={(e) => setNewForm({ ...newForm, papel: e.target.value })}><option value="atleta">Atleta</option><option value="tecnico">Técnico</option><option value="treinador">Treinador</option><option value="preparador_fisico">Preparador físico</option><option value="medico">Médico</option><option value="fisioterapeuta">Fisioterapeuta</option><option value="psicologo">Psicólogo</option><option value="nutricionista">Nutricionista</option><option value="gestor">Gestor</option><option value="analista">Analista</option></select></div>
        <input className="master-input" type="email" placeholder="E-mail de contato" value={newForm.email_contato} onChange={(e) => setNewForm({ ...newForm, email_contato: e.target.value })} />
        <input className="master-input" placeholder="Telefone" value={newForm.telefone_contato} onChange={(e) => setNewForm({ ...newForm, telefone_contato: e.target.value })} />
        <select className="master-select" required value={newForm.instituicao_id} onChange={(e) => setNewForm({ ...newForm, instituicao_id: e.target.value, projeto_id: "" })}><option value="">Selecionar instituição</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
        <select className="master-select" value={newForm.projeto_id} onChange={(e) => setNewForm({ ...newForm, projeto_id: e.target.value })}><option value="">Sem projeto por enquanto</option>{availableProjects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo}</option>)}</select>
        {newForm.papel === "atleta" && <><select className="master-select" required value={newForm.esporte_id} onChange={(e) => setNewForm({ ...newForm, esporte_id: e.target.value, modalidade: "" })}><option value="">Selecionar esporte</option>{sports.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><select className="master-select" required value={newForm.modalidade} onChange={(e) => setNewForm({ ...newForm, modalidade: e.target.value })}><option value="">Selecionar modalidade</option>{availableModalities.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}</select><div className="master-toolbar"><input className="master-input" placeholder="Prova ou posição" value={newForm.prova_posicao} onChange={(e) => setNewForm({ ...newForm, prova_posicao: e.target.value })} /><select className="master-select" value={newForm.categoria} onChange={(e) => setNewForm({ ...newForm, categoria: e.target.value })}><option value="">Selecionar categoria</option>{SWIM_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select><select className="master-select" required value={newForm.nivel} onChange={(e) => setNewForm({ ...newForm, nivel: e.target.value })}><option value="">Selecionar nível</option>{SPORT_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></>}
        <button className="master-button" disabled={working}>{working ? "Salvando..." : "Cadastrar participante"}</button>
      </form>}

      {serviceId === "tecnico" && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Técnico responsável</span><h2>{selectedAthlete?.nome || "Selecione um atleta"}</h2></div></div>{selectedAthlete && <><select className="master-select" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}><option value="">Selecionar técnico</option>{technicians.map((item) => <option key={item.pessoa_id} value={item.pessoa_id}>{item.nome} · {item.papel_canonico || item.papel}</option>)}</select><div className="master-header-actions" style={{ marginTop: 16 }}><button className="master-button" onClick={saveTechnician} disabled={working || !technicianId}>{selectedAthlete.tecnico_responsavel_pessoa_id ? "Alterar técnico" : "Vincular técnico"}</button><button className="master-button secondary" onClick={loadHistory}>Consultar histórico</button></div>{history.length > 0 && <div style={{ marginTop: 20 }}>{history.map((entry) => <p key={entry.id}><strong>{entry.estado_novo?.tecnico_nome || "Técnico"}</strong> · {new Date(entry.created_at).toLocaleString("pt-BR")}<br /><small>{entry.estado_anterior?.tecnico_nome ? `Anterior: ${entry.estado_anterior.tecnico_nome}` : "Primeiro vínculo"}</small></p>)}</div>}</>}</section>}

      {serviceId === "consentimento" && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Consentimento</span><h2>{selectedAthlete?.nome || "Selecione um atleta"}</h2></div><strong>{currentConsent ? "Vigente" : "Pendente"}</strong></div>{selectedAthlete && <><label>Versão do termo<input className="master-input" value={consentForm.versao_termo} onChange={(e) => setConsentForm({ ...consentForm, versao_termo: e.target.value })} /></label><label>Finalidade<input className="master-input" value={consentForm.finalidade} onChange={(e) => setConsentForm({ ...consentForm, finalidade: e.target.value })} /></label>{currentConsent ? <button className="master-button danger" onClick={revokeCurrentConsent} disabled={working}>Revogar consentimento</button> : <button className="master-button" onClick={grantConsent} disabled={working}>Conceder consentimento</button>}</>}</section>}

      {serviceId === "linha-base" && <form className="master-panel" onSubmit={submitBaseline}><div className="master-section-heading"><div><span className="master-eyebrow">Linha de base</span><h2>{selectedAthlete?.nome || "Selecione um atleta"}</h2></div><strong>{currentBaseline ? "Registrada" : "Pendente"}</strong></div>{selectedAthlete && <><div className="master-toolbar"><select className="master-select" required value={baselineForm.categoria} onChange={(e) => setBaselineForm({ ...baselineForm, categoria: e.target.value })}><option value="">Categoria</option>{SWIM_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select><input className="master-input" required type="number" placeholder="Idade cronológica" value={baselineForm.idade_cronologica} onChange={(e) => setBaselineForm({ ...baselineForm, idade_cronologica: e.target.value })} /><select className="master-select" required value={baselineForm.sexo_registrado} onChange={(e) => setBaselineForm({ ...baselineForm, sexo_registrado: e.target.value })}><option value="">Sexo registrado</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option><option value="outro">Outro</option></select></div><div className="master-toolbar"><select className="master-select" required value={baselineForm.modalidade} onChange={(e) => setBaselineForm({ ...baselineForm, modalidade: e.target.value })}><option value="">Modalidade</option>{modalities.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}</select><input className="master-input" placeholder="Prova ou posição" value={baselineForm.prova_posicao} onChange={(e) => setBaselineForm({ ...baselineForm, prova_posicao: e.target.value })} /><input className="master-input" placeholder="Estágio maturacional" value={baselineForm.estagio_maturacional} onChange={(e) => setBaselineForm({ ...baselineForm, estagio_maturacional: e.target.value })} /></div><div className="master-toolbar"><input className="master-input" required type="number" step="0.1" placeholder="Altura (cm)" value={baselineForm.altura_cm} onChange={(e) => setBaselineForm({ ...baselineForm, altura_cm: e.target.value })} /><input className="master-input" required type="number" step="0.1" placeholder="Massa (kg)" value={baselineForm.massa_kg} onChange={(e) => setBaselineForm({ ...baselineForm, massa_kg: e.target.value })} /><input className="master-input" type="number" step="0.1" placeholder="Envergadura (cm)" value={baselineForm.envergadura_cm} onChange={(e) => setBaselineForm({ ...baselineForm, envergadura_cm: e.target.value })} /></div><input className="master-input" type="date" required value={baselineForm.data_referencia} onChange={(e) => setBaselineForm({ ...baselineForm, data_referencia: e.target.value })} /><textarea className="master-input" rows="4" placeholder="Observações" value={baselineForm.observacoes} onChange={(e) => setBaselineForm({ ...baselineForm, observacoes: e.target.value })} /><button className="master-button" disabled={working}>{currentBaseline ? "Atualizar linha de base" : "Salvar linha de base"}</button></>}</form>}

      {serviceId === "elegibilidade" && <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Elegibilidade oficial</span><h2>{selectedAthlete?.nome || "Selecione um atleta"}</h2></div>{currentEligibility && <strong>{currentEligibility.apto_analise ? "Apto" : currentEligibility.apto_coleta ? "Só coleta" : "Bloqueado"}</strong>}</div>{selectedAthlete && currentEligibility && <><p>Coleta: <strong>{currentEligibility.apto_coleta ? "liberada" : "bloqueada"}</strong></p><p>Análise: <strong>{currentEligibility.apto_analise ? "liberada" : "bloqueada"}</strong></p><p>Pendências: {(formatEligibilityPending(currentEligibility.pendencias || [])).join(" · ") || "Nenhuma pendência."}</p></>}</section>}
    </>}
  </div></main>;
}
