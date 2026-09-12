import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/athlete-readiness.css";

const INITIAL_FORM = {
  sono_horas: "",
  qualidade_sono: "",
  fadiga: "",
  dor: "",
  estresse: "",
  humor: "",
  rpe_ultima_sessao: "",
  observacao: ""
};

const REQUIRED_FIELDS = ["sono_horas", "qualidade_sono", "fadiga", "dor", "estresse", "humor", "rpe_ultima_sessao"];

export default function AthleteDailyReadiness() {
  const navigate = useNavigate();
  const { session, perfil } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [instrument, setInstrument] = useState(null);
  const [activation, setActivation] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [consent, setConsent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const athleteId = perfil?.id;
  const consentActive = Boolean(consent?.id && !consent?.revogado_em);

  const completion = useMemo(() => {
    const completed = REQUIRED_FIELDS.filter((field) => String(form[field]).trim() !== "").length;
    return Math.round((completed / REQUIRED_FIELDS.length) * 100);
  }, [form]);

  const adherence = useMemo(() => {
    const uniqueDays = new Set(history.map((item) => new Date(item.data_hora_coleta).toISOString().slice(0, 10)));
    return Math.min(100, Math.round((uniqueDays.size / 7) * 100));
  }, [history]);

  useEffect(() => {
    async function load() {
      if (!athleteId) { setLoading(false); return; }
      setLoading(true); setError("");

      const { data: instrumentData, error: instrumentError } = await supabase
        .from("agp_instrumentos")
        .select("id,nome,versao,protocolo_id,schema_campos,regra_completude,status_catalogo")
        .eq("nome", "Questionário Diário de Prontidão AGP")
        .eq("ativo", true)
        .eq("status_catalogo", "aprovado")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (instrumentError || !instrumentData) {
        setError("Instrumento de prontidão diária ainda não está disponível no núcleo científico do AGP.");
        setLoading(false);
        return;
      }
      setInstrument(instrumentData);

      const { data: participantData, error: participantError } = await supabase
        .from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,legacy_perfil_atleta_id,status_onboarding,ativo")
        .eq("legacy_perfil_atleta_id", athleteId)
        .eq("funcao_no_projeto", "atleta")
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();

      if (participantError || !participantData?.projeto_id) {
        setParticipant(null);
        setProjectId(null);
        setError("Atleta ainda não possui vínculo canônico ativo em um projeto do AGP.");
        setLoading(false);
        return;
      }

      setParticipant(participantData);
      setProjectId(participantData.projeto_id);

      const { data: activationData, error: activationError } = await supabase
        .from("agp_ativacoes_instrumentos")
        .select("id,instrumento_id,projeto_id,versao_configuracao,data_inicio,data_fim,ativo,aprovado_em")
        .eq("instrumento_id", instrumentData.id)
        .eq("projeto_id", participantData.projeto_id)
        .eq("ativo", true)
        .not("aprovado_em", "is", null)
        .limit(1)
        .maybeSingle();

      if (activationError || !activationData) {
        setActivation(null);
        setError("O instrumento existe, mas não está ativado para o projeto atual deste atleta.");
        setLoading(false);
        return;
      }
      setActivation(activationData);

      const { data: consentData, error: consentError } = await supabase
        .from("agp_consentimentos")
        .select("id,finalidade,versao_termo,concedido_em,revogado_em")
        .eq("atleta_id", athleteId)
        .eq("projeto_id", participantData.projeto_id)
        .eq("finalidade", "monitoramento_esportivo")
        .is("revogado_em", null)
        .order("concedido_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (consentError) {
        setConsent(null);
        setError("Não foi possível confirmar o consentimento operacional deste atleta.");
        setLoading(false);
        return;
      }
      setConsent(consentData || null);

      const from = new Date();
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);

      const { data: historyData, error: historyError } = await supabase
        .from("agp_coletas")
        .select("id,data_hora_coleta,status,completude,confiabilidade,dados")
        .eq("participante_id", participantData.id)
        .eq("instrumento_id", instrumentData.id)
        .gte("data_hora_coleta", from.toISOString())
        .order("data_hora_coleta", { ascending: false });

      if (historyError) setError(`Falha ao carregar histórico: ${historyError.message}`);
      setHistory(historyData || []);
      setLoading(false);
    }
    load();
  }, [athleteId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(""); setError("");

    if (!consentActive) {
      setError("Coleta bloqueada: não existe consentimento vigente para monitoramento esportivo.");
      return;
    }
    if (!athleteId || !instrument || !activation || !participant || !projectId) {
      setError("Perfil, participante, projeto ou instrumento de coleta indisponível.");
      return;
    }
    if (completion < 100) {
      setError("Preencha todos os campos obrigatórios antes de registrar.");
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const payload = {
      sono_horas: Number(form.sono_horas),
      qualidade_sono: Number(form.qualidade_sono),
      fadiga: Number(form.fadiga),
      dor: Number(form.dor),
      estresse: Number(form.estresse),
      humor: Number(form.humor),
      rpe_ultima_sessao: Number(form.rpe_ultima_sessao),
      observacao: form.observacao.trim() || null
    };

    const { data, error: insertError } = await supabase
      .from("agp_coletas")
      .insert({
        participante_id: participant.id,
        atleta_id: athleteId,
        projeto_id: projectId,
        instrumento_id: instrument.id,
        protocolo_id: instrument.protocolo_id,
        ativacao_instrumento_id: activation.id,
        versao_instrumento: instrument.versao,
        versao_schema: activation.versao_configuracao || instrument.versao || "1.0.0",
        coletado_por_auth_id: session?.user?.id,
        papel_coletor: "atleta",
        data_hora_coleta: now,
        iniciado_em: now,
        submetido_em: now,
        origem: "autodeclarado",
        status: "completa",
        dados: payload
      })
      .select("id,data_hora_coleta,status,completude,confiabilidade,dados")
      .single();

    if (insertError) {
      const text = String(insertError.message || "");
      const consentBlocked = text.includes("CONSENTIMENTO") || text.includes("consentimento");
      const eligibilityBlocked = text.includes("ELEGIBILIDADE_COLETA_NEGADA");
      setError(consentBlocked
        ? "Coleta bloqueada pelo AGP: o consentimento não está vigente."
        : eligibilityBlocked
          ? "Coleta bloqueada pelo AGP: existe uma pendência operacional na elegibilidade deste atleta."
          : `Não foi possível registrar a resposta: ${text}`);
    } else {
      setHistory((current) => [data, ...current]);
      setForm(INITIAL_FORM);
      setMessage("Resposta diária registrada. Ela entra como evidência completa e aguarda validação antes de alimentar resultados finais do motor.");
    }
    setSaving(false);
  }

  if (loading) return <main className="readiness-page"><div className="readiness-shell">Carregando prontidão diária...</div></main>;

  return (
    <main className="readiness-page"><div className="readiness-shell">
      <header className="readiness-header">
        <div><span>Inteligência longitudinal individual</span><h1>Como você está hoje?</h1><p>{perfil?.nome || "Atleta"} · menos de dois minutos para alimentar sua própria linha de evolução</p></div>
        <button type="button" onClick={() => navigate("/dashboard-atleta")}>Voltar</button>
      </header>

      {message && <div className="readiness-success">{message}</div>}
      {error && <div className="readiness-error">{error}</div>}

      <section className="readiness-summary">
        <article><span>Instrumento</span><strong>{instrument?.nome || "Indisponível"}</strong><small>Versão {instrument?.versao || "—"}</small></article>
        <article><span>Consentimento</span><strong>{consentActive ? "Vigente" : "Pendente"}</strong><small>{consentActive ? `Termo ${consent.versao_termo}` : "Coleta bloqueada"}</small></article>
        <article><span>Adesão em 7 dias</span><strong>{adherence}%</strong><small>{history.length} resposta(s) registrada(s)</small></article>
      </section>

      {!consentActive ? (
        <section className="readiness-form"><div className="readiness-error"><strong>Questionário indisponível.</strong><br />O consentimento para monitoramento longitudinal ainda não está vigente ou foi revogado.</div></section>
      ) : (
        <form className="readiness-form" onSubmit={submit}>
          <section><h2>Recuperação, corpo e contexto</h2><div className="readiness-grid">
            <label>Horas de sono<input type="number" min="0" max="16" step="0.1" value={form.sono_horas} onChange={(e) => updateField("sono_horas", e.target.value)} required /></label>
            <ScaleField label="Qualidade do sono" min={1} max={5} value={form.qualidade_sono} onChange={(value) => updateField("qualidade_sono", value)} />
            <ScaleField label="Fadiga" min={1} max={5} value={form.fadiga} onChange={(value) => updateField("fadiga", value)} />
            <ScaleField label="Dor" min={0} max={10} value={form.dor} onChange={(value) => updateField("dor", value)} />
            <ScaleField label="Estresse" min={1} max={5} value={form.estresse} onChange={(value) => updateField("estresse", value)} />
            <ScaleField label="Humor" min={1} max={5} value={form.humor} onChange={(value) => updateField("humor", value)} />
            <ScaleField label="Esforço da última sessão" min={0} max={10} value={form.rpe_ultima_sessao} onChange={(value) => updateField("rpe_ultima_sessao", value)} />
            <label className="readiness-notes">Algo relevante hoje?<textarea rows="4" value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} placeholder="Dor localizada, mudança de rotina, competição, viagem ou outro contexto que sua equipe deveria considerar." /></label>
          </div></section>
          <button className="readiness-submit" disabled={saving || completion < 100 || !instrument || !activation || !consentActive}>{saving ? "Registrando..." : "Registrar como estou hoje"}</button>
        </form>
      )}

      <section className="readiness-history">
        <div><span>Sua linha individual</span><h2>Últimos sete dias</h2></div>
        {history.length === 0 ? <p>Nenhuma resposta real registrada. O AGP ainda não fará inferências sobre você.</p> : <ul>{history.map((item) => <li key={item.id}><div><strong>{new Date(item.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>{item.status} · completude {item.completude}%</span></div><b>{item.confiabilidade == null ? "Aguardando validação" : `Confiança ${item.confiabilidade}%`}</b></li>)}</ul>}
      </section>
    </div></main>
  );
}

function ScaleField({ label, min, max, value, onChange }) {
  const options = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Selecionar</option>{options.map((number) => <option key={number} value={number}>{number}</option>)}</select><small>Escala de {min} a {max}</small></label>;
}
