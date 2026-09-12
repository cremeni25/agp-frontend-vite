import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAthleteIntelligence } from "../services/athleteIntelligence";
import "../styles/dashboard-master.css";
import "../styles/athlete-cockpit.css";

const STAGE_LABELS = [
  ["preparacao", "Preparação"],
  ["coleta", "Coleta"],
  ["analise", "Análise"],
  ["validacao", "Validação"],
  ["aplicacao", "Aplicação"]
];

function formatDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

function statusText(data, key) {
  const journey = data?.jornada || {};
  if (key === "preparacao") return journey.preparacao?.concluida ? "Concluída" : "Pendente";
  if (key === "coleta") return journey.coleta?.total > 0 ? `${journey.coleta.total} registrada(s)` : journey.coleta?.elegivel ? "Pronta para iniciar" : "Bloqueada";
  if (key === "analise") return journey.analise?.total_execucoes > 0 ? `${journey.analise.total_execucoes} execução(ões)` : journey.analise?.elegivel ? "Pronta" : "Aguardando evidência";
  if (key === "validacao") return journey.validacao?.resultado_validado ? "Resultado validado" : journey.validacao?.total_resultados > 0 ? "Aguardando validação" : "Sem resultado";
  if (key === "aplicacao") return journey.aplicacao?.resultado_aplicavel ? "Aplicação disponível" : "Aguardando resultado validado";
  return "—";
}

export default function MasterAthleteProfile() {
  const navigate = useNavigate();
  const { participantId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getAthleteIntelligence(participantId));
    } catch (requestError) {
      setError(`Falha ao carregar a inteligência do atleta: ${requestError.message}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [participantId]);

  const contextQuery = useMemo(() => {
    if (!data) return "";
    return new URLSearchParams({
      instituicao: data.instituicao?.id || "",
      projeto: data.projeto?.id || "",
      participante: data.participante?.id || participantId
    }).toString();
  }, [data, participantId]);

  function openService(service) {
    navigate(`/master/participantes/operacao?${contextQuery}&servico=${service}`);
  }

  function openDestination(destination) {
    if (!data) return;
    if (["tecnico", "consentimento", "linha-base", "elegibilidade"].includes(destination)) return openService(destination);
    const query = new URLSearchParams({
      projeto: data.projeto?.id || "",
      participante: data.participante?.id || participantId
    }).toString();
    if (destination === "catalogo-cientifico") return navigate(`/master/catalogo-cientifico?${query}`);
    if (destination === "coletas") return navigate(`/master/coletas?${query}`);
    if (destination === "pipeline-analitico") return navigate(`/master/pipeline-analitico?${query}`);
    if (destination === "validacao-profissional") return navigate(`/master/validacao-profissional?${query}`);
    return openService("elegibilidade");
  }

  const person = data?.pessoa || {};
  const profile = data?.perfil_esportivo || {};
  const eligibility = data?.elegibilidade || {};
  const next = data?.proxima_acao || {};
  const latestResult = data?.jornada?.validacao?.ultimo_resultado || null;
  const latestScore = data?.jornada?.aplicacao?.score_atual || null;
  const pending = eligibility?.pendencias || [];

  return <main className="dashboard-master"><div className="dashboard-overlay master-page athlete-cockpit-page">
    <header className="dashboard-header master-header athlete-cockpit-header">
      <div>
        <span className="master-eyebrow">Cockpit de Inteligência do Atleta</span>
        <h1>{person.nome || "Atleta"}</h1>
        <p>O atleta no centro: contexto, evidência, inteligência e próxima decisão operacional.</p>
      </div>
      <div className="master-header-actions">
        <button className="master-button secondary" onClick={() => navigate("/master/atletas")}>Atletas</button>
        <button className="master-button secondary" onClick={load}>Atualizar</button>
      </div>
    </header>

    {error && <div className="master-error" role="alert">{error}</div>}
    {loading ? <div className="master-empty">Consolidando inteligência do atleta...</div> : data && <>
      <section className="athlete-intelligence-hero">
        <div className="athlete-intelligence-hero-copy">
          <span className="master-eyebrow">Leitura AGP agora</span>
          <h2>{next.titulo || "Jornada em acompanhamento"}</h2>
          <p>{next.descricao || "O AGP está consolidando a próxima decisão deste atleta."}</p>
          {pending.length > 0 && <div className="athlete-pending-line">Pendência operacional: {pending.join(" · ")}</div>}
        </div>
        <div className="athlete-next-action">
          <span>Próxima ação</span>
          <button className="master-button" onClick={() => openDestination(next.destino)}>{next.titulo || "Revisar atleta"}</button>
        </div>
      </section>

      <section className="athlete-journey">
        {STAGE_LABELS.map(([key, label], index) => <article key={key} className={`athlete-stage ${statusText(data, key).includes("Concluída") || statusText(data, key).includes("validado") || statusText(data, key).includes("registrada") ? "done" : ""}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{label}</strong><small>{statusText(data, key)}</small></div>
        </article>)}
      </section>

      <section className="athlete-360-grid">
        <article className="athlete-360-card">
          <span className="master-eyebrow">Identidade esportiva</span>
          <h3>{profile.modalidade || "Modalidade não informada"}</h3>
          <p>{profile.prova_posicao || "Prova/posição não informada"}</p>
          <p>{profile.categoria || "Categoria não informada"} · {profile.nivel || "Nível não informado"}</p>
          <small>Nascimento: {formatDate(person.data_nascimento)}</small>
        </article>

        <article className="athlete-360-card">
          <span className="master-eyebrow">Pessoas e ambiente</span>
          <h3>{data.tecnico?.nome || "Técnico não definido"}</h3>
          <p>{data.instituicao?.nome || "Instituição não identificada"}</p>
          <p>{data.projeto?.nome || "Projeto não identificado"}</p>
          <small>{data.participante?.ativo ? "Vínculo ativo" : "Vínculo inativo"}</small>
        </article>

        <article className="athlete-360-card">
          <span className="master-eyebrow">Evidência real</span>
          <h3>{data.jornada?.coleta?.total || 0} coleta(s)</h3>
          <p>{data.jornada?.coleta?.validadas || 0} validada(s) para uso analítico</p>
          <p>{data.jornada?.coleta?.ultima?.instrumento_nome || "Nenhuma evidência coletada ainda"}</p>
          <small>{data.jornada?.coleta?.elegivel ? "Elegível para coleta" : "Coleta bloqueada no momento"}</small>
        </article>

        <article className="athlete-360-card">
          <span className="master-eyebrow">Inteligência aplicada</span>
          <h3>{latestScore?.score_global ?? latestResult?.confianca ?? "—"}</h3>
          <p>{latestScore?.nivel_classificacao || latestResult?.status || "Sem resultado analítico produzido"}</p>
          <p>{latestResult?.explicacao || latestScore?.diagnostico || "A inteligência será gerada quando houver evidência válida suficiente."}</p>
          <small>{latestResult?.versao_motor ? `Motor ${latestResult.versao_motor}` : "Motor aguardando dados"}</small>
        </article>
      </section>

      <section className="master-panel athlete-decision-panel">
        <div className="master-section-heading">
          <div><span className="master-eyebrow">Devolução aplicada</span><h2>O que o AGP devolve ao atleta</h2></div>
        </div>
        {latestResult?.status === "validado" ? <div className="athlete-decision-content">
          <strong>{latestResult.parecer_tecnico || latestResult.explicacao || "Resultado validado disponível."}</strong>
          <p>{latestResult.limitacoes || "Sem limitações adicionais registradas."}</p>
        </div> : <div className="athlete-empty-intelligence">
          <strong>Ainda não existe devolução aplicada validada.</strong>
          <p>O AGP não preencherá esta área com simulação. Ela será alimentada somente por evidência coletada, processamento do motor e validação profissional.</p>
        </div>}
      </section>

      <details className="master-panel athlete-admin-details">
        <summary>Ajustes e governança deste atleta</summary>
        <p>Use somente quando precisar alterar dados estruturais. A operação diária deve seguir a próxima ação indicada acima.</p>
        <div className="master-row-actions athlete-admin-actions">
          <button className="master-button secondary" onClick={() => openService("tecnico")}>Técnico</button>
          <button className="master-button secondary" onClick={() => openService("consentimento")}>Consentimento</button>
          <button className="master-button secondary" onClick={() => openService("linha-base")}>Linha de base</button>
          <button className="master-button secondary" onClick={() => openService("elegibilidade")}>Elegibilidade</button>
        </div>
      </details>
    </>}
  </div></main>;
}
