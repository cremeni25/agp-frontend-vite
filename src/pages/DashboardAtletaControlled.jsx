import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/athlete-home.css";

export default function DashboardAtletaControlled() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const athleteId = perfil?.legacy_perfil_atleta_id || perfil?.id || null;
  const participantId = perfil?.participante_id || null;
  const [collections,setCollections]=useState([]),[sessions,setSessions]=useState([]),[responses,setResponses]=useState([]),[score,setScore]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");

  async function load(){
    if(!athleteId){setLoading(false);return;}
    setLoading(true);setError("");
    let cq=supabase.from("agp_coletas").select("id,data_hora_coleta,status,completude").order("data_hora_coleta",{ascending:false}).limit(14);
    cq=participantId?cq.eq("participante_id",participantId):cq.eq("atleta_id",athleteId);
    const [c,s,sc,r]=await Promise.all([
      cq,
      supabase.from("agp_sessoes_treinamento").select("id,data_hora_inicio,duracao_min,intensidade_percebida,conteudo").eq("atleta_id",athleteId).order("data_hora_inicio",{ascending:false}).limit(10),
      supabase.from("score_atleta").select("*").eq("atleta_id",athleteId).order("data_calculo",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("agp_respostas_intervencao").select("id,data_avaliacao,classificacao_resposta,conclusao,recomendacao_proximo_ciclo").eq("atleta_id",athleteId).eq("visivel_atleta",true).order("data_avaliacao",{ascending:false}).limit(5)
    ]);
    if(c.error||s.error||sc.error)setError("Alguns dados do acompanhamento ainda não estão disponíveis para este acesso.");
    setCollections(c.data||[]);setSessions(s.data||[]);setScore(sc.data||null);setResponses(r.error?[]:r.data||[]);setLoading(false);
  }

  useEffect(()=>{load()},[athleteId,participantId]);
  const lastReadiness=collections[0]||null,lastSession=sessions[0]||null,lastResponse=responses[0]||null;
  const today=new Date().toISOString().slice(0,10),todayAnswered=collections.some(x=>String(x.data_hora_coleta||"").slice(0,10)===today);
  async function signOut(){await supabase.auth.signOut();navigate("/login",{replace:true});}
  if(loading)return <main className="athlete-home"><div className="athlete-home-shell">Carregando seu dia no AGP...</div></main>;

  return <main className="athlete-home"><div className="athlete-home-shell">
    <header className="athlete-home-header"><div><span>AGP Sports Intelligence</span><h1>Olá, {perfil?.nome?.split(" ")?.[0]||"atleta"}</h1><p>Seu acompanhamento acontece aqui, um dia de cada vez.</p></div><button onClick={signOut}>Sair</button></header>
    {error&&<div className="athlete-home-notice">{error}</div>}
    <section className={`athlete-today-card ${todayAnswered?"done":""}`}><div><span>Hoje</span><h2>{todayAnswered?"Prontidão registrada":"Como você está hoje?"}</h2><p>{todayAnswered?"Seu registro já faz parte da sua linha longitudinal.":"Sono, fadiga, dor, estresse, humor e percepção de esforço ajudam o AGP a acompanhar você."}</p></div><button onClick={()=>navigate("/atleta/prontidao-diaria")}>{todayAnswered?"Registrar novamente":"Responder prontidão"}</button></section>
    <section className="athlete-home-grid"><article><span>Última evidência</span><strong>{lastReadiness?new Date(lastReadiness.data_hora_coleta).toLocaleDateString("pt-BR"):"—"}</strong><p>{lastReadiness?`${lastReadiness.status} · completude ${lastReadiness.completude??0}%`:"Ainda não há prontidão registrada."}</p></article><article><span>Última sessão</span><strong>{lastSession?new Date(lastSession.data_hora_inicio).toLocaleDateString("pt-BR"):"—"}</strong><p>{lastSession?`${lastSession.duracao_min||"—"} min · RPE ${lastSession.intensidade_percebida??"—"}`:"Nenhuma sessão estruturada disponível."}</p></article><article><span>Leitura global validada</span><strong>{score?.score_global??"—"}</strong><p>{score?.nivel_classificacao||"Ainda não há resultado suficiente para classificação."}</p></article></section>
    {lastResponse&&<section className="athlete-home-panel"><div><span>Retorno liberado pela equipe</span><h2>{lastResponse.classificacao_resposta?`Resposta: ${lastResponse.classificacao_resposta}`:"Resposta acompanhada"}</h2><p>{lastResponse.conclusao}</p></div><div className="athlete-home-timeline"><div><b>Próximo ciclo</b><span>{lastResponse.data_avaliacao?new Date(lastResponse.data_avaliacao).toLocaleString("pt-BR"):"—"}</span><small>{lastResponse.recomendacao_proximo_ciclo||"A equipe responsável definirá o próximo passo."}</small></div></div></section>}
    <section className="athlete-home-panel athlete-home-privacy"><span>Inteligência responsável</span><h2>Retorno adequado ao seu papel</h2><p>O atleta recebe apenas conteúdos liberados pela equipe. Discussões técnicas internas, hipóteses profissionais e dados não autorizados permanecem restritos.</p></section>
  </div></main>;
}
