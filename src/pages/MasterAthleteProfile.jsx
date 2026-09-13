import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAthleteIntelligence, getAthleteIndividualIntelligence } from "../services/athleteIntelligence";
import "../styles/dashboard-master.css";
import "../styles/athlete-cockpit.css";

export default function MasterAthleteProfile() {
  const navigate = useNavigate();
  const { participantId } = useParams();
  const [data, setData] = useState(null);
  const [individual, setIndividual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [cockpit, intelligence] = await Promise.all([
        getAthleteIntelligence(participantId),
        getAthleteIndividualIntelligence(participantId)
      ]);
      setData(cockpit);
      setIndividual(intelligence);
    } catch (requestError) {
      setError(`Falha ao carregar o atleta: ${requestError.message}`);
      setData(null);
      setIndividual(null);
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
    openService("elegibilidade");
  }

  const person = data?.pessoa || {};
  const next = data?.proxima_acao || {};
  const pending = data?.elegibilidade?.pendencias || [];
  const coverage = individual?.cobertura || {};
  const practical = individual?.devolucao_pratica || individual?.devolucao || {};
  const readiness = individual?.prontidao_individual || individual?.prontidao || {};
  const signals = readiness?.sinais || [];

  return <main className="dashboard-master"><div className="dashboard-overlay master-page athlete-cockpit-page">
    <header className="dashboard-header master-header">
      <div>
        <span className="master-eyebrow">Atleta</span>
        <h1>{person.nome || "Atleta"}</h1>
        <p>O AGP mostra primeiro o que precisa ser feito.</p>
      </div>
      <div className="master-header-actions">
        <button className="master-button secondary" onClick={() => navigate("/master/atletas")}>Voltar</button>
        <button className="master-button secondary" onClick={load}>Atualizar</button>
      </div>
    </header>

    {error && <div className="master-error" role="alert">{error}</div>}
    {loading ? <div className="master-empty">Preparando acompanhamento...</div> : data && <>
      <section className="athlete-intelligence-hero">
        <div className="athlete-intelligence-hero-copy">
          <span className="master-eyebrow">Próxima ação</span>
          <h2>{next.titulo || "Acompanhamento em dia"}</h2>
          <p>{next.descricao || "Nenhuma pendência operacional imediata."}</p>
          {pending.length > 0 && <div className="athlete-pending-line">Pendências: {pending.join(" · ")}</div>}
        </div>
        <div className="athlete-next-action">
          <button className="master-button" onClick={() => openDestination(next.destino)}>{next.titulo || "Revisar acompanhamento"}</button>
        </div>
      </section>

      <section className="master-panel">
        <div className="master-section-heading">
          <div><span className="master-eyebrow">Situação atual</span><h2>Inteligência disponível</h2></div>
          <strong>{coverage.confianca_geral ?? 0}%</strong>
        </div>
        <div className="athlete-360-grid">
          <article className="athlete-360-card">
            <h3>{practical.estado ? practical.estado.replaceAll("_", " ") : "Aguardando evidência"}</h3>
            <p>{practical.mensagem || "Ainda não há evidência suficiente para uma leitura individual."}</p>
          </article>
          <article className="athlete-360-card">
            <h3>{practical.acao_prioritaria || "Coletar evidência"}</h3>
            <p>{signals.length ? `${signals.length} sinal(is) exigem contexto profissional.` : "Nenhum sinal operacional calculável agora."}</p>
          </article>
        </div>
      </section>

      <div className="master-header-actions">
        <button className="master-button" onClick={() => navigate(`/master/atletas/${participantId}/dia`)}>Operação do dia</button>
        <button className="master-button secondary" onClick={() => navigate(`/master/atletas/${participantId}/decisao`)}>Decisão multidisciplinar</button>
      </div>

      <details className="master-panel athlete-admin-details">
        <summary>Histórico, contexto e governança</summary>
        <p>Informações estruturais permanecem disponíveis sem competir com a operação diária.</p>
        <div className="athlete-360-grid">
          <article className="athlete-360-card">
            <h3>{data.perfil_esportivo?.modalidade || "Modalidade não informada"}</h3>
            <p>{data.instituicao?.nome || "Instituição não identificada"} · {data.projeto?.nome || "Projeto não identificado"}</p>
          </article>
          <article className="athlete-360-card">
            <h3>{data.jornada?.coleta?.total || 0} evidência(s)</h3>
            <p>{data.jornada?.coleta?.validadas || 0} validada(s) para análise.</p>
          </article>
        </div>
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
