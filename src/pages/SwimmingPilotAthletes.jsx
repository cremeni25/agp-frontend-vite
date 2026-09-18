import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SwimmingShell from "../components/SwimmingShell";
import { getPilotAthletes, createPilotAthlete } from "../services/canonicalAgp";

const EMPTY={
  nome:"",
  email:"",
  data_nascimento:"",
  categoria:"",
  nivel:"",
  prova_principal:"",
  status_federativo:"nao_informado",
  federacao_nome:"",
  registro_federativo:""
};

export default function SwimmingPilotAthletes(){
  const navigate=useNavigate();
  const {perfil}=useAuth();
  const projectId=perfil?.projeto_id;
  const [data,setData]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    if(!projectId){setError("Seu projeto profissional não foi identificado.");setLoading(false);return}
    setLoading(true);setError("");
    try{setData(await getPilotAthletes(projectId))}
    catch(e){setError(e.message||"Não foi possível carregar os atletas do piloto.");setData(null)}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[projectId]);

  async function submit(e){
    e.preventDefault();
    setWorking(true);setError("");setMessage("");
    try{
      const result=await createPilotAthlete(projectId,{
        nome:form.nome.trim(),
        email:form.email.trim(),
        data_nascimento:form.data_nascimento||null,
        categoria:form.categoria||null,
        nivel:form.nivel||null,
        prova_principal:form.prova_principal||null,
        status_federativo:form.status_federativo,
        federacao_nome:form.status_federativo==="federado"?(form.federacao_nome||null):null,
        registro_federativo:form.status_federativo==="federado"?(form.registro_federativo||null):null
      });
      setMessage(`Convite enviado para ${result.email}. O atleta entrará no AGP já reconhecido como atleta deste projeto.`);
      setForm(EMPTY);
      await load();
    }catch(e){setError(e.message||"Não foi possível cadastrar e convidar o atleta.")}
    finally{setWorking(false)}
  }

  const athletes=data?.atletas||[];

  return <SwimmingShell
    eyebrow="Técnico · Piloto N1"
    title="Indicar e convidar atletas"
    subtitle="Cadastre somente os atletas que participarão do piloto. O AGP cria o vínculo esportivo, associa você como técnico responsável e envia o convite por e-mail."
    actions={[{label:"Voltar",onClick:()=>navigate("/dashboard-comissao")},{label:"Atualizar",onClick:load}]}
  >
    {error&&<div className="workflow-error">{error}</div>}
    {message&&<div className="workflow-success">{message}</div>}

    <section className="swim-grid">
      <article className="swim-card"><span>Projeto</span><strong>{loading?"…":data?.projeto?.nome||"—"}</strong><p>Você só pode indicar atletas deste projeto.</p></article>
      <article className="swim-card"><span>Atletas do piloto</span><strong className="swim-kpi">{loading?"…":athletes.length}</strong><p>Identidades reais vinculadas ao projeto.</p></article>
      <article className="swim-card"><span>Seu papel</span><strong>Técnico responsável</strong><p>O backend valida sua capacidade antes de qualquer cadastro.</p></article>
    </section>

    <form className="swim-panel" onSubmit={submit}>
      <span className="swim-panel-label">Novo atleta</span>
      <h2>Cadastrar e enviar convite</h2>
      <p className="swim-muted">O atleta não escolhe o próprio perfil. O vínculo como atleta é criado antes do convite.</p>
      <div className="workflow-grid">
        <label className="workflow-field">Nome completo<input required minLength="2" value={form.nome} onChange={e=>setForm(x=>({...x,nome:e.target.value}))} /></label>
        <label className="workflow-field">E-mail<input required type="email" value={form.email} onChange={e=>setForm(x=>({...x,email:e.target.value}))} /></label>
        <label className="workflow-field">Data de nascimento<input type="date" value={form.data_nascimento} onChange={e=>setForm(x=>({...x,data_nascimento:e.target.value}))} /></label>
        <label className="workflow-field">Categoria<input value={form.categoria} onChange={e=>setForm(x=>({...x,categoria:e.target.value}))} placeholder="Ex.: Juvenil" /></label>
        <label className="workflow-field">Nível<input value={form.nivel} onChange={e=>setForm(x=>({...x,nivel:e.target.value}))} placeholder="Ex.: Competitivo" /></label>
        <label className="workflow-field">Prova principal<input value={form.prova_principal} onChange={e=>setForm(x=>({...x,prova_principal:e.target.value}))} placeholder="Ex.: 100 m livre" /></label>
        <label className="workflow-field">Status esportivo<select value={form.status_federativo} onChange={e=>setForm(x=>({...x,status_federativo:e.target.value}))}><option value="nao_informado">Não informado</option><option value="vinculado">Vinculado</option><option value="federado">Federado</option></select></label>
        {form.status_federativo==="federado"&&<>
          <label className="workflow-field">Federação<input value={form.federacao_nome} onChange={e=>setForm(x=>({...x,federacao_nome:e.target.value}))} /></label>
          <label className="workflow-field">Registro federativo<input value={form.registro_federativo} onChange={e=>setForm(x=>({...x,registro_federativo:e.target.value}))} /></label>
        </>}
      </div>
      <div className="workflow-actions"><button className="swim-primary" disabled={working||!projectId}>{working?"Enviando convite...":"Cadastrar atleta e enviar convite"}</button></div>
    </form>

    <section className="swim-panel">
      <span className="swim-panel-label">Piloto</span><h2>Atletas já indicados</h2>
      {athletes.length?<div className="swim-list">{athletes.map(a=>{
        const access=a.acesso||{};
        return <div className="swim-row" key={a.participante_id}>
          <div><strong>{a.nome}</strong><span>{[a.categoria,a.status_federativo==="federado"?"Federado":a.status_federativo==="vinculado"?"Vinculado":null].filter(Boolean).join(" · ")||"Natação"}</span></div>
          <span className="swim-pill">{access.auth_id?"Acesso vinculado":"Convite pendente"}</span>
        </div>
      })}</div>:<div className="swim-empty">Nenhum atleta foi indicado ainda.</div>}
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Depois do convite</span><h2>Próximo passo do atleta</h2>
      <p className="swim-muted">O atleta aceita o convite, entra no AGP e passa a ver apenas a experiência de atleta. Consentimento, linha de base e demais requisitos continuam sendo controlados antes de liberar operações que dependam deles.</p>
    </section>
  </SwimmingShell>;
}
