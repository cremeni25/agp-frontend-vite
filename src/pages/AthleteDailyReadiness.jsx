import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/athlete-readiness.css";

const INITIAL_FORM = {
  sono_horas: "",
  sono_qualidade: "",
  fadiga: "",
  dor: "",
  estresse: "",
  humor: "",
  esforco_percebido: "",
  observacoes: ""
};

const REQUIRED_FIELDS = ["sono_horas", "sono_qualidade", "fadiga", "dor", "estresse", "humor", "esforco_percebido"];

export default function AthleteDailyReadiness() {
  const navigate = useNavigate();
  const { session, perfil } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [instrument, setInstrument] = useState(null);
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
    return Math.round((uniqueDays.size / 7) * 100);
  }, [history]);

  useEffect(() => {
    async function load() {
      if (!athleteId) { setLoading(false); return; }
      setLoading(true); setError("");

      const { data: instrumentData, error: instrumentError } = await supabase
        .from("agp_instrumentos")
        .select("id,nome,versao,protocolo_id")
        .eq("nome", "Questionário Diário de Prontidão AGP")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (instrumentError) {
        setError("Núcleo de evidências ainda não está disponível no banco do AGP.");
        setLoading(false);
        return;
      }
      setInstrument(instrumentData);

      const { data: linkData, error: linkError } = await supabase
        .from("agp_atletas_projeto")
        .select("projeto_id")
        .eq("atleta_id", athleteId)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();

      if (linkError || !linkData?.projeto_id) {
        setProjectId(null);
        setConsent(null);
        setError("Atleta ainda não está vinculado a um projeto ativo de monitoramento.");
        setLoading(false);
        return;
      }

      const currentProjectId = linkData.projeto_id;
      setProjectId(currentProjectId);

      const { data: consentData, error: consentError } = await supabase
        .from("agp_consentimentos")
        .select("id,finalidade,versao_termo,concedido_em,revogado_em")
        .eq("atleta_id", athleteId)
        .eq("projeto_id", currentProjectId)
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
        .eq("atleta_id", athleteId)
        .eq("instrumento_id", instrumentData?.id)
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
    if (!athleteId || !instrument || !projectId) {
      setError("Perfil, projeto ou instrumento de coleta indisponível.");
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
      sono_qualidade: Number(form.sono_qualidade),
      fadiga: Number(form.fadiga),
      dor: Number(form.dor),
      estresse: Number(form.estresse),
      humor: Number(form.humor),
      esforco_percebido: Number(form.esforco_percebido),
      observacoes: form.observacoes.trim() || null
    };

    const { data, error: insertError } = await supabase
      .from("agp_coletas")
      .insert({
        atleta_id: athleteId,
        projeto_id: projectId,
        instrumento_id: instrument.id,
        protocolo_id: instrument.protocolo_id,
        coletado_por_auth_id: session?.user?.id,
        papel_coletor: "atleta",
        data_hora_coleta: now,
        origem: "autodeclarado",
        status: "completa",
        completude: 100,
        confiabilidade: null,
        dados: payload
      })
      .select("id,data_hora_coleta,status,completude,confiabilidade,dados")
      .single();

    if (insertError) {
      const blocked = String(insertError.message || "").includes("CONSENTIMENTO_OBRIGATORIO");
      setError(blocked ? "Coleta bloqueada pelo banco: o consentimento não está vigente." : `Não foi possível registrar a resposta: ${insertError.message}`);
    } else {
      setHistory((current) => [data, ...current]);
      setForm(INITIAL_FORM);
      setMessage("Resposta diária registrada com origem, horário, instrumento, versão e consentimento vigente.");
    }
    setSaving(false);
  }

  if (loading) return <main className="readiness-page"><div className="readiness-shell">Carregando prontidão diária...</div></main>;

  return (
    <main className="readiness-page"><div className="readiness-shell">
      <header className="readiness-header">
        <div><span>Coleta longitudinal</span><h1>Prontidão diária</h1><p>{perfil?.nome || "Atleta"} · resposta autodeclarada e auditável</p></div>
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
        <section className="readiness-form">
          <div className="readiness-error">
            <strong>Questionário indisponível.</strong><br />
            O consentimento para tratamento de dados esportivos e monitoramento longitudinal ainda não está vigente ou foi revogado. Procure a instituição responsável para regularização.
          </div>
        </section>
      ) : (
        <form className="readiness-form" onSubmit={submit}>
          <section><h2>Recuperação e percepção</h2><div className="readiness-grid">
            <label>Horas de sono<input type="number" min="0" max="16" step="0.1" value={form.sono_horas} onChange={(e) => updateField("sono_horas", e.target.value)} required /></label>
            <ScaleField label="Qualidade do sono" value={form.sono_qualidade} onChange={(value) => updateField("sono_qualidade", value)} />
            <ScaleField label="Fadiga" value={form.fadiga} onChange={(value) => updateField("fadiga", value)} />
            <ScaleField label="Dor" value={form.dor} onChange={(value) => updateField("dor", value)} />
            <ScaleField label="Estresse" value={form.estresse} onChange={(value) => updateField("estresse", value)} />
            <ScaleField label="Humor" value={form.humor} onChange={(value) => updateField("humor", value)} />
            <ScaleField label="Esforço percebido" value={form.esforco_percebido} onChange={(value) => updateField("esforco_percebido", value)} />
            <label className="readiness-notes">Observações<textarea rows="4" value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Dor localizada, mudança de rotina, competição, medicação informada à equipe ou outro contexto relevante." /></label>
          </div></section>
          <button className="readiness-submit" disabled={saving || completion < 100 || !instrument || !consentActive}>{saving ? "Registrando..." : "Registrar resposta diária"}</button>
        </form>
      )}

      <section className="readiness-history">
        <div><span>Rastreabilidade</span><h2>Últimos sete dias</h2></div>
        {history.length === 0 ? <p>Nenhuma resposta real registrada. O sistema permanece em dados insuficientes.</p> : <ul>{history.map((item) => <li key={item.id}><div><strong>{new Date(item.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>{item.status} · completude {item.completude}%</span></div><b>{item.confiabilidade == null ? "Aguardando validação" : `Confiança ${item.confiabilidade}%`}</b></li>)}</ul>}
      </section>
    </div></main>
  );
}

function ScaleField({ label, value, onChange }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Selecionar</option>{Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <option key={number} value={number}>{number}</option>)}</select><small>Escala de 1 a 10</small></label>;
}
