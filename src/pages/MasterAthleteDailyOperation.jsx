import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAthleteTrainingSession, getAthleteIndividualIntelligence } from "../services/athleteIntelligence";
import "../styles/dashboard-master.css";
import "../styles/athlete-daily-operation.css";

function localDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
}

const INITIAL = {
  data_hora_inicio: localDateTimeValue(),
  duracao_min: "",
  volume_planejado: "",
  volume_executado: "",
  intensidade_planejada: "",
  intensidade_percebida: "",
  carga_externa: "",
  foco: "",
  contexto: "",
  intercorrencias: ""
};

function numberOrNull(value) {
  return value === "" ? null : Number(value);
}

export default function MasterAthleteDailyOperation() {
  const navigate = useNavigate();
  const { participantId } = useParams();
  const [intelligence, setIntelligence] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setIntelligence(await getAthleteIndividualIntelligence(participantId));
    } catch (requestError) {
      setError(`Falha ao carregar operação diária: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [participantId]);

  const readiness = intelligence?.prontidao_individual || intelligence?.prontidao || {};
  const coverage = intelligence?.cobertura || {};
  const practical = intelligence?.devolucao_pratica || intelligence?.devolucao || {};
  const sessions = intelligence?.sessoes_recentes || [];
  const person = intelligence?.pessoa || {};
  const participant = intelligence?.participante || {};
  const profile = intelligence?.perfil_esportivo || {};

  const internalLoad = useMemo(() => {
    const duration = Number(form.duracao_min);
    const intensity = Number(form.intensidade_percebida);
    if (!duration || Number.isNaN(intensity)) return null;
    return Math.round(duration * intensity * 10) / 10;
  }, [form.duracao_min, form.intensidade_percebida]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openReadiness() {
    const query = new URLSearchParams({
      projeto: participant.projeto_id || "",
      participante: participantId
    }).toString();
    navigate(`/master/coletas?${query}`);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.duracao_min) return setError("Informe a duração da sessão.");
    setSaving(true);
    try {
      const created = await createAthleteTrainingSession(participantId, {
        data_hora_inicio: new Date(form.data_hora_inicio).toISOString(),
        duracao_min: Number(form.duracao_min),
        volume_planejado: numberOrNull(form.volume_planejado),
        volume_executado: numberOrNull(form.volume_executado),
        intensidade_planejada: numberOrNull(form.intensidade_planejada),
        intensidade_percebida: numberOrNull(form.intensidade_percebida),
        carga_externa: numberOrNull(form.carga_externa),
        conteudo: {
          foco: form.foco.trim() || null,
          contexto: form.contexto.trim() || null
        },
        intercorrencias: form.intercorrencias.trim() || null
      });
      setMessage(`Sessão registrada. Carga interna: ${created.carga_interna ?? "não calculada"}. O Cockpit foi atualizado.`);
      setForm({ ...INITIAL, data_hora_inicio: localDateTimeValue() });
      await load();
    } catch (requestError) {
      setError(`Falha ao registrar sessão: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page daily-operation-page">
    <header className="dashboard-header master-header">
      <div>
        <span className="master-eyebrow">Operação diária do atleta</span>
        <h1>{person.nome || "Atleta"}</h1>
        <p>{profile.modalidade || "Modalidade"} · {profile.categoria || "Categoria"} · um único fluxo para evidência, treino, contexto e inteligência.</p>
      </div>
      <div className="master-header-actions">
        <button className="master-button secondary" onClick={() => navigate(`/master/atletas/${participantId}`)}>Voltar ao Cockpit</button>
        <button className="master-button secondary" onClick={load}>Atualizar leitura</button>
      </div>
    </header>

    {message && <div className="master-feedback success">{message}</div>}
    {error && <div className="master-error" role="alert">{error}</div>}
    {loading ? <div className="master-empty">Consolidando o dia do atleta...</div> : <>
      <section className="daily-status-strip">
        <article><span>Prontidão validada</span><strong>{readiness.amostras || 0}</strong><small>{readiness.status ? readiness.status.replaceAll("_", " ") : "sem evidência"}</small></article>
        <article><span>Sessões registradas</span><strong>{sessions.length}</strong><small>Histórico recente</small></article>
        <article><span>Confiança AGP</span><strong>{coverage.confianca_geral ?? 0}%</strong><small>{coverage.classificacao_confianca || "baixa"}</small></article>
      </section>

      <section className="daily-guidance">
        <div>
          <span className="master-eyebrow">Leitura aplicada</span>
          <h2>{practical.estado ? practical.estado.replaceAll("_", " ") : "Aguardando evidência"}</h2>
          <p>{practical.mensagem || "O AGP ainda não possui evidência validada suficiente para interpretar o dia."}</p>
        </div>
        <strong>{practical.acao_prioritaria || "Registrar prontidão e sessão do dia."}</strong>
      </section>

      <section className="daily-flow-grid">
        <article className="master-panel daily-step-card">
          <span className="master-eyebrow">Antes / recuperação</span>
          <h2>Prontidão do dia</h2>
          {readiness.ultimo ? <>
            <p>Último registro validado: {new Date(readiness.ultimo.data_hora_coleta).toLocaleString("pt-BR")}</p>
            <p>{readiness.sinais?.length ? `${readiness.sinais.length} sinal(is) requerem atenção.` : "Nenhum sinal forte calculado no último registro."}</p>
          </> : <p>Nenhuma prontidão validada ainda. O AGP não inferirá estado sem evidência.</p>}
          <button className="master-button" onClick={openReadiness}>Registrar / validar prontidão</button>
        </article>

        <form className="master-panel daily-session-form" onSubmit={submit}>
          <span className="master-eyebrow">Durante / após treino</span>
          <h2>Registrar sessão</h2>
          <div className="daily-form-grid">
            <label>Início<input type="datetime-local" value={form.data_hora_inicio} onChange={(e) => update("data_hora_inicio", e.target.value)} required /></label>
            <label>Duração (min)<input type="number" min="1" max="600" value={form.duracao_min} onChange={(e) => update("duracao_min", e.target.value)} required /></label>
            <label>Intensidade planejada (0–10)<input type="number" min="0" max="10" step="0.1" value={form.intensidade_planejada} onChange={(e) => update("intensidade_planejada", e.target.value)} /></label>
            <label>Intensidade percebida / RPE (0–10)<input type="number" min="0" max="10" step="0.1" value={form.intensidade_percebida} onChange={(e) => update("intensidade_percebida", e.target.value)} /></label>
            <label>Volume planejado<input type="number" step="0.1" value={form.volume_planejado} onChange={(e) => update("volume_planejado", e.target.value)} /></label>
            <label>Volume executado<input type="number" step="0.1" value={form.volume_executado} onChange={(e) => update("volume_executado", e.target.value)} /></label>
            <label>Carga externa<input type="number" step="0.1" value={form.carga_externa} onChange={(e) => update("carga_externa", e.target.value)} /></label>
            <label>Carga interna calculada<input value={internalLoad ?? "Será calculada com duração × RPE"} readOnly /></label>
          </div>
          <label>Foco da sessão<input value={form.foco} onChange={(e) => update("foco", e.target.value)} placeholder="Ex.: técnica de crawl, potência, resistência" /></label>
          <label>Contexto do dia<textarea rows="3" value={form.contexto} onChange={(e) => update("contexto", e.target.value)} placeholder="Viagem, escola, competição, mudança de rotina, ambiente, equipamento..." /></label>
          <label>Intercorrências<textarea rows="3" value={form.intercorrencias} onChange={(e) => update("intercorrencias", e.target.value)} placeholder="Dor, desconforto, interrupção, ocorrência relevante ou nenhuma." /></label>
          <button className="master-button" disabled={saving}>{saving ? "Registrando..." : "Registrar sessão e atualizar inteligência"}</button>
        </form>
      </section>

      <section className="master-panel">
        <div className="master-section-heading"><div><span className="master-eyebrow">Histórico operacional</span><h2>Sessões recentes</h2></div><strong>{sessions.length}</strong></div>
        {sessions.length === 0 ? <div className="master-empty">Nenhuma sessão real registrada para este atleta.</div> : <ul className="master-activity-list">{sessions.map((session) => <li key={session.id}><div><strong>{new Date(session.data_hora_inicio).toLocaleString("pt-BR")}</strong><span>{session.duracao_min || "—"} min · RPE {session.intensidade_percebida ?? "—"} · carga interna {session.carga_interna ?? "—"}</span><small>{session.conteudo?.foco || "Foco não informado"}{session.intercorrencias ? ` · ${session.intercorrencias}` : ""}</small></div></li>)}</ul>}
      </section>
    </>}
  </div></main>;
}
