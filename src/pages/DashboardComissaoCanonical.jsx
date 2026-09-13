import {useEffect,useMemo,useState} from "react";
import {useAuth} from "../context/AuthContext";
import {supabase} from "../supabaseClient";
import "../styles/dashboard-comissao.css";

const state=r=>{if(!r.last)return{label:"Sem evidência recente",level:2};const h=(Date.now()-new Date(r.last).getTime())/36e5;if(h>48)return{label:"Precisa de atenção",level:2};if(h>24)return{label:"Acompanhar",level:1};return{label:"Sem pendência imediata",level:0}};

export default function DashboardComissaoCanonical(){
 const {perfil}=useAuth();
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[history,setHistory]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{
  const personId=perfil?.pessoa_id;if(!personId){setRows([]);return;}
  const p=await supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,status_onboarding,ativo").eq("funcao_no_projeto","atleta").eq("ativo",true).eq("tecnico_responsavel_pessoa_id",personId);
  if(p.error)throw p.error;const participants=p.data||[];if(!participants.length){setRows([]);return;}
  const personIds=[...new Set(participants.map(x=>x.pessoa_id))],participantIds=participants.map(x=>x.id);
  const [people,profiles,collections]=await Promise.all([
   supabase.from("agp_pessoas").select("id,nome").in("id",personIds),
   supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,categoria,nivel,status").in("pessoa_id",personIds),
   supabase.from("agp_coletas").select("participante_id,data_hora_coleta,status").in("participante_id",participantIds).order("data_hora_coleta",{ascending:false})]);
  const first=people.error||profiles.error||collections.error;if(first)throw first;
  const pm=Object.fromEntries((people.data||[]).map(x=>[x.id,x])),fm=Object.fromEntries((profiles.data||[]).filter(x=>x.status==="ativo").map(x=>[x.pessoa_id,x])),latest={};
  for(const x of collections.data||[])if(!latest[x.participante_id])latest[x.participante_id]=x;
  setRows(participants.map(x=>({...x,person:pm[x.pessoa_id]||{},profile:fm[x.pessoa_id]||{},last:latest[x.id]?.data_hora_coleta||null,lastStatus:latest[x.id]?.status||null})));
 }catch(e){setRows([]);setError("Não foi possível carregar o acompanhamento deste acesso.");}finally{setLoading(false)}}
 async function open(row){setSelected(row);setHistory([]);const q=await supabase.from("agp_coletas").select("id,data_hora_coleta,status,completude,confiabilidade,dados").eq("participante_id",row.id).order("data_hora_coleta",{ascending:false}).limit(14);if(q.error)setError("Não foi possível abrir o histórico deste atleta.");else setHistory(q.data||[])}
 useEffect(()=>{load()},[perfil?.pessoa_id]);
 const ordered=useMemo(()=>[...rows].sort((a,b)=>state(b).level-state(a).level),[rows]),next=ordered.find(x=>state(x).level>0)||ordered[0]||null;
 if(loading)return <div className="dashboard-loading">Preparando seu acompanhamento...</div>;
 return <main className="dashboard-comissao"><div className="dashboard-overlay">
  <header className="dashboard-header"><div><span>AGP · Comissão técnica</span><h1>Quem precisa da sua atenção agora?</h1><p>Pessoas e evidências primeiro; indicadores ficam como contexto.</p></div><button onClick={load}>Atualizar</button></header>
  {error&&<div className="master-error" role="alert">{error}</div>}
  <section className="dashboard-section"><h2>{next?state(next).label:"Nenhum atleta vinculado"}</h2>{next?<article className="athlete-card"><h3>{next.person.nome||"Atleta"}</h3><p>{next.profile.modalidade||next.profile.categoria||next.profile.nivel||"Acompanhamento ativo"}</p><strong>{next.last?`Última evidência: ${new Date(next.last).toLocaleString("pt-BR")}`:"Ainda sem evidência recente"}</strong><button onClick={()=>open(next)}>Abrir acompanhamento</button></article>:<p>Nenhum atleta está vinculado a este profissional.</p>}</section>
  {selected&&<section className="dashboard-section"><h2>{selected.person.nome||"Atleta"}</h2><p>Histórico recente para decisão profissional.</p>{history.length===0?<p>Ainda não há evidências disponíveis.</p>:<div className="alert-list">{history.map(x=><article key={x.id} className="athlete-card"><strong>{new Date(x.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>{x.status||"registro"}{x.completude!=null?` · completude ${x.completude}%`:""}</span><details><summary>Ver evidência</summary><pre>{JSON.stringify(x.dados,null,2)}</pre></details></article>)}</div>}</section>}
  <details className="dashboard-section"><summary>Ver todos os atletas</summary><div className="athlete-grid">{ordered.map(x=>{const s=state(x);return <article key={x.id} className={`athlete-card ${s.level===2?"critical":s.level===1?"warning":"ok"}`}><h3>{x.person.nome||"Atleta"}</h3><p>{x.profile.modalidade||x.profile.categoria||x.profile.nivel||""}</p><strong>{s.label}</strong><button onClick={()=>open(x)}>Abrir acompanhamento</button></article>})}</div></details>
 </div></main>;
}
