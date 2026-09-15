import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import InstitutionBrand from "../components/InstitutionBrand";
import "../styles/dashboard-master.css";
import "../styles/institution-brand.css";

export default function DashboardMaster(){
 const navigate=useNavigate();
 const [participants,setParticipants]=useState([]),[technicalMembers,setTechnicalMembers]=useState([]),[institutions,setInstitutions]=useState([]),[projects,setProjects]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function loadDashboard(){
  setLoading(true);setError("");
  const [p,t,i,j]=await Promise.all([
   supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,funcao_no_projeto,status_onboarding,ativo"),
   supabase.from("agp_membros_instituicao").select("id,auth_id,instituicao_id,ativo,papel"),
   supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,tipo,localidade,status,logo_url,cor_primaria,cor_secundaria").order("created_at",{ascending:true}),
   supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,status").order("created_at",{ascending:true})
  ]);
  const e=p.error||t.error||i.error||j.error;
  if(e)setError(`Falha ao carregar o centro operacional: ${e.message}`);
  setParticipants(p.data||[]);setTechnicalMembers(t.data||[]);setInstitutions(i.data||[]);setProjects(j.data||[]);setLoading(false);
 }
 useEffect(()=>{loadDashboard()},[]);
 const activeInstitution=useMemo(()=>institutions.find(x=>x.status==="ativo")||null,[institutions]);
 const activeProjects=useMemo(()=>projects.filter(x=>!["concluido","suspenso"].includes(x.status)),[projects]);
 const summary=useMemo(()=>({
  athletes:new Set(participants.filter(x=>x.ativo&&x.funcao_no_projeto==="atleta").map(x=>x.pessoa_id).filter(Boolean)).size,
  professionals:new Set(technicalMembers.filter(x=>x.ativo).map(x=>x.auth_id||x.id).filter(Boolean)).size,
  institutions:institutions.filter(x=>x.status==="ativo").length,
  projects:activeProjects.length,
  participantAttention:participants.filter(x=>x.ativo&&!["ativo","apto_para_coleta"].includes(x.status_onboarding)).length
 }),[participants,technicalMembers,institutions,activeProjects]);
 const nextAction=useMemo(()=>{
  if(loading)return{title:"Consolidando a operação",description:"O AGP está verificando instituição, projeto esportivo, equipe, participantes e pendências.",label:"Aguarde",disabled:true};
  if(summary.institutions===0)return{title:"Estruturar a primeira instituição",description:"Sem instituição ativa não existe contexto operacional válido para projeto, equipe, participantes ou evidências.",label:"Abrir instituições",path:"/dashboard-master/administracao/instituicoes"};
  if(summary.projects===0)return{title:"Estruturar a modalidade Natação",description:`${activeInstitution?.nome_exibicao||activeInstitution?.nome||"A instituição"} já existe. Agora o AGP precisa do contexto esportivo que organizará equipe, atletas, evidências e decisões.`,label:"Criar projeto de Natação",path:"/dashboard-master/administracao/projetos?context=natacao"};
  if(summary.professionals===0)return{title:"Vincular a equipe responsável",description:"O contexto esportivo existe. Agora o ciclo precisa dos profissionais responsáveis pela produção, validação e interpretação das evidências.",label:"Abrir equipe técnica",path:"/dashboard-master/administracao/equipe-tecnica"};
  if(summary.athletes===0)return{title:"Vincular os primeiros atletas",description:"Instituição, modalidade e equipe estão estruturadas. Agora o AGP precisa dos atletas que percorrerão o ciclo operacional.",label:"Abrir participantes",path:"/master/participantes"};
  if(summary.participantAttention>0)return{title:`${summary.participantAttention} participante${summary.participantAttention>1?"s":""} exige${summary.participantAttention>1?"m":""} atenção`,description:"Resolva primeiro pendências de vínculo, acesso, elegibilidade ou preparação que impedem o ciclo.",label:"Resolver pendências",path:"/master/participantes"};
  return{title:"Executar o ciclo N1 Natação",description:"Instituição, modalidade, equipe e atletas estão prontos. O próximo passo é validar evidência → inteligência → intervenção → resposta → histórico.",label:"Abrir ciclo operacional",path:"/master/homologacao"};
 },[loading,summary,activeInstitution]);
 async function signOut(){await supabase.auth.signOut();navigate("/login",{replace:true});}
 return <main className="dashboard-master"><div className="dashboard-overlay master-page">
 <header className="dashboard-header master-header"><div><span className="master-eyebrow">AGP Sports Intelligence</span><h1>Centro operacional</h1><p>O Master coordena o sistema inteiro: instituição, modalidade, equipe, participantes, evidência, inteligência e governança.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={loadDashboard}>Atualizar</button><button className="master-button danger" onClick={signOut}>Sair</button></div></header>
 {activeInstitution&&<div className="institution-brand-preview"><InstitutionBrand institution={activeInstitution}/></div>}
 {error&&<div className="master-error" role="alert">{error}</div>}
 <section className="master-now-card"><span className="master-eyebrow">Próxima ação do sistema</span><h2>{nextAction.title}</h2><p>{nextAction.description}</p><button className="master-button master-primary-action" disabled={nextAction.disabled} onClick={()=>nextAction.path&&navigate(nextAction.path)}>{nextAction.label}</button></section>
 <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Situação estrutural</span><h2>Capacidade operacional</h2></div></div><div className="dashboard-section grid master-summary-grid"><div className="card master-metric"><span>Instituições ativas</span><strong>{loading?"…":summary.institutions}</strong></div><div className="card master-metric"><span>Projetos esportivos</span><strong>{loading?"…":summary.projects}</strong></div><div className="card master-metric"><span>Profissionais vinculados</span><strong>{loading?"…":summary.professionals}</strong></div><div className="card master-metric"><span>Atletas ativos</span><strong>{loading?"…":summary.athletes}</strong></div><div className="card master-metric"><span>Pendências de participantes</span><strong>{loading?"…":summary.participantAttention}</strong></div></div></section>
 <details className="master-secondary-area"><summary>Operações especializadas</summary><section className="dashboard-section"><div className="master-action-grid"><button className="master-action-card" onClick={()=>navigate("/master/participantes")}><strong>Participantes</strong><span>Identidade, vínculos, acesso e elegibilidade.</span></button><button className="master-action-card" onClick={()=>navigate("/master/coletas")}><strong>Evidências</strong><span>Coleta contextual e rastreável.</span></button><button className="master-action-card" onClick={()=>navigate("/master/validacao-profissional")}><strong>Validação profissional</strong><span>Separar coleta concluída de evidência liberada.</span></button><button className="master-action-card" onClick={()=>navigate("/master/pipeline-analitico")}><strong>Cruzamento analítico</strong><span>Processar somente o que estiver validado.</span></button><button className="master-action-card" onClick={()=>navigate("/master/catalogo-cientifico")}><strong>Protocolos e instrumentos</strong><span>Base científica e versionamento.</span></button><button className="master-action-card" onClick={()=>navigate("/dashboard-master/administracao")}><strong>Administração</strong><span>Instituições, projetos, equipe, usuários e perfis.</span></button><button className="master-action-card" onClick={()=>navigate("/master/homologacao")}><strong>Ciclo operacional</strong><span>Validar o sistema ponta a ponta com dados reais da N1.</span></button></div></section></details>
 </div></main>;
}