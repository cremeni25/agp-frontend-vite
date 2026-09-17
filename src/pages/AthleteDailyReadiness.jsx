import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SwimmingShell from "../components/SwimmingShell";
import { getDailySelfReport, submitDailySelfReport } from "../services/canonicalAgp";

const INITIAL={sono_horas:"",qualidade_sono:"",fadiga:"",dor:"",estresse:"",humor:"",rpe_ultima_sessao:"",observacao:""};
const REQUIRED=["sono_horas","qualidade_sono","fadiga","dor","estresse","humor","rpe_ultima_sessao"];
const GOOD=[["😣","Muito ruim",1],["🙁","Ruim",2],["😐","Regular",3],["🙂","Bom",4],["😄","Excelente",5]];
const FATIGUE=[["😄","Descansado",1],["🙂","Pouco cansado",2],["😐","Moderado",3],["🙁","Muito cansado",4],["😣","Exausto",5]];
const STRESS=[["😄","Muito tranquilo",1],["🙂","Tranquilo",2],["😐","Moderado",3],["🙁","Alto",4],["😣","Muito alto",5]];
const PAIN=[["😄","Sem dor",0],["🙂","Leve",2],["😐","Moderada",5],["🙁","Forte",8],["😣","Muito forte",10]];
const RPE=[["😄","Muito leve",0],["🙂","Leve",3],["😐","Moderado",5],["🙁","Muito intenso",8],["😣","Máximo",10]];

function Scale({label,options,value,onChange}){
  return <fieldset className="readiness-scale"><legend>{label}</legend><div className="readiness-options">{options.map(([emoji,text,v])=><button type="button" key={v} onClick={()=>onChange(String(v))} className={String(value)===String(v)?"selected":""}><span>{emoji}</span><small>{text}</small></button>)}</div></fieldset>
}

export default function AthleteDailyReadiness(){
  const navigate=useNavigate();
  const {perfil}=useAuth();
  const participantId=perfil?.participante_id;
  const [form,setForm]=useState(INITIAL);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    if(!participantId){setError("Seu vínculo esportivo ainda não está disponível.");setLoading(false);return}
    setLoading(true);setError("");
    try{
      const data=await getDailySelfReport(participantId);
      setHistory(data?.historico_recente||[]);
    }catch(e){setError(e.message||"A prontidão diária ainda não está disponível.")}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[participantId]);

  const completion=useMemo(()=>Math.round(REQUIRED.filter(k=>String(form[k]).trim()!=="").length/REQUIRED.length*100),[form]);
  const today=new Date().toISOString().slice(0,10);
  const answeredToday=history.some(x=>String(x.data_hora_coleta||"").slice(0,10)===today);

  function setField(key,value){setForm(f=>({...f,[key]:value}))}

  async function submit(e){
    e.preventDefault();setError("");setMessage("");
    if(completion<100){setError("Responda todos os itens obrigatórios.");return}
    setSaving(true);
    try{
      await submitDailySelfReport(participantId,{
        sono_horas:Number(form.sono_horas),
        qualidade_sono:Number(form.qualidade_sono),
        fadiga:Number(form.fadiga),
        dor:Number(form.dor),
        estresse:Number(form.estresse),
        humor:Number(form.humor),
        rpe_ultima_sessao:Number(form.rpe_ultima_sessao),
        observacao:form.observacao.trim()||null
      });
      setForm(INITIAL);
      setMessage("Prontidão registrada. Ela já faz parte da sua linha longitudinal.");
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar sua prontidão agora.")}
    finally{setSaving(false)}
  }

  return <SwimmingShell eyebrow="Atleta · Hoje" title="Como você está?" subtitle="Responda pensando no seu momento agora. Isso é evidência autodeclarada, não diagnóstico." actions={[{label:"Voltar",onClick:()=>navigate("/dashboard-atleta")}]}>
    {loading&&<div className="swim-panel">Preparando sua prontidão...</div>}
    {message&&<div className="swim-notice swim-success">{message}</div>}
    {error&&<div className="swim-notice">{error}</div>}
    {!loading&&!error&&<>
      {answeredToday&&<section className="swim-focus"><div><span className="swim-eyebrow">Hoje</span><h2>Seu registro de hoje já está salvo</h2><p>Se houve uma mudança real no seu estado, você pode registrar novamente. O histórico preserva cada momento.</p></div></section>}
      <form className="swim-panel readiness-canonical" onSubmit={submit}>
        <div className="swim-panel-head"><div><span className="swim-panel-label">Prontidão diária</span><h2>Sete respostas rápidas</h2></div><span className="swim-pill">{completion}% completo</span></div>
        <label className="readiness-hours">Quantas horas você dormiu?<input type="number" min="0" max="24" step="0.1" value={form.sono_horas} onChange={e=>setField("sono_horas",e.target.value)} required /></label>
        <Scale label="Como foi seu sono?" options={GOOD} value={form.qualidade_sono} onChange={v=>setField("qualidade_sono",v)} />
        <Scale label="Quanto cansaço você sente?" options={FATIGUE} value={form.fadiga} onChange={v=>setField("fadiga",v)} />
        <Scale label="Quanto desconforto ou dor você sente?" options={PAIN} value={form.dor} onChange={v=>setField("dor",v)} />
        <Scale label="Como está seu nível de estresse?" options={STRESS} value={form.estresse} onChange={v=>setField("estresse",v)} />
        <Scale label="Como está seu humor?" options={GOOD} value={form.humor} onChange={v=>setField("humor",v)} />
        <Scale label="Como foi o esforço do seu último treino?" options={RPE} value={form.rpe_ultima_sessao} onChange={v=>setField("rpe_ultima_sessao",v)} />
        <label className="readiness-note">Quer contar algo importante hoje?<textarea rows="4" value={form.observacao} onChange={e=>setField("observacao",e.target.value)} placeholder="Opcional" /></label>
        <button className="swim-primary readiness-submit" disabled={saving||completion<100}>{saving?"Registrando...":"Registrar prontidão"}</button>
      </form>
      <section className="swim-panel"><span className="swim-panel-label">Seus registros recentes</span><h2>Continuidade</h2>{history.length?<div className="swim-list">{history.map(item=><div className="swim-row" key={item.id}><div><strong>{new Date(item.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>Autorreporte do atleta · {item.status||"registrado"}</span></div><span className="swim-pill">{item.completude!=null?item.completude+"%":"evidência"}</span></div>)}</div>:<div className="swim-empty">Ainda não há registros anteriores.</div>}</section>
    </>}
  </SwimmingShell>
}
