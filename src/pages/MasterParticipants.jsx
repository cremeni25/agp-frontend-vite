import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { createInstitutionParticipant, listProjectParticipants } from "../services/participantOnboarding";
import { grantParticipantConsent, listProjectConsents, revokeConsent } from "../services/consentManagement";
import { listProjectBaselines, saveParticipantBaseline } from "../services/baselineManagement";
import { formatEligibilityPending, listProjectEligibility } from "../services/eligibilityManagement";
import { listCanonicalTechnicalTeam } from "../services/technicalTeamManagement";
import "../styles/dashboard-master.css";

const EMPTY_FORM = { nome: "", data_nascimento: "", email_contato: "", telefone_contato: "", papel: "atleta", instituicao_id: "", projeto_id: "", esporte_id: "", modalidade: "", prova_posicao: "", categoria: "", nivel: "", tecnico_responsavel_pessoa_id: "" };
const DEFAULT_CONSENT = { versao_termo: "1.0.0", finalidade: "monitoramento_esportivo", tipo_consentimento: "tratamento_dados_esportivos" };
const EMPTY_BASELINE = { participante_id: "", categoria: "", idade_cronologica: "", sexo_registrado: "", modalidade: "", prova_posicao: "", estagio_maturacional: "", altura_cm: "", massa_kg: "", envergadura_cm: "", data_referencia: new Date().toISOString().slice(0, 10), origem: "avaliacao_institucional", observacoes: "", validar: true };
const SPORT_LEVELS = [
  { value: "SAUDE", label: "Saúde" },
  { value: "COMPETITIVO", label: "Competitivo" },
  { value: "ALTO_RENDIMENTO", label: "Alto rendimento" }
];

function uniqueValues(rows, field) {
  return [...new Set((rows || []).map((item) => String(item?.[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function MasterParticipants() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [technicalTeam, setTechnicalTeam] = useState([]);
  const [sports, setSports] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [sportHistory, setSportHistory] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [consents, setConsents] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [eligibility, setEligibility] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [consentForm, setConsentForm] = useState(DEFAULT_CONSENT);
  const [baselineForm, setBaselineForm] = useState(EMPTY_BASELINE);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [consentWorkingId, setConsentWorkingId] = useState("");
  const [baselineWorking, setBaselineWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBase() {
    setLoading(true); setError("");
    try {
      const [institutionResult, projectResult, sportResult, modalityResult, historyResult, teamRows] = await Promise.all([
        supabase.from("agp_instituicoes").select("id,nome,slug,status").order("nome"),
        supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,objetivo,status").order("created_at"),
        supabase.from("esportes").select("id,nome,slug").order("nome"),
        supabase.from("modalidades").select("id,nome,esporte_id").order("nome"),
        supabase.from("agp_perfis_esportivos").select("modalidade,prova_posicao,categoria,nivel"),
        listCanonicalTechnicalTeam()
      ]);
      const firstError = institutionResult.error || projectResult.error || sportResult.error || modalityResult.error || historyResult.error;
      if (firstError) throw firstError;
      setInstitutions(institutionResult.data || []);
      setProjects(projectResult.data || []);
      setSports(sportResult.data || []);
      setModalities(modalityResult.data || []);
      setSportHistory(historyResult.data || []);
      setTechnicalTeam(teamRows || []);
    } catch (requestError) {
      setError(`Falha ao carregar estrutura institucional: ${requestError.message}`);
      setInstitutions([]); setProjects([]); setSports([]); setModalities([]); setSportHistory([]); setTechnicalTeam([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBase(); }, []);

  const availableProjects = useMemo(() => projects.filter((item) => !form.instituicao_id || item.instituicao_id === form.instituicao_id), [projects, form.instituicao_id]);
  const availableModalities = useMemo(() => modalities.filter((item) => !form.esporte_id || String(item.esporte_id) === String(form.esporte_id)), [modalities, form.esporte_id]);
  const categories = useMemo(() => uniqueValues(sportHistory, "categoria"), [sportHistory]);
  const positions = useMemo(() => uniqueValues(sportHistory.filter((item) => !form.modalidade || item.modalidade === form.modalidade), "prova_posicao"), [sportHistory, form.modalidade]);
  const technicians = useMemo(() => technicalTeam.filter((item) => item.ativo && item.pessoa_id && (!form.instituicao_id || item.instituicao_id === form.instituicao_id)), [technicalTeam, form.instituicao_id]);
  const athletes = useMemo(() => participants.filter((item) => item.funcao_no_projeto === "atleta" && item.ativo), [participants]);
  const consentByParticipant = useMemo(() => Object.fromEntries(consents.filter((item) => item.participante_id).map((item) => [item.participante_id, item])), [consents]);
  const baselineByParticipant = useMemo(() => Object.fromEntries(baselines.filter((item) => item.participante_id).map((item) => [item.participante_id, item])), [baselines]);
  const eligibilityByParticipant = useMemo(() => Object.fromEntries(eligibility.map((item) => [item.participante_id, item])), [eligibility]);

  async function loadParticipants(projectId) {
    if (!projectId) { setParticipants([]); setConsents([]); setBaselines([]); setEligibility([]); return; }
    try {
      const [participantRows, consentRows, baselineRows, eligibilityRows] = await Promise.all([
        listProjectParticipants(projectId), listProjectConsents(projectId), listProjectBaselines(projectId), listProjectEligibility(projectId)
      ]);
      setParticipants(participantRows || []); setConsents(consentRows || []); setBaselines(baselineRows || []); setEligibility(eligibilityRows || []);
    } catch (requestError) {
      setParticipants([]); setConsents([]); setBaselines([]); setEligibility([]); setError(`Falha ao carregar participantes: ${requestError.message}`);
    }
  }

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "instituicao_id") { next.projeto_id = ""; next.tecnico_responsavel_pessoa_id = ""; setParticipants([]); setConsents([]); setBaselines([]); setEligibility([]); }
      if (field === "esporte_id") { next.modalidade = ""; next.prova_posicao = ""; }
      if (field === "modalidade") next.prova_posicao = "";
      return next;
    });
  }

  async function handleProjectChange(projectId) {
    updateField("projeto_id", projectId); setBaselineForm(EMPTY_BASELINE); setMessage(""); setError(""); await loadParticipants(projectId);
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.instituicao_id) return setError("Selecione a instituição.");
    if (form.papel === "atleta" && !form.esporte_id) return setError("Selecione o esporte do atleta.");
    if (form.papel === "atleta" && !form.modalidade) return setError("Selecione a modalidade do atleta.");
    setWorking(true); setMessage(""); setError("");
    const selectedSport = sports.find((item) => String(item.id) === String(form.esporte_id));
    const payload = {
      nome: form.nome.trim(), data_nascimento: form.data_nascimento || null, email_contato: form.email_contato || null, telefone_contato: form.telefone_contato || null,
      papel: form.papel, projeto_id: form.projeto_id || null, tecnico_responsavel_pessoa_id: form.papel === "atleta" ? form.tecnico_responsavel_pessoa_id || null : null,
      escopo: {}, acesso: form.email_contato ? { email_acesso: form.email_contato } : null,
      perfil_esportivo: form.papel === "atleta" ? {
        modalidade: form.modalidade,
        prova_posicao: form.prova_posicao || null,
        categoria: form.categoria || null,
        nivel: form.nivel || null,
        dados_complementares: { esporte_id: form.esporte_id, esporte_nome: selectedSport?.nome || null, esporte_slug: selectedSport?.slug || null }
      } : null
    };
    try {
      const result = await createInstitutionParticipant(form.instituicao_id, payload);
      setMessage(`Participante criado. Estado: ${result.status_onboarding}.`);
      const retained = { instituicao_id: form.instituicao_id, projeto_id: form.projeto_id };
      setForm({ ...EMPTY_FORM, ...retained }); await loadParticipants(retained.projeto_id);
    } catch (requestError) { setError(`Falha no onboarding: ${requestError.message}`); } finally { setWorking(false); }
  }

  async function grantConsent(participant) {
    setConsentWorkingId(participant.participante_id); setMessage(""); setError("");
    try {
      await grantParticipantConsent(participant.participante_id, { ...consentForm, escopo: { coleta_prontidao_diaria: true, analise_longitudinal: true, uso_institucional: true } });
      setMessage(`Consentimento registrado para ${participant.nome}.`); await loadParticipants(form.projeto_id);
    } catch (requestError) { setError(`Falha ao registrar consentimento: ${requestError.message}`); } finally { setConsentWorkingId(""); }
  }

  async function revokeParticipantConsent(participant, consent) {
    if (!consent?.consentimento_id) return setError("Consentimento vigente não localizado.");
    setConsentWorkingId(participant.participante_id); setMessage(""); setError("");
    try { await revokeConsent(consent.consentimento_id); setMessage(`Consentimento revogado para ${participant.nome}.`); await loadParticipants(form.projeto_id); }
    catch (requestError) { setError(`Falha ao revogar consentimento: ${requestError.message}`); } finally { setConsentWorkingId(""); }
  }

  function selectBaselineAthlete(participantId) {
    const athlete = athletes.find((item) => item.participante_id === participantId);
    const current = baselineByParticipant[participantId];
    setBaselineForm({ ...EMPTY_BASELINE, participante_id: participantId, categoria: current?.categoria || athlete?.categoria || "", idade_cronologica: current?.idade_cronologica || "", sexo_registrado: current?.sexo_registrado || "", modalidade: current?.modalidade || athlete?.modalidade || "", prova_posicao: current?.prova_posicao || athlete?.prova_posicao || "", estagio_maturacional: current?.estagio_maturacional || "", altura_cm: current?.altura_cm || "", massa_kg: current?.massa_kg || "", envergadura_cm: current?.envergadura_cm || "", data_referencia: current?.data_referencia || new Date().toISOString().slice(0, 10), origem: current?.origem || "avaliacao_institucional", observacoes: current?.observacoes || "", validar: true });
  }

  async function submitBaseline(event) {
    event.preventDefault();
    if (!baselineForm.participante_id) return setError("Selecione o atleta da linha de base.");
    setBaselineWorking(true); setMessage(""); setError("");
    try {
      const payload = { ...baselineForm, idade_cronologica: Number(baselineForm.idade_cronologica), altura_cm: Number(baselineForm.altura_cm), massa_kg: Number(baselineForm.massa_kg), envergadura_cm: baselineForm.envergadura_cm ? Number(baselineForm.envergadura_cm) : null };
      delete payload.participante_id;
      const result = await saveParticipantBaseline(baselineForm.participante_id, payload);
      setMessage(`Linha de base registrada com ${result.completude}% de completude. Estado: ${result.status_onboarding}.`);
      await loadParticipants(form.projeto_id);
    } catch (requestError) { setError(`Falha ao registrar linha de base: ${requestError.message}`); } finally { setBaselineWorking(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Governança institucional</span><h1>Central de Participantes</h1><p>Identidade, consentimento, linha de base e elegibilidade oficial em um fluxo auditável.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

    <section className="master-content-grid">
      <form className="master-panel" onSubmit={submit}>
        <div className="master-section-heading"><div><span className="master-eyebrow">Novo cadastro</span><h2>Onboarding institucional</h2></div></div>
        <input className="master-input" required minLength="2" placeholder="Nome completo" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
        <div className="master-toolbar"><input className="master-input" type="date" value={form.data_nascimento} onChange={(e) => updateField("data_nascimento", e.target.value)} /><select className="master-select" value={form.papel} onChange={(e) => updateField("papel", e.target.value)}><option value="atleta">Atleta</option><option value="tecnico">Técnico</option><option value="treinador">Treinador</option><option value="preparador_fisico">Preparador físico</option><option value="medico">Médico</option><option value="fisioterapeuta">Fisioterapeuta</option><option value="psicologo">Psicólogo</option><option value="nutricionista">Nutricionista</option><option value="gestor">Gestor</option><option value="analista">Analista</option><option value="responsavel_legal">Responsável legal</option></select></div>
        <input className="master-input" type="email" placeholder="E-mail de contato e futuro acesso" value={form.email_contato} onChange={(e) => updateField("email_contato", e.target.value)} /><input className="master-input" placeholder="Telefone" value={form.telefone_contato} onChange={(e) => updateField("telefone_contato", e.target.value)} />
        <select className="master-select" required value={form.instituicao_id} onChange={(e) => updateField("instituicao_id", e.target.value)}><option value="">Selecionar instituição</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
        <select className="master-select" value={form.projeto_id} onChange={(e) => handleProjectChange(e.target.value)}><option value="">Sem projeto por enquanto</option>{availableProjects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo || item.id}</option>)}</select>
        {form.papel === "atleta" && <>
          <select className="master-select" required value={form.esporte_id} onChange={(e) => updateField("esporte_id", e.target.value)}><option value="">Selecionar esporte</option>{sports.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
          <select className="master-select" required disabled={!form.esporte_id} value={form.modalidade} onChange={(e) => updateField("modalidade", e.target.value)}><option value="">Selecionar modalidade</option>{availableModalities.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}</select>
          <div className="master-toolbar">
            <input className="master-input" list="agp-provas-posicoes" placeholder="Prova ou posição" value={form.prova_posicao} onChange={(e) => updateField("prova_posicao", e.target.value)} />
            <input className="master-input" list="agp-categorias" placeholder="Categoria" value={form.categoria} onChange={(e) => updateField("categoria", e.target.value)} />
          </div>
          <datalist id="agp-provas-posicoes">{positions.map((value) => <option key={value} value={value} />)}</datalist>
          <datalist id="agp-categorias">{categories.map((value) => <option key={value} value={value} />)}</datalist>
          <select className="master-select" required value={form.nivel} onChange={(e) => updateField("nivel", e.target.value)}><option value="">Selecionar nível esportivo</option>{SPORT_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <select className="master-select" value={form.tecnico_responsavel_pessoa_id} onChange={(e) => updateField("tecnico_responsavel_pessoa_id", e.target.value)}><option value="">Técnico responsável ainda não definido</option>{technicians.map((item) => <option key={item.pessoa_id} value={item.pessoa_id}>{item.nome} · {item.instituicao?.nome || "Instituição"}</option>)}</select>
        </>}
        <button className="master-button" disabled={working || loading}>{working ? "Registrando..." : "Cadastrar participante"}</button>
      </form>
      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Consentimento operacional</span><h2>Termo vigente</h2></div></div><label>Versão do termo<input className="master-input" value={consentForm.versao_termo} onChange={(e) => setConsentForm((current) => ({ ...current, versao_termo: e.target.value }))} /></label><label>Finalidade<input className="master-input" value={consentForm.finalidade} onChange={(e) => setConsentForm((current) => ({ ...current, finalidade: e.target.value }))} /></label><p>A situação de coleta e análise é calculada exclusivamente pela regra unificada do backend.</p></article>
    </section>

    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Projeto selecionado</span><h2>Elegibilidade oficial dos participantes</h2></div><strong>{participants.length}</strong></div>
      {!form.projeto_id ? <div className="master-empty">Selecione um projeto para consultar sua composição.</div> : participants.length === 0 ? <div className="master-empty">Nenhum participante canônico registrado neste projeto.</div> : <ul className="master-activity-list">{participants.map((item) => {
        const consent = consentByParticipant[item.participante_id]; const baseline = baselineByParticipant[item.participante_id]; const isAthlete = item.funcao_no_projeto === "atleta";
        const state = eligibilityByParticipant[item.participante_id] || { apto_coleta: false, apto_analise: false, pendencias: ["elegibilidade_indisponivel"] };
        const pending = formatEligibilityPending(state.pendencias || []);
        return <li key={item.participante_id}><div><strong>{item.nome}</strong><span>{item.funcao_no_projeto} · coleta {state.apto_coleta ? "liberada" : "bloqueada"} · análise {state.apto_analise ? "liberada" : "bloqueada"}</span>{isAthlete && pending.length > 0 && <small>Pendências: {pending.join(" · ")}</small>}</div><div className="master-toolbar"><b>{state.apto_analise ? "Apto" : state.apto_coleta ? "Só coleta" : item.ativo ? "Bloqueado" : "Inativo"}</b>{isAthlete && (consent?.vigente ? <button className="master-button danger" disabled={consentWorkingId === item.participante_id} onClick={() => revokeParticipantConsent(item, consent)}>Revogar</button> : <button className="master-button" disabled={consentWorkingId === item.participante_id} onClick={() => grantConsent(item)}>Conceder consentimento</button>)}{isAthlete && <button className="master-button secondary" onClick={() => selectBaselineAthlete(item.participante_id)}>{baseline?.vigente ? "Atualizar linha de base" : "Registrar linha de base"}</button>}</div></li>;
      })}</ul>}
    </section>

    <form className="master-panel" onSubmit={submitBaseline}>
      <div className="master-section-heading"><div><span className="master-eyebrow">Parâmetros iniciais</span><h2>Linha de base do atleta</h2></div><strong>{baselineForm.participante_id ? "Selecionado" : "Pendente"}</strong></div>
      <select className="master-select" required value={baselineForm.participante_id} onChange={(e) => selectBaselineAthlete(e.target.value)}><option value="">Selecionar atleta</option>{athletes.map((item) => <option key={item.participante_id} value={item.participante_id}>{item.nome}</option>)}</select>
      <div className="master-toolbar"><input className="master-input" list="agp-categorias" required placeholder="Categoria" value={baselineForm.categoria} onChange={(e) => setBaselineForm({ ...baselineForm, categoria: e.target.value })} /><input className="master-input" required type="number" min="1" max="120" step="0.01" placeholder="Idade cronológica" value={baselineForm.idade_cronologica} onChange={(e) => setBaselineForm({ ...baselineForm, idade_cronologica: e.target.value })} /><select className="master-select" required value={baselineForm.sexo_registrado} onChange={(e) => setBaselineForm({ ...baselineForm, sexo_registrado: e.target.value })}><option value="">Sexo registrado</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option><option value="outro">Outro</option></select></div>
      <div className="master-toolbar"><select className="master-select" required value={baselineForm.modalidade} onChange={(e) => setBaselineForm({ ...baselineForm, modalidade: e.target.value })}><option value="">Selecionar modalidade</option>{modalities.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}</select><input className="master-input" list="agp-provas-posicoes" placeholder="Prova ou posição" value={baselineForm.prova_posicao} onChange={(e) => setBaselineForm({ ...baselineForm, prova_posicao: e.target.value })} /><input className="master-input" placeholder="Estágio maturacional" value={baselineForm.estagio_maturacional} onChange={(e) => setBaselineForm({ ...baselineForm, estagio_maturacional: e.target.value })} /></div>
      <div className="master-toolbar"><input className="master-input" required type="number" min="30" max="260" step="0.1" placeholder="Altura (cm)" value={baselineForm.altura_cm} onChange={(e) => setBaselineForm({ ...baselineForm, altura_cm: e.target.value })} /><input className="master-input" required type="number" min="5" max="400" step="0.1" placeholder="Massa (kg)" value={baselineForm.massa_kg} onChange={(e) => setBaselineForm({ ...baselineForm, massa_kg: e.target.value })} /><input className="master-input" type="number" min="30" max="300" step="0.1" placeholder="Envergadura (cm)" value={baselineForm.envergadura_cm} onChange={(e) => setBaselineForm({ ...baselineForm, envergadura_cm: e.target.value })} /></div>
      <div className="master-toolbar"><input className="master-input" required type="date" value={baselineForm.data_referencia} onChange={(e) => setBaselineForm({ ...baselineForm, data_referencia: e.target.value })} /><input className="master-input" required placeholder="Origem dos dados" value={baselineForm.origem} onChange={(e) => setBaselineForm({ ...baselineForm, origem: e.target.value })} /><label><input type="checkbox" checked={baselineForm.validar} onChange={(e) => setBaselineForm({ ...baselineForm, validar: e.target.checked })} /> Validar imediatamente</label></div>
      <textarea className="master-input" rows="3" placeholder="Observações da avaliação inicial" value={baselineForm.observacoes} onChange={(e) => setBaselineForm({ ...baselineForm, observacoes: e.target.value })} />
      <button className="master-button" disabled={baselineWorking || !baselineForm.participante_id}>{baselineWorking ? "Registrando..." : "Salvar linha de base completa"}</button>
    </form>
  </div></main>;
}