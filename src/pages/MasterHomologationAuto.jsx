import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { updateProject } from "../services/projectManagement";
import "../styles/dashboard-master.css";

const STEPS=[
 "Criar ambiente de homologação",
 "Criar projeto/modalidade de homologação",
 "Cadastrar técnico e profissionais",
 "Cadastrar atleta",
 "Completar contexto e elegibilidade",
 "Realizar coleta de evidência",
 "Validar evidência profissionalmente",
 "Executar cruzamento analítico",
 "Validar resultado analítico",
 "Registrar intervenção",
 "Registrar resposta à intervenção",
 "Revisar histórico longitudinal"
];

export default function MasterHomologationAuto(){
 const navigate=useNavigate();
 const [state,setState]=useState({institution:null,project:null,participants:[],collections:[],executions:[],results:[],validations:[],interventions:[],responses:[]});
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false),[error,setError]=useState("");

 async function load(){
  setLoading(true);setError("");
  try{
   const i=await supabase.from("agp_instituicoes").select("*").eq("tipo","homologacao").order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(i.error)throw i.error;
   const institution=i.data||null;
   if(!institution){setState({institution:null,project:null,participants:[],collections:[],executions:[],results:[],validations:[],interventions:[],responses:[]});setLoading(false);return;}
   const p=await supabase.from("agp_projetos_validacao").select("*").eq("instituicao_id",institution.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(p.error)throw p.error;
   const project=p.data||null;
   if(!project){setState({institution,project:null,participants:[],collections:[],executions:[],results:[],validations:[],interventions:[],responses:[]});setLoading(false);return;}
   const [pa,c,e,r,it,resp]=await Promise.all([
    supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,status_onboarding,ativo").eq("projeto_id",project.id),
    supabase.from("agp_coletas").select("id,status,bloqueado_para_edicao,liberado_motor_em").eq("projeto_id",project.id),
    supabase.from("agp_execucoes_analiticas").select("id,status").eq("projeto_id",project.id),
    supabase.from("agp_resultados_analiticos").select("id,status").eq("projeto_id",project.id),
    supabase.from("agp_intervencoes").select("id,status").eq("projeto_id",project.id),
    supabase.from("agp_respostas_intervencao").select("id,classificacao_resposta").eq("projeto_id",project.id)
   ]);
   const firstError=pa.error||c.error||e.error||r.error||it.error||resp.error;if(firstError)throw firstError;
   const resultIds=(r.data||[]).map(x=>x.id);let validations=[];
   if(resultIds.length){const v=await supabase.from("agp_validacoes_profissionais").select("id,resultado_id,decisao").in("resultado_id",resultIds);if(v.error)throw v.error;validations=v.data||[];}
   setState({institution,project,participants:pa.data||[],collections:c.data||[],executions:e.data||[],results:r.data||[],validations,interventions:it.data||[],responses:resp.data||[]});
  }catch(x){setError(x.message)}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);

 const technicians=state.participants.filter(x=>["tecnico","treinador","preparador_fisico","medico","fisioterapeuta","psicologo","nutricionista"].includes(x.funcao_no_projeto));
 const athletes=state.participants.filter(x=>x.funcao_no_projeto==="atleta");
 const validatedEvidence=state.collections.filter(x=>x.status==="validada"&&x.bloqueado_para_edicao&&x.liberado_motor_em).length;
 const complete=state.responses.length>0;
 const progress=useMemo(()=>[
  Boolean(state.institution),Boolean(state.project),technicians.length>0,athletes.length>0,
  athletes.some(x=>["ativo","apto_para_coleta"].includes(x.status_onboarding)),state.collections.length>0,validatedEvidence>0,
  state.executions.some(x=>x.status==="concluida"),state.validations.length>0,state.interventions.length>0,state.responses.length>0,complete
 ],[state,technicians.length,athletes.length,validatedEvidence,complete]);

 const next=useMemo(()=>{
  if(!state.institution)return{title:"Etapa 1 — criar o ambiente de homologação",text:"Cadastre você mesmo uma instituição do tipo Homologação. Nenhum dado será criado automaticamente pelo AGP.",label:"Abrir cadastro de instituições",go:()=>navigate("/dashboard-master/administracao/instituicoes?context=homologacao")};
  if(!state.project)return{title:"Etapa 2 — criar o projeto/modalidade",text:"Defina o contexto esportivo que você usará para aprender e validar o AGP inteiro.",label:"Abrir projetos",go:()=>navigate("/dashboard-master/administracao/projetos?context=homologacao")};
  if(technicians.length===0)return{title:"Etapa 3 — cadastrar responsáveis",text:"Inclua técnico e profissionais para conhecer quem produz, valida e interpreta cada informação.",label:"Abrir equipe e participantes",go:()=>navigate("/master/participantes")};
  if(athletes.length===0)return{title:"Etapa 4 — cadastrar atleta",text:"Cadastre um atleta controlado e percorra com ele todas as etapas do sistema.",label:"Abrir participantes",go:()=>navigate("/master/participantes")};
  return{title:complete?"Ciclo integral alcançado":"Continuar ciclo operacional",text:complete?"O AGP já possui resposta à intervenção e histórico suficiente para a decisão final da homologação.":"Agora o ambiente de homologação acompanha o mesmo fluxo operacional que será usado posteriormente por uma instituição real.",label:"Abrir ciclo guiado",go:()=>navigate(`/master/homologacao/${state.institution.slug}`)};
 },[state.institution,state.project,technicians.length,athletes.length,complete,navigate]);

 async function preserve(){if(!state.project)return;setWorking(true);setError("");try{await updateProject(state.project.id,{status:"concluido"});await load();navigate("/dashboard-master")}catch(x){setError(x.message)}finally{setWorking(false)}}

 return <main className="dashboard-master"><div className="dashboard-overlay master-page">
  <header className="dashboard-header master-header"><div><span className="master-eyebrow">Homologação Master</span><h1>Aprender e validar o AGP inteiro antes da N1</h1><p>Você insere os dados, percorre todas as responsabilidades e observa todas as devolutivas. O sistema não fabrica instituição, equipe, atleta ou evidência.</p></div><button className="master-button secondary" onClick={()=>navigate("/dashboard-master")}>Voltar</button></header>
  {error&&<div className="master-error" role="alert">{error}</div>}
  <section className="master-now-card"><span className="master-eyebrow">Próxima ação</span><h2>{loading?"Lendo estado real...":next.title}</h2><p>{loading?"O AGP está verificando o que você já executou.":next.text}</p><button className="master-button master-primary-action" disabled={loading} onClick={next.go}>{loading?"Aguarde":next.label}</button></section>
  <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Roteiro obrigatório</span><h2>Todas as etapas</h2></div><strong>{progress.filter(Boolean).length}/{STEPS.length}</strong></div><ol className="master-activity-list">{STEPS.map((s,i)=><li key={s}><div><strong>{String(i+1).padStart(2,"0")}</strong><span>{s}</span></div><b>{progress[i]?"Concluída":"Pendente"}</b></li>)}</ol></section>
  <section className="master-panel"><span className="master-eyebrow">Decisão final do Master</span><h2>Preservar ou excluir a homologação</h2><p>Ao final do ciclo, você poderá manter o histórico como referência de treinamento e auditoria ou excluir integralmente os dados de homologação sem atingir estrutura, ciência ou dados reais.</p><div className="master-header-actions"><button className="master-button" disabled={!complete||working} onClick={preserve}>{working?"Salvando...":"Preservar histórico e homologar"}</button><button className="master-button danger" disabled={!complete||working} onClick={()=>setError("A exclusão integral será habilitada após a verificação referencial de todas as tabelas operacionais desta homologação.")}>Excluir homologação</button></div></section>
 </div></main>;
}
