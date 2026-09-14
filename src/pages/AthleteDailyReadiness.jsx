import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/athlete-readiness.css";

const INITIAL_FORM = { sono_horas: "", qualidade_sono: "", fadiga: "", dor: "", estresse: "", humor: "", rpe_ultima_sessao: "", observacao: "" };
const REQUIRED_FIELDS = ["sono_horas", "qualidade_sono", "fadiga", "dor", "estresse", "humor", "rpe_ultima_sessao"];
const GOOD = [
  { value: 1, emoji: "😣", text: "Muito ruim" }, { value: 2, emoji: "🙁", text: "Ruim" }, { value: 3, emoji: "😐", text: "Regular" }, { value: 4, emoji: "🙂", text: "Bom" }, { value: 5, emoji: "😄", text: "Excelente" }
];
const FATIGUE = [
  { value: 1, emoji: "😄", text: "Descansado" }, { value: 2, emoji: "🙂", text: "Pouco cansado" }, { value: 3, emoji: "😐", text: "Moderado" }, { value: 4, emoji: "🙁", text: "Muito cansado" }, { value: 5, emoji: "😣", text: "Exausto" }
];
const STRESS = [
  { value: 1, emoji: "😄", text: "Muito tranquilo" }, { value: 2, emoji: "🙂", text: "Tranquilo" }, { value: 3, emoji: "😐", text: "Moderado" }, { value: 4, emoji: "🙁", text: "Alto" }, { value: 5, emoji: "😣", text: "Muito alto" }
];
const PAIN = [
  { value: 0, emoji: "😄", text: "Sem dor" }, { value: 2, emoji: "🙂", text: "Leve" }, { value: 5, emoji: "😐", text: "Moderada" }, { value: 8, emoji: "🙁", text: "Forte" }, { value: 10, emoji: "😣", text: "Muito forte" }
];
const RPE = [
  { value: 0, emoji: "😄", text: "Muito leve" }, { value: 3, emoji: "🙂", text: "Leve" }, { value: 5, emoji: "😐", text: "Moderado" }, { value: 8, emoji: "🙁", text: "Muito intenso" }, { value: 10, emoji: "😣", text: "Esforço máximo" }
];

export default function AthleteDailyReadiness() {
  const navigate = useNavigate(); const { session, perfil } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM); const [instrument, setInstrument] = useState(null); const [activation, setActivation] = useState(null); const [participant, setParticipant] = useState(null); const [projectId, setProjectId] = useState(null); const [consent, setConsent] = useState(null); const [history, setHistory] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const athleteId = perfil?.legacy_perfil_atleta_id || perfil?.id || null; const canonicalPersonId = perfil?.pessoa_id || null; const canonicalParticipantId = perfil?.participante_id || null; const consentActive = Boolean(consent?.id && !consent?.revogado_em);
  const completion = useMemo(() => Math.round((REQUIRED_FIELDS.filter((field) => String(form[field]).trim() !== "").length / REQUIRED_FIELDS.length) * 100), [form]);

  useEffect(() => { async function load() {
    if (!athleteId || (!canonicalParticipantId && !canonicalPersonId)) { setLoading(false); setError("Seu acesso esportivo ainda está sendo preparado."); return; }
    setLoading(true); setError("");
    const { data: instrumentData, error: instrumentError } = await supabase.from("agp_instrumentos").select("id,nome,versao,protocolo_id").eq("nome", "Questionário Diário de Prontidão AGP").eq("ativo", true).eq("status_catalogo", "aprovado").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (instrumentError || !instrumentData) { setError("A prontidão de hoje ainda não está disponível."); setLoading(false); return; } setInstrument(instrumentData);
    let query = supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id").eq("funcao_no_projeto", "atleta").eq("ativo", true); query = canonicalParticipantId ? query.eq("id", canonicalParticipantId) : query.eq("pessoa_id", canonicalPersonId);
    const { data: participantData, error: participantError } = await query.limit(1).maybeSingle(); if (participantError || !participantData?.projeto_id || (canonicalPersonId && participantData.pessoa_id !== canonicalPersonId)) { setError("Seu vínculo esportivo ainda está sendo preparado."); setLoading(false); return; } setParticipant(participantData); setProjectId(participantData.projeto_id);
    const { data: activationData } = await supabase.from("agp_ativacoes_instrumentos").select("id,versao_configuracao").eq("instrumento_id", instrumentData.id).eq("projeto_id", participantData.projeto_id).eq("ativo", true).not("aprovado_em", "is", null).limit(1).maybeSingle(); if (!activationData) { setError("A prontidão de hoje ainda não está disponível."); setLoading(false); return; } setActivation(activationData);
    const { data: consentData, error: consentError } = await supabase.from("agp_consentimentos").select("id,revogado_em").eq("participante_id", participantData.id).eq("atleta_id", athleteId).eq("projeto_id", participantData.projeto_id).eq("finalidade", "monitoramento_esportivo").is("revogado_em", null).order("concedido_em", { ascending: false }).limit(1).maybeSingle(); if (consentError) { setError("Sua prontidão ainda não pode ser registrada."); setLoading(false); return; } setConsent(consentData || null);
    const from = new Date(); from.setDate(from.getDate() - 6); from.setHours(0,0,0,0); const { data: historyData } = await supabase.from("agp_coletas").select("id,data_hora_coleta,status,completude,confiabilidade,dados").eq("participante_id", participantData.id).eq("instrumento_id", instrumentData.id).gte("data_hora_coleta", from.toISOString()).order("data_hora_coleta", { ascending: false }); setHistory(historyData || []); setLoading(false);
  } load(); }, [athleteId, canonicalPersonId, canonicalParticipantId]);

  function updateField(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event) { event.preventDefault(); setMessage(""); setError(""); if (!consentActive) { setError("Sua prontidão ainda não pode ser registrada. Procure a equipe responsável."); return; } if (!session?.user?.id || !athleteId || !instrument || !activation || !participant || !projectId) { setError("Não foi possível preparar seu registro agora."); return; } if (completion < 100) { setError("Responda todos os itens obrigatórios."); return; }
    setSaving(true); const now = new Date().toISOString(); const payload = { sono_horas: Number(form.sono_horas), qualidade_sono: Number(form.qualidade_sono), fadiga: Number(form.fadiga), dor: Number(form.dor), estresse: Number(form.estresse), humor: Number(form.humor), rpe_ultima_sessao: Number(form.rpe_ultima_sessao), observacao: form.observacao.trim() || null };
    const { data, error: insertError } = await supabase.from("agp_coletas").insert({ participante_id: participant.id, atleta_id: athleteId, projeto_id: projectId, instrumento_id: instrument.id, protocolo_id: instrument.protocolo_id, ativacao_instrumento_id: activation.id, versao_instrumento: instrument.versao, versao_schema: activation.versao_configuracao || instrument.versao || "1.0.0", coletado_por_auth_id: session.user.id, papel_coletor: "atleta", data_hora_coleta: now, iniciado_em: now, submetido_em: now, origem: "autodeclarado", status: "completa", dados: payload }).select("id,data_hora_coleta,status,completude,confiabilidade,dados").single();
    if (insertError) setError("Não foi possível registrar sua prontidão agora. Procure a equipe responsável se o problema continuar."); else { setHistory((current) => [data, ...current]); setForm(INITIAL_FORM); setMessage("Prontidão registrada. Sua equipe já poderá considerar esta informação no acompanhamento."); } setSaving(false);
  }

  if (loading) return <main className="readiness-page"><div className="readiness-shell">Preparando sua prontidão...</div></main>;
  return <main className="readiness-page"><div className="readiness-shell"><header className="readiness-header"><div><span>Hoje</span><h1>Como você está?</h1><p>{perfil?.nome || "Atleta"}, responda pensando em como você se sente agora.</p></div><button type="button" onClick={() => navigate("/dashboard-atleta")}>Voltar</button></header>{message && <div className="readiness-success">{message}</div>}{error && <div className="readiness-error">{error}</div>}
    {consentActive && <form className="readiness-form" onSubmit={submit}><section><div className="readiness-grid"><label>Quantas horas você dormiu?<input type="number" min="0" max="16" step="0.1" value={form.sono_horas} onChange={(e) => updateField("sono_horas", e.target.value)} required /></label><EmojiScale label="Como foi seu sono?" options={GOOD} value={form.qualidade_sono} onChange={(v) => updateField("qualidade_sono",v)} /><EmojiScale label="Quanto cansaço você sente?" options={FATIGUE} value={form.fadiga} onChange={(v) => updateField("fadiga",v)} /><EmojiScale label="Quanto desconforto ou dor você sente?" options={PAIN} value={form.dor} onChange={(v) => updateField("dor",v)} /><EmojiScale label="Como está seu nível de estresse?" options={STRESS} value={form.estresse} onChange={(v) => updateField("estresse",v)} /><EmojiScale label="Como está seu humor?" options={GOOD.map((o)=>({...o,text:o.value===1?'Muito ruim':o.value===2?'Ruim':o.value===3?'Regular':o.value===4?'Bom':'Muito bom'}))} value={form.humor} onChange={(v) => updateField("humor",v)} /><EmojiScale label="Qual foi a intensidade do seu último treino?" options={RPE} value={form.rpe_ultima_sessao} onChange={(v) => updateField("rpe_ultima_sessao",v)} /><label className="readiness-notes">Quer contar algo importante hoje?<textarea rows="4" value={form.observacao} onChange={(e) => updateField("observacao",e.target.value)} placeholder="Opcional" /></label></div></section><button className="readiness-submit" disabled={saving || completion < 100}>{saving ? "Registrando..." : "Registrar prontidão"}</button></form>}
    {history.length > 0 && <details className="readiness-history"><summary>Ver meus últimos registros</summary><ul>{history.map((item) => <li key={item.id}><div><strong>{new Date(item.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>Registro concluído</span></div></li>)}</ul></details>}
  </div></main>;
}
function EmojiScale({ label, options, value, onChange }) { return <fieldset className="emoji-scale"><legend>{label}</legend><div className="emoji-options">{options.map((option)=><button key={option.value} type="button" className={String(value)===String(option.value)?"emoji-option selected":"emoji-option"} aria-pressed={String(value)===String(option.value)} onClick={()=>onChange(String(option.value))}><span className="emoji-face" aria-hidden="true">{option.emoji}</span><span className="emoji-text">{option.text}</span></button>)}</div></fieldset>; }
