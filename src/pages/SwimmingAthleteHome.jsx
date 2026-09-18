import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SwimmingShell from "../components/SwimmingShell";
import AthleteEvolutionDashboard from "../components/AthleteEvolutionDashboard";
import { getParticipantCanonicalBundle } from "../services/canonicalAgp";

function formatDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("pt-BR"); } catch { return "—"; }
}

function firstArray(value, keys = []) {
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

export default function SwimmingAthleteHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { perfil } = useAuth();
  const participantId = perfil?.participante_id;
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialView = ["hoje","evolucao","treinos","historico"].includes(searchParams.get("view")) ? searchParams.get("view") : "hoje";
  const [tab, setTab] = useState(initialView);

  async function load() {
    if (!participantId) {
      setError("Seu vínculo com a Natação ainda não está disponível.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setBundle(await getParticipantCanonicalBundle(participantId));
    } catch {
      setError("Não foi possível carregar seu acompanhamento agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [participantId]);
  useEffect(() => {
    const next = searchParams.get("view");
    if (["hoje","evolucao","treinos","historico"].includes(next)) setTab(next);
  }, [searchParams]);

  const sessions = useMemo(() => firstArray(bundle?.training, ["sessoes"]), [bundle]);
  const participations = useMemo(() => firstArray(bundle?.training, ["participacoes_prova"]), [bundle]);
  const segments = useMemo(() => firstArray(bundle?.training, ["segmentos_prova"]), [bundle]);
  const assessments = useMemo(() => firstArray(bundle?.assessments, ["avaliacoes", "items", "registros"]), [bundle]);
  const series = useMemo(() => firstArray(bundle?.longitudinal, ["series", "series_longitudinais", "metricas"]), [bundle]);
  const decisions = useMemo(() => firstArray(bundle?.decision, ["decisoes", "items"]), [bundle]);
  const latestSession = sessions[0] || null;
  const latestCompetition = participations[0] || null;
  const todayReport = bundle?.readiness?.registro || bundle?.readiness?.ultimo_registro || bundle?.readiness?.autorreporte || null;
  const analysisState = bundle?.analysis?.estado || bundle?.analysis?.estado_analitico || bundle?.analysis?.status || "dados_insuficientes";
  const longitudinalState = bundle?.longitudinal?.estado?.estado || bundle?.longitudinal?.estado || "histórico em formação";

  const focus = todayReport
    ? { title: "Seu registro de hoje já faz parte da sua história", text: "O AGP preserva o contexto e acompanha a evolução ao longo do tempo.", button: "Ver evolução", action: () => setTab("evolucao") }
    : { title: "Como você está hoje?", text: "Seu autorrelato diário é uma evidência do seu momento, não uma nota sobre você.", button: "Responder prontidão", action: () => navigate("/atleta/prontidao-diaria") };

  if (loading) {
    return <SwimmingShell eyebrow="Atleta · Natação" title="Preparando seu dia" subtitle="Organizando somente o que importa para você agora."><div className="swim-panel">Carregando acompanhamento...</div></SwimmingShell>;
  }

  return (
    <SwimmingShell
      eyebrow="Atleta · Natação"
      title={`Olá, ${perfil?.nome?.split(" ")?.[0] || "atleta"}`}
      subtitle="Seu treino, suas respostas e sua evolução em uma única história."
      actions={[{ label: "Atualizar", onClick: load }]}
    >
      {error && <div className="swim-notice">{error}</div>}
      {bundle?.unavailable?.length > 0 && <div className="swim-notice">Algumas áreas ainda não possuem dados disponíveis para o seu contexto atual.</div>}

      <nav className="swim-tabs" aria-label="Áreas do atleta">
        {[
          ["hoje","Hoje"],["evolucao","Minha evolução"],["treinos","Treinos e provas"],["historico","Histórico"]
        ].map(([key,label]) => <button key={key} className={tab===key?"swim-tab active":"swim-tab"} onClick={()=>setTab(key)}>{label}</button>)}
      </nav>

      {tab === "hoje" && <>
        <section className="swim-focus">
          <div><span className="swim-eyebrow">Agora</span><h2>{focus.title}</h2><p>{focus.text}</p></div>
          <button className="swim-primary" onClick={focus.action}>{focus.button}</button>
        </section>

        <section className="swim-grid">
          <article className="swim-card"><span>Último treino</span><strong>{latestSession ? formatDate(latestSession.inicio_real || latestSession.inicio_planejado || latestSession.created_at) : "—"}</strong><p>{latestSession?.tipo_sessao || "Ainda sem sessão registrada."}</p></article>
          <article className="swim-card"><span>Última prova</span><strong>{latestCompetition ? formatDate(latestCompetition.updated_at || latestCompetition.created_at) : "—"}</strong><p>{latestCompetition?.status || "Ainda sem participação registrada."}</p></article>
          <article className="swim-card"><span>Estado longitudinal</span><strong>{String(longitudinalState).replaceAll("_"," ")}</strong><p>O AGP não transforma seu histórico em score global.</p></article>
          <article className="swim-card"><span>Status esportivo</span><strong>{perfil?.status_federativo === "federado" ? "Federado" : perfil?.status_federativo === "vinculado" ? "Vinculado" : "Não informado"}</strong><p>{perfil?.status_federativo === "federado" ? [perfil?.federacao_nome,perfil?.registro_federativo].filter(Boolean).join(" · ") || "Contexto federativo registrado." : "Esse contexto acompanha treinos e competições sem definir sozinho elegibilidade."}</p></article>
        </section>

        <section className="swim-panel">
          <div className="swim-panel-head"><div><span className="swim-panel-label">Leitura atual</span><h2>Evidência antes de interpretação</h2></div></div>
          <div className="swim-row"><div><strong>Estado analítico</strong><span>{String(analysisState).replaceAll("_"," ")}</span></div><span className="swim-pill">Canônico</span></div>
          <div className="swim-row"><div><strong>Avaliações profissionais</strong><span>{assessments.length ? `${assessments.length} registro(s) disponível(is)` : "Ainda sem avaliação profissional registrada."}</span></div></div>
          <div className="swim-row"><div><strong>Decisões acompanhadas</strong><span>{decisions.length ? `${decisions.length} decisão(ões) no ciclo` : "Nenhuma decisão registrada para exibição."}</span></div></div>
        </section>
      </>}

      {tab === "evolucao" && <AthleteEvolutionDashboard participantId={participantId} role="athlete" />}

      {tab === "treinos" && <section className="swim-two">
        <div className="swim-panel"><span className="swim-panel-label">Treinos</span><h2>Sessões</h2>{sessions.length ? <div className="swim-list">{sessions.slice(0,15).map((item)=><div className="swim-row" key={item.id}><div><strong>{item.tipo_sessao || "Sessão"}</strong><span>{formatDate(item.inicio_real || item.inicio_planejado || item.created_at)}</span></div><span className="swim-pill">{item.status || "registrada"}</span></div>)}</div> : <div className="swim-empty">Nenhuma sessão registrada.</div>}</div>
        <div className="swim-panel"><span className="swim-panel-label">Competições</span><h2>Provas</h2>{participations.length ? <div className="swim-list">{participations.slice(0,15).map((item)=><div className="swim-row" key={item.id}><div><strong>{item.status || "Participação"}</strong><span>{item.tempo_oficial_ms != null ? `${item.tempo_oficial_ms} ms` : "Resultado ainda não registrado"}</span></div><span className="swim-pill">{segments.filter(s=>s.participacao_id===item.id).length} segmentos</span></div>)}</div> : <div className="swim-empty">Nenhuma prova registrada.</div>}</div>
      </section>}

      {tab === "historico" && <section className="swim-panel">
        <span className="swim-panel-label">Histórico</span><h2>Sua história não reinicia</h2>
        <p className="swim-muted">Treinos, provas, avaliações, decisões e respostas permanecem vinculados ao seu contexto longitudinal. Mudanças de categoria, idade, projeto ou fase não apagam o caminho anterior.</p>
        <div className="swim-grid" style={{marginTop:16}}>
          <article className="swim-card"><span>Sessões</span><strong className="swim-kpi">{sessions.length}</strong><p>Treinos disponíveis neste recorte.</p></article>
          <article className="swim-card"><span>Provas</span><strong className="swim-kpi">{participations.length}</strong><p>Participações competitivas.</p></article>
          <article className="swim-card"><span>Avaliações</span><strong className="swim-kpi">{assessments.length}</strong><p>Registros profissionais disponíveis.</p></article>
        </div>
      </section>}
    </SwimmingShell>
  );
}
