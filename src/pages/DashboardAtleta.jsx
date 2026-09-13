import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/athlete-home.css";

export default function DashboardAtleta() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [collections, setCollections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const athleteId = perfil?.legacy_perfil_atleta_id || perfil?.id || null;
  const participantId = perfil?.participante_id || null;

  async function load() {
    if (!athleteId) { setLoading(false); return; }
    setLoading(true);
    setError("");

    let collectionsQuery = supabase
      .from("agp_coletas")
      .select("id,data_hora_coleta,status,completude,dados")
      .order("data_hora_coleta", { ascending: false })
      .limit(14);

    collectionsQuery = participantId
      ? collectionsQuery.eq("participante_id", participantId)
      : collectionsQuery.eq("atleta_id", athleteId);

    const [collectionResult, sessionResult, scoreResult, responseResult] = await Promise.all([
      collectionsQuery,
      supabase.from("agp_sessoes_treinamento").select("id,data_hora_inicio,duracao_min,intensidade_percebida,carga_interna,conteudo,intercorrencias").eq("atleta_id", athleteId).order("data_hora_inicio", { ascending: false }).limit(10),
      supabase.from("score_atleta").select("*").eq("atleta_id", athleteId).order("data_calculo", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("agp_respostas_intervencao").select("id,data_avaliacao,classificacao_resposta,confianca,conclusao,recomendacao_proximo_ciclo").eq("atleta_id", athleteId).order("data_avaliacao", { ascending: false }).limit(5)
    ]);

    const firstError = collectionResult.error || sessionResult.error || scoreResult.error;
    if (firstError) setError("Alguns dados do acompanhamento ainda não estão disponíveis para este acesso.");
    setCollections(collectionResult.data || []);
    setSessions(sessionResult.data || []);
    setScore(scoreResult.data || null);
    setResponses(responseResult.error ? [] : responseResult.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [athleteId, participantId]);

  const todayAnswered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return collections.some((item) => String(item.data_hora_coleta || "").slice(0, 10) === today);
  }, [collections]);

  const lastReadiness = collections[0] || null;
  const lastSession = sessions[0] || null;
  const lastResponse = responses[0] || null;

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  if (loading) return <main className="athlete-home"><div className="athlete-home-shell">Carregando seu dia no AGP...</div></main>;

  return <main className="athlete-home"><div className="athlete-home-shell">
    <header className="athlete-home-header">
      <div><span>AGP Sports Intelligence</span><h1>Olá, {perfil?.nome?.split(" ")?.[0] || "atleta"}</h1><p>Seu acompanhamento acontece aqui, um dia de cada vez.</p></div>
      <button onClick={signOut}>Sair</button>
    </header>

    {error && <div className="athlete-home-notice">{error}</div>}

    <section className={`athlete-today-card ${todayAnswered ? "done" : ""}`}>
      <div><span>Hoje</span><h2>{todayAnswered ? "Prontidão registrada" : "Como você está hoje?"}</h2><p>{todayAnswered ? "Seu registro já faz parte da sua linha longitudinal. Continue usando o AGP após os treinos e nos próximos dias." : "Sono, fadiga, dor, estresse, humor e percepção de esforço ajudam o AGP a entender você — não apenas o treino."}</p></div>
      <button onClick={() => navigate("/atleta/prontidao-diaria")}>{todayAnswered ? "Ver / registrar novamente" : "Responder prontidão"}</button>
    </section>

    <section className="athlete-home-grid">
      <article><span>Última evidência</span><strong>{lastReadiness ? new Date(lastReadiness.data_hora_coleta).toLocaleDateString("pt-BR") : "—"}</strong><p>{lastReadiness ? `${lastReadiness.status} · completude ${lastReadiness.completude ?? 0}%` : "Ainda não há prontidão registrada."}</p></article>
      <article><span>Última sessão</span><strong>{lastSession ? new Date(lastSession.data_hora_inicio).toLocaleDateString("pt-BR") : "—"}</strong><p>{lastSession ? `${lastSession.duracao_min || "—"} min · RPE ${lastSession.intensidade_percebida ?? "—"}` : "Nenhuma sessão estruturada disponível."}</p></article>
      <article><span>Leitura global validada</span><strong>{score?.score_global ?? "—"}</strong><p>{score?.nivel_classificacao || "O AGP ainda não possui resultado suficiente para uma classificação."}</p></article>
    </section>

    {lastResponse && <section className="athlete-home-panel">
      <div><span>Retorno da equipe</span><h2>{lastResponse.classificacao_resposta ? `Resposta: ${lastResponse.classificacao_resposta}` : "Resposta acompanhada"}</h2><p>{lastResponse.conclusao || "A equipe registrou a resposta da intervenção no seu histórico."}</p></div>
      <div className="athlete-home-timeline"><div><b>Resposta à intervenção</b><span>{lastResponse.data_avaliacao ? new Date(lastResponse.data_avaliacao).toLocaleString("pt-BR") : "Data não informada"}</span><small>{lastResponse.recomendacao_proximo_ciclo || "O próximo ciclo será definido pela equipe responsável."}</small></div></div>
    </section>}

    <section className="athlete-home-panel">
      <div><span>Seu histórico</span><h2>O AGP aprende com continuidade</h2><p>Uma resposta isolada não define você. O sistema acompanha mudanças ao longo do tempo e cruza recuperação, carga, contexto, intervenção e evolução esportiva antes de devolver uma leitura.</p></div>
      <div className="athlete-home-timeline">
        {collections.length === 0 && sessions.length === 0 && responses.length === 0 ? <p>Nenhuma evidência longitudinal disponível ainda.</p> : <>
          {lastReadiness && <div><b>Prontidão</b><span>{new Date(lastReadiness.data_hora_coleta).toLocaleString("pt-BR")}</span><small>{lastReadiness.status}</small></div>}
          {lastSession && <div><b>Treino</b><span>{new Date(lastSession.data_hora_inicio).toLocaleString("pt-BR")}</span><small>{lastSession.conteudo?.foco || "Sessão registrada"}</small></div>}
          {lastResponse && <div><b>Resposta à intervenção</b><span>{lastResponse.data_avaliacao ? new Date(lastResponse.data_avaliacao).toLocaleString("pt-BR") : "—"}</span><small>{lastResponse.classificacao_resposta || "Resposta registrada"}</small></div>}
        </>}
      </div>
    </section>

    <section className="athlete-home-panel athlete-home-privacy">
      <span>Inteligência responsável</span>
      <h2>Sem respostas inventadas</h2>
      <p>Quando faltarem dados suficientes, o AGP mostrará que ainda não pode concluir. Sinais de dor, saúde mental ou condição clínica não substituem avaliação profissional.</p>
    </section>
  </div></main>;
}
