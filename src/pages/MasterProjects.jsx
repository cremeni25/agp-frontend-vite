import {useEffect,useMemo,useState} from "react";
import {useLocation,useNavigate} from "react-router-dom";
import {listInstitutions} from "../services/institutionManagement";
import {createProject,deleteProject,listProjects,updateProject} from "../services/projectManagement";
import InstitutionBrand from "../components/InstitutionBrand";
import "../styles/dashboard-master.css";
import "../styles/institution-brand.css";

const EMPTY={instituicao_id:"",nome:"",objetivo:"",metodologia:"",diretrizes:"",localidade:"",data_inicio:"",data_fim:"",status:"preparacao",versao_motor:"agp-core-v2.1-traceable"};
const STATUS_LABEL={preparacao:"Preparação",homologacao:"Homologação",em_campo:"Em campo",concluido:"Concluído",suspenso:"Suspenso"};

export default function MasterProjects(){
 const navigate=useNavigate(),location=useLocation();
 const params=new URLSearchParams(location.search),context=params.get("context");
 const contextualNatacao=context==="natacao",contextualHomologacao=context==="homologacao";
 const [institutions,setInstitutions]=useState([]),[projects,setProjects]=useState([]),[form,setForm]=useState(EMPTY),[editingId,setEditingId]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 function preferredInstitution(items){
  if(!items?.length)return null;
  if(contextualHomologacao)return items.find(x=>x.nome==="N1 Academia")||items.find(x=>x.status==="ativo")||items[0];
  return items[0];
 }
 async function load(){setLoading(true);setError("");try{const[i,p]=await Promise.all([listInstitutions(),listProjects()]);const inst=i||[];setInstitutions(inst);setProjects(p||[]);const preferred=preferredInstitution(inst);setForm(current=>({...current,instituicao_id:preferred?.id||current.instituicao_id||"",status:contextualHomologacao?"homologacao":current.status}));}catch(e){setError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const n1=useMemo(()=>institutions.find(x=>x.nome==="N1 Academia")||institutions.find(x=>x.status==="ativo")||null,[institutions]);
 const swimming=useMemo(()=>projects.find(x=>x.instituicao_id===n1?.id&&/nata[cç][aã]o/i.test(x.nome||""))||null,[projects,n1]);
 async function activate(){if(!n1)return;setSaving(true);setError("");try{await createProject({instituicao_id:n1.id,nome:"N1 Academia · Natação",objetivo:"Operar o ciclo longitudinal do AGP na modalidade Natação, integrando contexto esportivo, evidências, validação profissional, inteligência, intervenção, resposta e histórico do atleta.",metodologia:null,diretrizes:null,localidade:n1.localidade||null,data_inicio:null,data_fim:null,status:"preparacao",versao_motor:"agp-core-v2.1-traceable"});await load();navigate("/dashboard-master",{replace:true})}catch(e){setError(e.message)}finally{setSaving(false)}}
 function change(e){const{name,value}=e.target;setForm(current=>({...current,[name]:value}))}
 function reset(){setEditingId(null);const preferred=preferredInstitution(institutions);setForm({...EMPTY,instituicao_id:preferred?.id||"",status:contextualHomologacao?"homologacao":"preparacao"})}
 async function submit(e){
  e.preventDefault();setSaving(true);setError("");setMessage("");
  const effectiveInstitutionId=contextualHomologacao?n1?.id:form.instituicao_id;
  const payload={
   instituicao_id:effectiveInstitutionId||"",
   nome:form.nome.trim(),
   objetivo:form.objetivo.trim(),
   metodologia:form.metodologia.trim()||null,
   diretrizes:form.diretrizes.trim()||null,
   localidade:form.localidade.trim()||null,
   data_inicio:form.data_inicio||null,
   data_fim:form.data_fim||null,
   status:contextualHomologacao?"homologacao":form.status,
   versao_motor:form.versao_motor||"agp-core-v2.1-traceable"
  };
  if(!payload.instituicao_id){setError("A instituição N1 não foi vinculada. Atualize a tela e tente novamente.");setSaving(false);return;}
  try{if(editingId){await updateProject(editingId,payload);setMessage("Projeto atualizado.")}else{await createProject(payload);setMessage("Projeto criado.")}reset();await load();if(contextualHomologacao)navigate("/master/homologacao")}catch(x){setError(x.message)}finally{setSaving(false)}
 }
 function edit(p){setEditingId(p.id);setForm({instituicao_id:p.instituicao_id||"",nome:p.nome||"",objetivo:p.objetivo||"",metodologia:p.metodologia||"",diretrizes:p.diretrizes||"",localidade:p.localidade||"",data_inicio:p.data_inicio||"",data_fim:p.data_fim||"",status:p.status||"preparacao",versao_motor:p.versao_motor||"agp-core-v2.1-traceable"});window.scrollTo({top:0,behavior:"smooth"})}
 async function remove(p){if(!window.confirm(`Excluir o projeto ${p.nome}?`))return;try{await deleteProject(p.id);await load()}catch(x){setError(x.message)}}
 if(contextualNatacao)return <main className="dashboard-master"><div className="dashboard-overlay master-page"><header className="dashboard-header master-header"><div><span className="master-eyebrow">Ativação esportiva real</span><h1>N1 Academia · Natação</h1><p>Esta etapa será usada somente depois da homologação integral do Master.</p></div><button className="master-button secondary" onClick={()=>navigate("/dashboard-master")}>Voltar</button></header>{n1&&<div className="institution-brand-preview"><InstitutionBrand institution={n1}/></div>}{error&&<div className="master-feedback error">{error}</div>}<section className="master-now-card"><h2>Natação</h2>{loading?<button className="master-button" disabled>Carregando...</button>:swimming?<button className="master-button" onClick={()=>navigate("/dashboard-master")}>Voltar ao Centro Operacional</button>:<button className="master-button" disabled={saving||!n1} onClick={activate}>{saving?"Ativando...":"Ativar Natação na N1"}</button>}</section></div></main>;
 return <main className="dashboard-master"><div className="dashboard-overlay master-page">
  <header className="dashboard-header master-header"><div><span className="master-eyebrow">{contextualHomologacao?"Homologação Master":"Núcleo Administrativo"}</span><h1>{contextualHomologacao?"Criar projeto de homologação":"Projetos"}</h1><p>{contextualHomologacao?"Preencha você mesmo o contexto esportivo que será usado para conhecer e testar o AGP.":"Projetos operacionais vinculados às instituições."}</p></div><button className="master-button secondary" onClick={()=>navigate(contextualHomologacao?"/master/homologacao":"/dashboard-master/administracao")}>Voltar</button></header>
  {message&&<div className="master-feedback success">{message}</div>}{error&&<div className="master-feedback error">{error}</div>}
  <section className="dashboard-section master-split"><form className="master-panel" onSubmit={submit}><span className="master-eyebrow">Dados do Master</span><h2>{editingId?"Editar projeto":"Novo projeto"}</h2>
   <label>Instituição<select name="instituicao_id" value={contextualHomologacao?(n1?.id||""):form.instituicao_id} onChange={change} required disabled={contextualHomologacao}>{institutions.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>
   <label>Nome do projeto / modalidade<input name="nome" value={form.nome} onChange={change} required placeholder="Ex.: Homologação Natação"/></label>
   <label>Objetivo<textarea name="objetivo" value={form.objetivo} onChange={change} required rows="3" placeholder="O que você pretende validar neste ciclo?"/></label>
   <label>Metodologia<textarea name="metodologia" value={form.metodologia} onChange={change} rows="2" placeholder="Opcional"/></label>
   <label>Diretrizes<textarea name="diretrizes" value={form.diretrizes} onChange={change} rows="2" placeholder="Opcional"/></label>
   <label>Localidade<input name="localidade" value={form.localidade} onChange={change} placeholder="Cidade / Estado ou ambiente interno"/></label>
   <div className="master-form-grid"><label>Início<input type="date" name="data_inicio" value={form.data_inicio} onChange={change}/></label><label>Fim<input type="date" name="data_fim" value={form.data_fim} onChange={change}/></label></div>
   <label>Status<select name="status" value={form.status} onChange={change} disabled={contextualHomologacao}>{Object.entries(STATUS_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <button className="master-button" disabled={saving||!institutions.length}>{saving?"Salvando...":editingId?"Salvar alterações":"Criar projeto"}</button>{editingId&&<button type="button" className="master-button secondary" onClick={reset}>Cancelar</button>}
  </form><div className="master-panel"><div className="master-panel-title"><div><span className="master-eyebrow">Base operacional</span><h2>Projetos cadastrados</h2></div><strong>{projects.length}</strong></div>{loading?<p>Carregando...</p>:projects.length===0?<p>Nenhum projeto cadastrado.</p>:projects.map(p=><article className="master-list-row" key={p.id}><div><strong>{p.nome}</strong><span>{p.instituicao?.nome||"Instituição"} · {STATUS_LABEL[p.status]||p.status}</span><small>{p.objetivo}</small></div><div className="master-row-actions"><button className="master-button" onClick={()=>edit(p)}>Editar</button><button className="master-button danger" onClick={()=>remove(p)}>Excluir</button></div></article>)}</div></section>
 </div></main>;
}
