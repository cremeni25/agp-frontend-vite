import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import InstitutionBrand from "../components/InstitutionBrand";
import "../styles/dashboard-master.css";
import "../styles/institution-brand.css";

export default function DashboardMaster(){
 const navigate=useNavigate();
 const [participants,setParticipants]=useState([]),[institutions,setInstitutions]=useState([]),[projects,setProjects]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function loadDashboard(){
  setLoading(true);setError("");
  const [p,i,j]=await Promise.all([
   supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,funcao_no_projeto,status_onboarding,ativo"),
   supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,tipo,localidade,status,logo_url,cor_primaria,cor_secundaria").order("created_at",{ascending:true}),
   supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,status").order("created_at",{ascending:true})
  ]);
  const e=p.error||i.error||j.error;
  if(e)setError(`Falha ao carregar o centro operacional: ${e.message}`);
  setParticipants(p.data||[]);setInstitutions(i.data||[]);setProjects(j.data||[]);setLoading(false);
 }
 useEffect(()=>{loadDashboard()},[]);
 const n1=useMemo(()=>institutions.find(x=>x.slug==="n1-academia")||institutions.find(x=>String(x.nome||"").toLowerCase().includes("n1 academia"))||null,[institutions]);
 const homologationProject=useMemo(()=>projects.find(x=>x.instituicao_id===n1?.id&&x.status==="homologacao")||null,[projects,n1]);
 const homologationCompleted=useMemo(()=>projects.some(x=>x.instituicao_id===n1?.id&&x.status==="concluido"),[projects,n1]);
 const realProjects=useMemo(()=>projects.filter(x=>x.instituicao_id===n1?.id&&!["homologacao","concluido","suspenso"].includes(x.status)),[projects,n1]);
 const summary=useMemo(()=>({
  athletes:new Set(participants.filter(x=>x.ativo&&x.funcao_no_projeto==="atleta").map(x=>x.pessoa_id).filter(Boolean)).size,
  professionals:new Set(participants.filter(x=>x.ativo&&x.funcao_no_projeto!=="atleta").map(x=>x.pessoa_id).filter(Boolean)).size,
  institutions:institutions.filter(x=>x.status==="ativo"&&x.tipo!=="homologacao").length,
  projects:realProjects.length,
  participantAttention:participants.filter(x=>x.ativo&&!["ativo","apto_para_coleta"].includes(x.status_onboarding)).length
 }),[participants,institutions,realProjects]);
 const nextAction=useMemo(()=>{
  if(loading)return{title:"Consolidando a operação",description:"O AGP está verificando homologação, instituição, modalidade, equipe, participantes e pendências.",label:"Aguarde",disabled:true};
  if(!homologationCompleted)return{title:"Homologar integralmente o AGP como Master",description:"Antes de liberar a N1, percorra o sistema real de ponta a ponta, inserindo dados controlados, conhecendo cada responsabilidade e validando todas as devolutivas.",label:homologationProject?"Continuar homologação":"Iniciar homologação Master",path:"/master/homologacao"};
  if(summary.projects===0)return{title:"Estruturar a modalidade Natação",description:"A homologação Master foi concluída. Agora a N1 pode iniciar o primeiro contexto esportivo real na modalidade Natação.",label:"Criar projeto de Natação",path:"/dashboard-master/administracao/projetos?context=natacao"};
  if(summary.professionals===0)return{title:"Vincular a equipe responsável",description:"O contexto esportivo real existe. Agora o ciclo precisa dos profissionais responsáveis.",label:"Abrir equipe técnica",path:"/dashboard-master/administracao/equipe-tecnica"};
  if(summary.athletes===0)return{title:"Vincular os primeiros atletas",description:"Instituição, modalidade e equipe estão estruturadas. Agora entram os atletas reais.",label:"Abrir participantes",path:"/master/participantes"};
  return{title:"Executar o ciclo N1 Natação",description:"O ciclo real pode avançar para evidência, inteligência, intervenção, resposta e histórico.",label:"Abrir ciclo operacional",path:"/master/homologacao"};
 },[loading,homologationCompleted,homologationProject,summary]);
 async function signOut(){await supabase.auth.signOut();navigate("/login",{replace:true});}
 return <main className="dashboard-master"><div className="dashboard-overlay master-page">
 <header className="dashboard-header master-header"><div><span className="master-eyebrow">AGP Sports Intelligence</span><h1>Centro operacional</h1><p>O Master coordena o sistema inteiro: homologação, instituição, modalidade, equipe, participantes, evidência, inteligência e governança.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={loadDashboard}>Atualizar</button><button className="master-button danger" onClick={signOut}>Sair</button></div></header>
 {n1&&<div className="institution-brand-preview"><InstitutionBrand institution={n1}/></div>}
 {error&&<div className="master-error" role="alert">{error}</div>}
 <section className="master-now-card"><span className="master-eyebrow">Próxima ação do sistema</span><h2>{nextAction.title}</h2><p>{nextAction.description}</p><button className="master-button master-primary-action" disabled={nextAction.disabled} onClick={()=>nextAction.path&&navigate(nextAction.path)}>{nextAction.label}</button></section>
 <section className="dashboard-section"><div className="master-section-heading"><div><span className="master-eyebrow">Situação estrutural</span><h2>Capacidade operacional real</h2></div></div><div className="dashboard-section grid master-summary-grid"><div className="card master-metric"><span>Homologação Master</span><strong>{loading?"…":homologationCompleted?"OK":homologationProject?"EM CURSO":"PENDENTE"}</strong></div><div className="card master-metric"><span>Instituições reais ativas</span><strong>{loading?"…":summary.institutions}</strong></div><div className="card master-metric"><span>Projetos esportivos reais</span><strong>{loading?"…":summary.projects}</strong></div><div className="card master-metric"><span>Profissionais vinculados</span><strong>{loading?"…":summary.professionals}</strong></div><div className="card master-metric"><span>Atletas ativos</span><strong>{loading?"…":summary.athletes}</strong></div></div></section>
 <details className="master-secondary-area"><summary>Operações especializadas</summary><section className="dashboard-section"><div className="master-action-grid"><button className="master-action-card" onClick={()=>navigate("/master/homologacao")}><strong>Homologação Master</strong><span>Conhecer e validar todo o AGP antes do piloto real.</span></button><button className="master-action-card" onClick={()=>navigate("/master/participantes")}><strong>Participantes</strong><span>Identidade, vínculos, acesso e elegibilidade.</span></button><button className="master-action-card" onClick={()=>navigate("/master/coletas")}><strong>Evidências</strong><span>Coleta contextual e rastreável.</span></button><button className="master-action-card" onClick={()=>navigate("/master/validacao-profissional")}><strong>Validação profissional</strong><span>Revisão humana da evidência e do resultado.</span></button><button className="master-action-card" onClick={()=>navigate("/master/pipeline-analitico")}><strong>Cruzamento analítico</strong><span>Processar somente evidência validada.</span></button><button className="master-action-card" onClick={()=>navigate("/dashboard-master/administracao")}><strong>Administração</strong><span>Instituições, projetos, equipe, usuários e perfis.</span></button></div></section></details>
 </div></main>;
}
