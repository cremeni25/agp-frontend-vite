import { useEffect,useMemo,useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import { getAthleteIntelligence,getAthleteIndividualIntelligence } from "../services/athleteIntelligence";
import { inviteParticipantAccess } from "../services/participantOnboarding";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import AthleteEvolutionDashboard from "../components/AthleteEvolutionDashboard";

export default function MasterAthleteProfile(){
 const navigate=useNavigate(),{participantId}=useParams();
 const [data,setData]=useState(null),[individual,setIndividual]=useState(null),[access,setAccess]=useState(null),[loading,setLoading]=useState(true),[working,setWorking]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");

 async function load(){
  setLoading(true);setError("");
  try{
    const [cockpit,intelligence]=await Promise.all([getAthleteIntelligence(participantId),getAthleteIndividualIntelligence(participantId)]);
    setData(cockpit);setIndividual(intelligence);
    const personId=cockpit?.pessoa?.id;
    if(personId){
      const result=await supabase.from("agp_contas_acesso").select("id,status,email_acesso,auth_id").eq("pessoa_id",personId).maybeSingle();
      if(result.error)throw result.error;
      setAccess(result.data||null);
    }else setAccess(null);
  }catch(x){
    setError(`Falha ao carregar o atleta: ${x.message}`);
    setData(null);setIndividual(null);setAccess(null);
  }finally{setLoading(false)}
 }

 useEffect(()=>{load()},[participantId]);

 const contextQuery=useMemo(()=>!data?"":new URLSearchParams({
   instituicao:data.instituicao?.id||"",
   projeto:data.projeto?.id||"",
   participante:data.participante?.id||participantId
 }).toString(),[data,participantId]);

 function openService(service){navigate(`/master/participantes/operacao?${contextQuery}&servico=${service}`)}
 function openDestination(destination){
   if(!data)return;
   if(["tecnico","consentimento","linha-base","elegibilidade"].includes(destination))return openService(destination);
   const query=new URLSearchParams({projeto:data.projeto?.id||"",participante:data.participante?.id||participantId}).toString();
   if(destination==="catalogo-cientifico")return navigate(`/master/catalogo-cientifico?${query}`);
   if(destination==="coletas")return navigate(`/master/coletas?${query}`);
   if(destination==="pipeline-analitico")return navigate(`/master/pipeline-analitico?${query}`);
   if(destination==="validacao-profissional")return navigate(`/master/validacao-profissional?${query}`);
   openService("elegibilidade");
 }

 async function activateAccess(){
   setWorking(true);setError("");setMessage("");
   try{
     await inviteParticipantAccess(participantId);
     setMessage("Ativação de acesso enviada para o atleta.");
     await load();
   }catch(x){setError(`Falha ao ativar acesso: ${x.message}`)}
   finally{setWorking(false)}
 }

 const person=data?.pessoa||{},next=data?.proxima_acao||{},pending=data?.elegibilidade?.pendencias||[],coverage=individual?.cobertura||{},practical=individual?.devolucao_pratica||individual?.devolucao||{},readiness=individual?.prontidao_individual||individual?.prontidao||{},signals=readiness?.sinais||[];
 const accessPending=access?.status==="acesso_pendente"&&!access?.auth_id;
 const primary=accessPending?{titulo:"Ativar acesso do atleta",descricao:`O acesso de ${person.nome||"atleta"} ainda está pendente.`,action:activateAccess}:next;

 return <SwimmingShell
   eyebrow="Governança · Atleta"
   title={person.nome||"Atleta"}
   subtitle="Acompanhamento longitudinal, evidência, contexto e evolução em uma única experiência AGP Swim."
   actions={[
     {label:"Voltar aos atletas",onClick:()=>navigate("/master/atletas")},
     {label:"Atualizar",onClick:load}
   ]}
 >
   {message&&<div className="workflow-success">{message}</div>}
   {error&&<div className="workflow-error">{error}</div>}

   {loading?<section className="swim-panel"><div className="swim-empty">Preparando acompanhamento...</div></section>:data&&<>
     <section className="swim-focus">
       <div>
         <span className="swim-eyebrow">Próxima ação</span>
         <h2>{primary.titulo||"Acompanhamento em dia"}</h2>
         <p>{primary.descricao||"Nenhuma pendência operacional imediata."}</p>
         {pending.length>0&&<p className="swim-muted">Pendências: {pending.join(" · ")}</p>}
       </div>
       <button className="swim-primary" disabled={working} onClick={accessPending?activateAccess:()=>openDestination(next.destino)}>
         {working?"Processando...":primary.titulo||"Revisar acompanhamento"}
       </button>
     </section>

     <section className="swim-grid">
       <article className="swim-card">
         <span>Cobertura de dados</span>
         <strong className="swim-kpi">{coverage.cobertura_percentual??0}%</strong>
         <p>{coverage.estado_cobertura?String(coverage.estado_cobertura).replaceAll("_"," "):"Aguardando evidência"}</p>
       </article>
       <article className="swim-card">
         <span>Ação prioritária</span>
         <strong>{practical.acao_prioritaria||"Coletar evidência"}</strong>
         <p>{coverage.nota||"Cobertura operacional não representa score de performance, risco ou prontidão."}</p>
       </article>
       <article className="swim-card">
         <span>Instituição</span>
         <strong>{data.instituicao?.nome||"—"}</strong>
         <p>{data.projeto?.nome||"Projeto não identificado"}</p>
       </article>
       <article className="swim-card">
         <span>Status de acesso</span>
         <strong>{access?.status||"sem conta"}</strong>
         <p>{access?.email_acesso||"Acesso ainda não configurado."}</p>
       </article>
     </section>

     <section className="swim-panel">
       <div className="swim-panel-head">
         <div><span className="swim-panel-label">Operação autorizada</span><h2>Acompanhar sem substituir o profissional</h2></div>
       </div>
       <div className="workflow-actions">
         <button className="swim-primary" onClick={()=>navigate(`/master/atletas/${participantId}/dia`)}>Operação do dia</button>
         <button className="swim-secondary" onClick={()=>navigate(`/master/atletas/${participantId}/decisao`)}>Decisão multidisciplinar</button>
       </div>
     </section>

     <AthleteEvolutionDashboard participantId={participantId} role="master" embedded />

     <section className="swim-panel">
       <span className="swim-panel-label">Histórico, contexto e governança</span>
       <h2>Estrutura do acompanhamento</h2>
       <div className="swim-grid" style={{marginTop:16}}>
         <article className="swim-card"><span>Modalidade</span><strong>{data.perfil_esportivo?.modalidade||"Não informada"}</strong><p>{data.perfil_esportivo?.categoria||"Categoria não informada"}</p></article>
         <article className="swim-card"><span>Evidências</span><strong>{data.jornada?.coleta?.total||0}</strong><p>{data.jornada?.coleta?.validadas||0} validada(s) para análise.</p></article>
         <article className="swim-card"><span>Conta</span><strong>{access?.status||"sem conta"}</strong><p>{access?.email_acesso||"Acesso do atleta ainda não configurado."}</p></article>
       </div>
       <div className="workflow-actions" style={{marginTop:16}}>
         <button className="swim-secondary" onClick={()=>openService("tecnico")}>Técnico</button>
         <button className="swim-secondary" onClick={()=>openService("consentimento")}>Consentimento</button>
         <button className="swim-secondary" onClick={()=>openService("linha-base")}>Linha de base</button>
         <button className="swim-secondary" onClick={()=>openService("elegibilidade")}>Elegibilidade</button>
       </div>
     </section>
   </>}
 </SwimmingShell>;
}
