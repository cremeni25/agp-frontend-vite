import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const STEPS=["N1 como instituição-base","Projeto N1 · Natação de homologação","Técnico e profissionais","Atleta","Contexto e elegibilidade","Coleta de evidência","Validação da evidência","Cruzamento analítico","Validação do resultado","Intervenção","Resposta à intervenção","Histórico longitudinal"];

export default function MasterHomologationN1(){
 const navigate=useNavigate();
 const [institution,setInstitution]=useState(null),[project,setProject]=useState(null),[participants,setParticipants]=useState([]),[accounts,setAccounts]=useState([]),[eligibility,setEligibility]=useState([]),[cycle,setCycle]=useState({collections:[],executions:[],results:[],validations:[],interventions:[],responses:[]}),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{
  const i=await supabase.from("agp_instituicoes").select("*").ilike("nome","%N1%Academia%").eq("status","ativo").order("created_at",{ascending:false}).limit(1).maybeSingle(); if(i.error)throw i.error; setInstitution(i.data||null); if(!i.data){setProject(null);return;}
  const p=await supabase.from("agp_projetos_validacao").select("*").eq("instituicao_id",i.data.id).eq("status","homologacao").order("created_at",{ascending:false}).limit(1).maybeSingle(); if(p.error)throw p.error; setProject(p.data||null); if(!p.data){setParticipants([]);setAccounts([]);setEligibility([]);return;}
  const [pa,el,c,e,r,it,resp]=await Promise.all([
   supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,status_onboarding,ativo").eq("projeto_id",p.data.id),
   supabase.from("agp_elegibilidade_operacional_projeto").select("participante_id,projeto_id,consentimento_vigente,linha_base_vigente,tecnico_responsavel_valido,apto_coleta,apto_analise,pendencias").eq("projeto_id",p.data.id),
   supabase.from("agp_coletas").select("id,status,bloqueado_para_edicao,liberado_motor_em").eq("projeto_id",p.data.id),
   supabase.from("agp_execucoes_analiticas").select("id,status").eq("projeto_id",p.data.id),
   supabase.from("agp_resultados_analiticos").select("id,status").eq("projeto_id",p.data.id),
   supabase.from("agp_intervencoes").select("id,status").eq("projeto_id",p.data.id),
   supabase.from("agp_respostas_intervencao").select("id,classificacao_resposta").eq("projeto_id",p.data.id)
  ]);
  const first=pa.error||el.error||c.error||e.error||r.error||it.error||resp.error; if(first)throw first; const participantRows=pa.data||[]; setParticipants(participantRows); setEligibility(el.data||[]);
  const personIds=participantRows.map(x=>x.pessoa_id).filter(Boolean); let accountRows=[]; if(personIds.length){const a=await supabase.from("agp_contas_acesso").select("id,pessoa_id,email_acesso,status,auth_id").in("pessoa_id",personIds); if(a.error)throw a.error; accountRows=a.data||[];} setAccounts(accountRows);
  const ids=(r.data||[]).map(x=>x.id); let validations=[]; if(ids.length){const v=await supabase.from("agp_validacoes_profissionais").select("id").in("resultado_id",ids); if(v.error)throw v.error; validations=v.data||[];} setCycle({collections:c.data||[],executions:e.data||[],results:r.data||[],validations,interventions:it.data||[],responses:resp.data||[]});
 }catch(x){setError(x.message)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const professionals=participants.filter(x=>x.funcao_no_projeto!=="atleta"),athletes=participants.filter(x=>x.funcao_no_projeto==="atleta");
 const professionalAccessReady=professionals.some(p=>accounts.some(a=>a.pessoa_id===p.pessoa_id&&a.auth_id));
 const athleteAccessReady=athletes.length>0&&athletes.every(p=>accounts.some(a=>a.pessoa_id===p.pessoa_id&&a.auth_id));
 const firstAthlete=athletes[0]||null;
 const athleteEligibility=firstAthlete?eligibility.find(x=>String(x.participante_id)===String(firstAthlete.id)):null;
 const pending=Array.isArray(athleteEligibility?.pendencias)?athleteEligibility.pendencias:[];
 const validatedEvidence=cycle.collections.filter(x=>x.status==="validada"&&x.bloqueado_para_edicao&&x.liberado_motor_em).length;
 const complete=cycle.responses.length>0;
 const contextReady=Boolean(athleteEligibility?.apto_coleta);
 const progress=useMemo(()=>[Boolean(institution),Boolean(project),professionals.length>0&&professionalAccessReady,athletes.length>0&&athleteAccessReady,contextReady,cycle.collections.length>0,validatedEvidence>0,cycle.executions.some(x=>x.status==="concluida"),cycle.validations.length>0,cycle.interventions.length>0,cycle.responses.length>0,complete],[institution,project,professionals.length,professionalAccessReady,athletes.length,athleteAccessReady,contextReady,cycle,validatedEvidence,complete]);
 let next;
 if(!institution) next={title:"N1 não localizada",text:"A instituição-base precisa existir.",label:"Abrir instituições",path:"/dashboard-master/administracao/instituicoes"};
 else if(!project) next={title:"Criar N1 · Natação de homologação",text:"A N1 já é a instituição real. Agora crie apenas o projeto de Natação para a homologação Master.",label:"Criar projeto de homologação",path:"/dashboard-master/administracao/projetos?context=homologacao"};
 else if(professionals.length===0) next={title:"Cadastrar técnico e profissionais",text:"Defina primeiro quem produzirá, validará e interpretará as evidências da N1 · Natação neste ciclo controlado.",label:"Cadastrar responsáveis",path:"/master/participantes?context=homologacao&role=profissional"};
 else if(!professionalAccessReady) next={title:"Ativar acesso do técnico",text:"O técnico já está vinculado ao projeto, mas ainda precisa receber o convite e autenticar no AGP antes de a etapa 3 ser concluída.",label:"Ativar acesso técnico",path:"/master/homologacao/acesso-tecnico"};
 else if(athletes.length===0) next={title:"Cadastrar atleta de homologação",text:"Depois dos responsáveis com acesso ativo, inclua um atleta controlado para percorrer o ciclo inteiro.",label:"Cadastrar atleta",path:"/master/participantes?context=homologacao&role=atleta"};
 else if(!athleteAccessReady) next={title:"Ativar acesso do atleta",text:"O atleta já está cadastrado e vinculado, mas precisa receber o convite e autenticar no AGP antes de produzir a própria evidência.",label:"Preparar acesso do atleta",path:firstAthlete?`/master/atletas/${firstAthlete.id}`:"/master/atletas"};
 else if(pending.includes("tecnico_responsavel_pendente")) next={title:"Vincular técnico responsável",text:"O atleta já tem acesso, mas ainda precisa de um responsável técnico definido para o ciclo.",label:"Vincular técnico",path:`/master/participantes/operacao?servico=tecnico&instituicao=${institution.id}&projeto=${project.id}&participante=${firstAthlete.id}`};
 else if(pending.includes("consentimento_pendente")) next={title:"Registrar consentimento do atleta",text:"O vínculo técnico está pronto. Registre agora o consentimento operacional antes de qualquer coleta.",label:"Registrar consentimento",path:`/master/participantes/operacao?servico=consentimento&instituicao=${institution.id}&projeto=${project.id}&participante=${firstAthlete.id}`};
 else if(pending.includes("linha_base_pendente")) next={title:"Registrar linha de base",text:"O consentimento está vigente. Complete agora os parâmetros iniciais do atleta para liberar a coleta.",label:"Registrar linha de base",path:`/master/participantes/operacao?servico=linha-base&instituicao=${institution.id}&projeto=${project.id}&participante=${firstAthlete.id}`};
 else next={title:complete?"Ciclo integral alcançado":"Executar primeira evidência",text:complete?"O ciclo chegou à resposta à intervenção.":"Contexto e elegibilidade estão completos. O atleta pode produzir a primeira evidência real do ciclo.",label:complete?"Abrir ciclo":"Continuar ciclo guiado",path:`/master/homologacao/${institution.slug}`};
 return <main className="dashboard-master"><div className="dashboard-overlay master-page"><header className="dashboard-header master-header"><div><span className="master-eyebrow">Homologação Master</span><h1>N1 Academia · Natação</h1><p>A instituição N1 é preservada. Apenas os dados operacionais desta homologação serão controlados.</p></div><button className="master-button secondary" onClick={()=>navigate("/dashboard-master")}>Voltar</button></header>{error&&<div className="master-error">{error}</div>}<section className="master-now-card"><span className="master-eyebrow">Próxima ação</span><h2>{loading?"Lendo estado real...":next.title}</h2><p>{loading?"Verificando o que já existe.":next.text}</p><button className="master-button master-primary-action" disabled={loading} onClick={()=>navigate(next.path)}>{loading?"Aguarde":next.label}</button></section><section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Roteiro obrigatório</span><h2>Todas as etapas</h2></div><strong>{progress.filter(Boolean).length}/{STEPS.length}</strong></div><ol className="master-activity-list">{STEPS.map((s,i)=><li key={s}><div><strong>{String(i+1).padStart(2,"0")}</strong><span>{s}</span></div><b>{progress[i]?"Concluída":"Pendente"}</b></li>)}</ol></section></div></main>;
}
