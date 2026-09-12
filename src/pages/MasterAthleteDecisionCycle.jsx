import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createIntervention,
  createInterventionResponse,
  createProfessionalAssessment,
  getDecisionCycle
} from "../services/multidisciplinaryDecision";
import "../styles/dashboard-master.css";
import "../styles/athlete-decision-cycle.css";

const DOMAINS = [
  ["fisico", "Físico"], ["fisiologico", "Fisiológico"], ["biologico", "Biológico"],
  ["tecnico", "Técnico"], ["mental", "Mental"], ["psicologico", "Psicológico"],
  ["medico", "Médico"], ["recuperacao", "Recuperação"], ["contextual", "Contextual"],
  ["crescimento", "Crescimento"], ["maturacao", "Maturação"], ["nutricional", "Nutricional"]
];

function lines(value) {
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function metrics(value) {
  const out = {};
  lines(value).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) return;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    const number = Number(raw.replace(",", "."));
    out[key] = raw !== "" && Number.isFinite(number) ? number : raw;
  });
  return out;
}

function formatDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("pt-BR"); } catch { return "—"; }
}

export default function MasterAthleteDecisionCycle() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [assessment, setAssessment] = useState({ dominio: "fisico", papel: "preparador_fisico", instrumento: "", metricas: "", achados: "", restricoes: "", recomendacoes: "", confianca: "" });
  const [intervention, setIntervention] = useState({ dominio: "fisico", papel: "treinador", descricao: "", justificativa: "", resultado: "", status: "proposta" });
  const [response, setResponse] = useState({ intervencao: "", papel: "treinador", antes: "", depois: "", classificacao: "inconclusiva", confianca: "", conclusao: "", proximo: "" });

  async function load() {
    setLoading(true); setError("");
    try { setData(await getDecisionCycle(participantId)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [participantId]);

  const summary = data?.sintese || {};
  const activeInterventions = useMemo(() => (data?.intervencoes || []).filter((item) => ["proposta", "aprovada", "em_execucao"].includes(item.status)), [data]);
  const evidence = useMemo(() => {
    const assessmentItem = data?.avaliacoes_profissionais?.[0];
    if (assessmentItem) return [{ tipo: "avaliacao_profissional", id: assessmentItem.id, dominio: assessmentItem.dominio }];
    const result = (data?.resultados_analiticos || []).find((item) => item.status === "validado") || data?.resultados_analiticos?.[0];
    if (result) return [{ tipo: "resultado_analitico", id: result.id, versao_motor: result.versao_motor }];
    return [];
  }, [data]);

  async function saveAssessment(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      await createProfessionalAssessment(participantId, {
        dominio: assessment.dominio,
        papel_profissional: assessment.papel,
        instrumento_referencia: assessment.instrumento || null,
        metricas: metrics(assessment.metricas),
        achados: lines(assessment.achados),
        restricoes: lines(assessment.restricoes),
        recomendacoes: lines(assessment.recomendacoes),
        confianca: assessment.confianca === "" ? null : Number(assessment.confianca)
      });
      setMessage("Avaliação profissional integrada ao histórico do atleta.");
      setAssessment((current) => ({ ...current, instrumento: "", metricas: "", achados: "", restricoes: "", recomendacoes: "", confianca: "" }));
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function saveIntervention(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (!evidence.length) throw new Error("A intervenção exige pelo menos uma evidência ou avaliação profissional registrada.");
      await createIntervention(participantId, {
        dominio: intervention.dominio,
        papel_responsavel: intervention.papel,
        descricao: intervention.descricao,
        justificativa: intervention.justificativa,
        evidencia_origem: evidence,
        resultado_esperado: { objetivo: intervention.resultado },
        status: intervention.status
      });
      setMessage("Intervenção registrada com origem de evidência rastreável.");
      setIntervention((current) => ({ ...current, descricao: "", justificativa: "", resultado: "", status: "proposta" }));
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function saveResponse(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (!response.intervencao) throw new Error("Selecione a intervenção avaliada.");
      await createInterventionResponse(response.intervencao, {
        papel_avaliador: response.papel,
        metricas_antes: metrics(response.antes),
        metricas_depois: metrics(response.depois),
        classificacao_resposta: response.classificacao,
        confianca: response.confianca === "" ? null : Number(response.confianca),
        conclusao: response.conclusao,
        recomendacao_proximo_ciclo: response.proximo || null
      });
      setMessage("Resposta à intervenção medida e incorporada ao próximo ciclo.");
      setResponse((current) => ({ ...current, antes: "", depois: "", classificacao: "inconclusiva", confianca: "", conclusao: "", proximo: "" }));
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page decision-cycle-page">
    <header className="dashboard-header master-header decision-cycle-header">
      <div>
        <span className="master-eyebrow">Núcleo de decisão multidisciplinar</span>
        <h1>Decisão aplicada ao atleta</h1>
        <p>Avaliações profissionais, inteligência, intervenção e resposta no mesmo ciclo.</p>
      </div>
      <div className="master-header-actions">
        <button className="master-button secondary" onClick={() => navigate(`/master/atletas/${participantId}`)}>Voltar ao Cockpit</button>
        <button className="master-button secondary" onClick={load}>Atualizar</button>
      </div>
    </header>

    {message && <div className="master-feedback success">{message}</div>}
    {error && <div className="master-error">{error}</div>}
    {loading ? <div className="master-empty">Consolidando decisão multidisciplinar...</div> : data && <>
      <section className="decision-hero">
        <div><span className="master-eyebrow">Estado do ciclo</span><h2>{String(summary.estado || "sem leitura").replaceAll("_", " ")}</h2><p>{summary.proxima_acao}</p></div>
        <div className="decision-score"><strong>{summary.cobertura_multidisciplinar_percentual ?? 0}%</strong><span>cobertura dos domínios possíveis</span><small>não é meta; só avaliar o que for pertinente</small></div>
      </section>

      <section className="decision-kpis">
        <article><strong>{data.avaliacoes_profissionais?.length || 0}</strong><span>Avaliações profissionais</span></article>
        <article><strong>{summary.resultados_validados || 0}</strong><span>Resultados validados</span></article>
        <article><strong>{summary.intervencoes_ativas || 0}</strong><span>Intervenções abertas</span></article>
        <article><strong>{summary.respostas_intervencao || 0}</strong><span>Respostas medidas</span></article>
      </section>

      {(summary.restricoes_ativas?.length || summary.recomendacoes_atuais?.length) > 0 && <section className="master-panel">
        <div className="master-section-heading"><div><span className="master-eyebrow">Cruzamento profissional</span><h2>Restrições e recomendações atuais</h2></div></div>
        <div className="decision-findings">
          {(summary.restricoes_ativas || []).map((item, index) => <article className="restriction" key={`r-${index}`}><strong>{item.dominio} · {item.origem}</strong><p>{String(item.conteudo)}</p></article>)}
          {(summary.recomendacoes_atuais || []).map((item, index) => <article key={`c-${index}`}><strong>{item.dominio} · {item.origem}</strong><p>{String(item.conteudo)}</p></article>)}
        </div>
      </section>}

      <section className="decision-forms">
        <form className="decision-form" onSubmit={saveAssessment}>
          <span className="master-eyebrow">01 · Avaliar</span><h2>Avaliação profissional</h2>
          <div className="decision-two"><label>Domínio<select value={assessment.dominio} onChange={(e) => setAssessment({ ...assessment, dominio: e.target.value })}>{DOMAINS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Papel profissional<input value={assessment.papel} onChange={(e) => setAssessment({ ...assessment, papel: e.target.value })} required /></label></div>
          <label>Instrumento / teste de referência<input value={assessment.instrumento} onChange={(e) => setAssessment({ ...assessment, instrumento: e.target.value })} placeholder="Ex.: teste, protocolo, escala ou avaliação clínica" /></label>
          <label>Métricas<textarea rows="4" value={assessment.metricas} onChange={(e) => setAssessment({ ...assessment, metricas: e.target.value })} placeholder={'Uma por linha. Ex.:\nCMJ_cm: 41.2\nFC_repouso: 52'} /></label>
          <label>Achados<textarea rows="3" value={assessment.achados} onChange={(e) => setAssessment({ ...assessment, achados: e.target.value })} placeholder="Um achado por linha" /></label>
          <label>Restrições<textarea rows="3" value={assessment.restricoes} onChange={(e) => setAssessment({ ...assessment, restricoes: e.target.value })} placeholder="Deixe vazio quando não houver" /></label>
          <label>Recomendações<textarea rows="3" value={assessment.recomendacoes} onChange={(e) => setAssessment({ ...assessment, recomendacoes: e.target.value })} placeholder="Uma recomendação por linha" /></label>
          <label>Confiança da avaliação (%)<input type="number" min="0" max="100" value={assessment.confianca} onChange={(e) => setAssessment({ ...assessment, confianca: e.target.value })} /></label>
          <button className="master-button" disabled={saving}>Registrar avaliação</button>
        </form>

        <form className="decision-form" onSubmit={saveIntervention}>
          <span className="master-eyebrow">02 · Intervir</span><h2>Intervenção rastreável</h2>
          <div className="decision-two"><label>Domínio<select value={intervention.dominio} onChange={(e) => setIntervention({ ...intervention, dominio: e.target.value })}>{DOMAINS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Responsável<input value={intervention.papel} onChange={(e) => setIntervention({ ...intervention, papel: e.target.value })} required /></label></div>
          <label>O que será feito<textarea rows="4" value={intervention.descricao} onChange={(e) => setIntervention({ ...intervention, descricao: e.target.value })} required /></label>
          <label>Por que<textarea rows="4" value={intervention.justificativa} onChange={(e) => setIntervention({ ...intervention, justificativa: e.target.value })} required /></label>
          <label>Resultado esperado<textarea rows="3" value={intervention.resultado} onChange={(e) => setIntervention({ ...intervention, resultado: e.target.value })} required /></label>
          <label>Estado<select value={intervention.status} onChange={(e) => setIntervention({ ...intervention, status: e.target.value })}><option value="proposta">Proposta</option><option value="aprovada">Aprovada</option><option value="em_execucao">Em execução</option></select></label>
          <small className="decision-source">Origem automática: {evidence.length ? evidence[0].tipo.replaceAll("_", " ") : "nenhuma evidência disponível"}</small>
          <button className="master-button" disabled={saving || !evidence.length}>Registrar intervenção</button>
        </form>

        <form className="decision-form" onSubmit={saveResponse}>
          <span className="master-eyebrow">03 · Medir resposta</span><h2>Efeito da intervenção</h2>
          <label>Intervenção<select value={response.intervencao} onChange={(e) => setResponse({ ...response, intervencao: e.target.value })} required><option value="">Selecionar</option>{activeInterventions.map((item) => <option key={item.id} value={item.id}>{item.dominio} · {item.descricao.slice(0, 55)}</option>)}</select></label>
          <label>Avaliador<input value={response.papel} onChange={(e) => setResponse({ ...response, papel: e.target.value })} required /></label>
          <div className="decision-two"><label>Métricas antes<textarea rows="4" value={response.antes} onChange={(e) => setResponse({ ...response, antes: e.target.value })} placeholder={'Ex.:\nfadiga: 7\nCMJ_cm: 38'} /></label><label>Métricas depois<textarea rows="4" value={response.depois} onChange={(e) => setResponse({ ...response, depois: e.target.value })} placeholder={'Use as mesmas métricas.\nfadiga: 4\nCMJ_cm: 41'} /></label></div>
          <div className="decision-two"><label>Resposta<select value={response.classificacao} onChange={(e) => setResponse({ ...response, classificacao: e.target.value })}><option value="melhora">Melhora</option><option value="neutra">Neutra</option><option value="piora">Piora</option><option value="inconclusiva">Inconclusiva</option></select></label><label>Confiança (%)<input type="number" min="0" max="100" value={response.confianca} onChange={(e) => setResponse({ ...response, confianca: e.target.value })} /></label></div>
          <label>Conclusão<textarea rows="4" value={response.conclusao} onChange={(e) => setResponse({ ...response, conclusao: e.target.value })} required /></label>
          <label>Próximo ciclo<textarea rows="3" value={response.proximo} onChange={(e) => setResponse({ ...response, proximo: e.target.value })} /></label>
          <button className="master-button" disabled={saving || !activeInterventions.length}>Registrar resposta</button>
        </form>
      </section>

      <section className="master-panel">
        <div className="master-section-heading"><div><span className="master-eyebrow">Histórico auditável</span><h2>Últimas decisões</h2></div></div>
        <div className="decision-history">
          {(data.avaliacoes_profissionais || []).slice(0, 5).map((item) => <article key={item.id}><span>Avaliação · {item.dominio}</span><strong>{item.papel_profissional}</strong><small>{formatDate(item.data_avaliacao)}</small></article>)}
          {(data.intervencoes || []).slice(0, 5).map((item) => <article key={item.id}><span>Intervenção · {item.dominio}</span><strong>{item.descricao}</strong><small>{item.status} · {formatDate(item.inicio)}</small></article>)}
          {(data.respostas_intervencao || []).slice(0, 5).map((item) => <article key={item.id}><span>Resposta · {item.classificacao_resposta}</span><strong>{item.conclusao}</strong><small>{formatDate(item.data_avaliacao)}</small></article>)}
          {!data.avaliacoes_profissionais?.length && !data.intervencoes?.length && !data.respostas_intervencao?.length && <p>Nenhuma decisão multidisciplinar registrada ainda. O AGP não preenche histórico com simulação.</p>}
        </div>
      </section>
    </>}
  </div></main>;
}
