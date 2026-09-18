import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import {
  getTrainingPlanning,
  createTrainingGroup,
  createTrainingPlan,
  updateCanonicalSessionExecution
} from "../services/canonicalAgp";

const EMPTY_GROUP={nome:"",descricao:"",participante_ids:[]};
const EMPTY_PLAN={
  grupo_id:"",
  participante_ids:[],
  tipo_sessao:"pool_training",
  inicio_planejado:"",
  duracao_min:"",
  objetivo:"",
  volume_planejado:"",
  intensidade_planejada:"",
  conteudo:"",
  series:[],
  ajustes_individuais:{}
};

function athleteLabel(a){
  const federative=a.status_federativo==="federado"?"Federado":a.status_federativo==="vinculado"?"Vinculado":"Status não informado";
  return [a.nome,a.categoria,federative].filter(Boolean).join(" · ");
}

export default function SwimmingTrainingPlanning(){
  const navigate=useNavigate();
  const {perfil}=useAuth();
  const [projects,setProjects]=useState([]);
  const [projectId,setProjectId]=useState("");
  const [data,setData]=useState(null);
  const [group,setGroup]=useState(EMPTY_GROUP);
  const [plan,setPlan]=useState(EMPTY_PLAN);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [executionDrafts,setExecutionDrafts]=useState({});

  async function loadProjects(){
    setLoading(true);setError("");
    try{
      if(!perfil?.pessoa_id)throw new Error("Identidade profissional não disponível.");
      const links=await supabase.from("agp_participantes_projeto")
        .select("projeto_id,funcao_no_projeto,ativo")
        .eq("pessoa_id",perfil.pessoa_id).eq("ativo",true);
      if(links.error)throw links.error;
      const ids=[...new Set((links.data||[]).map(x=>x.projeto_id).filter(Boolean))];
      if(!ids.length){setProjects([]);setData(null);return}
      const rows=await supabase.from("agp_projetos_validacao")
        .select("id,nome,status,instituicao_id").in("id",ids);
      if(rows.error)throw rows.error;
      const items=rows.data||[];
      setProjects(items);
      const first=projectId||items[0]?.id||"";
      setProjectId(first);
      if(first)await loadPlanning(first);
    }catch(e){
      setError(e.message||"Não foi possível carregar os projetos de treino.");
      setProjects([]);setData(null);
    }finally{setLoading(false)}
  }

  async function loadPlanning(id=projectId){
    if(!id)return;
    setError("");
    try{setData(await getTrainingPlanning(id))}
    catch(e){setError(e.message||"Não foi possível carregar o planejamento de treinos.");setData(null)}
  }

  useEffect(()=>{loadProjects()},[perfil?.pessoa_id]);

  const athletes=data?.atletas||[];
  const groups=data?.grupos||[];
  const memberships=data?.membros_grupos||[];
  const plans=data?.planos||[];
  const recipients=data?.destinos_planos||[];
  const sessions=data?.sessoes_materializadas||[];

  const groupMembers=useMemo(()=>{
    const map={};
    memberships.forEach(m=>{if(!map[m.grupo_id])map[m.grupo_id]=[];map[m.grupo_id].push(m.participante_id)});
    return map;
  },[memberships]);

  const athleteMap=useMemo(()=>Object.fromEntries(athletes.map(a=>[a.participante_id,a])),[athletes]);
  const sessionMap=useMemo(()=>Object.fromEntries(sessions.map(s=>[s.id,s])),[sessions]);

  function toggleGroupAthlete(id){
    setGroup(g=>({...g,participante_ids:g.participante_ids.includes(id)?g.participante_ids.filter(x=>x!==id):[...g.participante_ids,id]}));
  }
  function togglePlanAthlete(id){
    setPlan(p=>({...p,participante_ids:p.participante_ids.includes(id)?p.participante_ids.filter(x=>x!==id):[...p.participante_ids,id]}));
  }

  async function saveGroup(e){
    e.preventDefault();setWorking(true);setError("");setMessage("");
    try{
      await createTrainingGroup(projectId,{projeto_id:projectId,...group});
      setGroup(EMPTY_GROUP);
      setMessage("Grupo de treinamento criado.");
      await loadPlanning(projectId);
    }catch(e){setError(e.message||"Não foi possível criar o grupo.")}
    finally{setWorking(false)}
  }

  function addSeries(){
    setPlan(p=>({...p,series:[...p.series,{nome:"",repeticoes:1,distancia_m:"",estilo:"livre",saida_segundos:"",ritmo_alvo:"",equipamento:"",objetivo:"",observacao:""}]}));
  }

  function updateSeries(index,field,value){
    setPlan(p=>({...p,series:p.series.map((item,i)=>i===index?{...item,[field]:value}:item)}));
  }

  function removeSeries(index){
    setPlan(p=>({...p,series:p.series.filter((_,i)=>i!==index)}));
  }

  function setAdjustment(participantId,field,value){
    setPlan(p=>({...p,ajustes_individuais:{
      ...p.ajustes_individuais,
      [participantId]:{...(p.ajustes_individuais[participantId]||{}),[field]:value}
    }}));
  }

  async function savePlan(e){
    e.preventDefault();setWorking(true);setError("");setMessage("");
    try{
      const adjustments=Object.entries(plan.ajustes_individuais)
        .filter(([,v])=>Object.values(v).some(x=>String(x||"").trim()!==""))
        .map(([participante_id,v])=>({
          participante_id,
          observacao:v.observacao||null,
          volume_planejado:v.volume_planejado===""||v.volume_planejado==null?null:Number(v.volume_planejado),
          intensidade_planejada:v.intensidade_planejada===""||v.intensidade_planejada==null?null:Number(v.intensidade_planejada),
          conteudo:v.conteudo||null
        }));
      const result=await createTrainingPlan(projectId,{
        projeto_id:projectId,
        grupo_id:plan.grupo_id||null,
        participante_ids:plan.participante_ids,
        tipo_sessao:plan.tipo_sessao,
        inicio_planejado:new Date(plan.inicio_planejado).toISOString(),
        duracao_min:plan.duracao_min?Number(plan.duracao_min):null,
        objetivo:plan.objetivo||null,
        volume_planejado:plan.volume_planejado?Number(plan.volume_planejado):null,
        intensidade_planejada:plan.intensidade_planejada?Number(plan.intensidade_planejada):null,
        conteudo:plan.conteudo,
        series:plan.series.filter(s=>s.distancia_m).map(s=>({
          nome:s.nome||null,
          repeticoes:Number(s.repeticoes||1),
          distancia_m:Number(s.distancia_m),
          estilo:s.estilo||null,
          saida_segundos:s.saida_segundos?Number(s.saida_segundos):null,
          ritmo_alvo:s.ritmo_alvo||null,
          equipamento:String(s.equipamento||"").split(",").map(x=>x.trim()).filter(Boolean),
          objetivo:s.objetivo||null,
          observacao:s.observacao||null
        })),
        ciclo_id:null,
        ajustes_individuais:adjustments
      });
      setMessage(`Treino criado para ${result.atletas_total} atleta(s). Cada atleta recebeu uma sessão canônica individual.`);
      setPlan(EMPTY_PLAN);
      await loadPlanning(projectId);
    }catch(e){setError(e.message||"Não foi possível criar o treino.")}
    finally{setWorking(false)}
  }

  async function saveExecution(sessionId){
    const draft=executionDrafts[sessionId]||{};
    setWorking(true);setError("");setMessage("");
    try{
      await updateCanonicalSessionExecution(sessionId,{
        status:draft.status||"concluida",
        inicio_real:null,
        fim_real:null,
        volume_executado:draft.volume_executado===""||draft.volume_executado==null?null:Number(draft.volume_executado),
        intensidade_percebida:draft.intensidade_percebida===""||draft.intensidade_percebida==null?null:Number(draft.intensidade_percebida),
        conteudo_executado:draft.conteudo_executado||null,
        intercorrencias:draft.intercorrencias||null
      });
      setMessage("Execução do atleta registrada.");
      setExecutionDrafts(d=>({...d,[sessionId]:{}}));
      await loadPlanning(projectId);
    }catch(e){setError(e.message||"Não foi possível registrar a execução.")}
    finally{setWorking(false)}
  }

  const selectedGroupMemberIds=plan.grupo_id?(groupMembers[plan.grupo_id]||[]):[];
  const targetedIds=[...new Set([...selectedGroupMemberIds,...plan.participante_ids])];

  return <SwimmingShell
    eyebrow="Técnico · Planejamento"
    title="Treino da equipe com individualização por atleta"
    subtitle="Prescreva uma sessão para um grupo, para atletas específicos ou combine ambos. O AGP mantém uma sessão individual para cada atleta no histórico longitudinal."
    actions={[{label:"Voltar aos atletas",onClick:()=>navigate("/dashboard-comissao")},{label:"Atualizar",onClick:()=>loadPlanning(projectId)}]}
  >
    {error&&<div className="workflow-error">{error}</div>}
    {message&&<div className="workflow-success">{message}</div>}

    <section className="swim-panel">
      <span className="swim-panel-label">Projeto</span><h2>Contexto do treino</h2>
      {loading?<div className="swim-empty">Carregando...</div>:projects.length?<select className="training-select" value={projectId} onChange={async e=>{setProjectId(e.target.value);await loadPlanning(e.target.value)}}>{projects.map(p=><option key={p.id} value={p.id}>{p.nome||p.id}</option>)}</select>:<div className="swim-empty">Você ainda não possui projeto esportivo vinculado.</div>}
    </section>

    {data&&<>
      <section className="swim-two">
        <form className="swim-panel" onSubmit={saveGroup}>
          <span className="swim-panel-label">Organização</span><h2>Criar grupo de treinamento</h2>
          <p className="swim-muted">Ex.: Infantil A, Juvenil competitivo, Velocistas, Fundistas. O grupo organiza a prescrição; o histórico continua individual.</p>
          <div className="workflow-grid">
            <label className="workflow-field">Nome<input required value={group.nome} onChange={e=>setGroup(g=>({...g,nome:e.target.value}))} /></label>
            <label className="workflow-field">Descrição<input value={group.descricao} onChange={e=>setGroup(g=>({...g,descricao:e.target.value}))} /></label>
            <div className="workflow-field full"><span>Atletas do grupo</span><div className="training-athletes">{athletes.map(a=><label key={a.participante_id}><input type="checkbox" checked={group.participante_ids.includes(a.participante_id)} onChange={()=>toggleGroupAthlete(a.participante_id)} /><span><strong>{a.nome}</strong><small>{[a.categoria,a.status_federativo==="federado"?"Federado":a.status_federativo==="vinculado"?"Vinculado":null].filter(Boolean).join(" · ")}</small></span></label>)}</div></div>
          </div>
          <div className="workflow-actions"><button className="swim-secondary" disabled={working}>Criar grupo</button></div>
        </form>

        <section className="swim-panel">
          <span className="swim-panel-label">Grupos ativos</span><h2>Equipe organizada</h2>
          {groups.length?<div className="swim-list">{groups.map(g=><div className="swim-row" key={g.id}><div><strong>{g.nome}</strong><span>{g.descricao||"Grupo de treinamento"}</span></div><span className="swim-pill">{(groupMembers[g.id]||[]).length} atleta(s)</span></div>)}</div>:<div className="swim-empty">Nenhum grupo criado ainda.</div>}
        </section>
      </section>

      <form className="swim-panel" onSubmit={savePlan}>
        <span className="swim-panel-label">Prescrição</span><h2>Criar treino</h2>
        <div className="workflow-grid">
          <label className="workflow-field">Aplicar a um grupo<select value={plan.grupo_id} onChange={e=>setPlan(p=>({...p,grupo_id:e.target.value}))}><option value="">Sem grupo</option>{groups.map(g=><option key={g.id} value={g.id}>{g.nome}</option>)}</select></label>
          <label className="workflow-field">Tipo de sessão<select value={plan.tipo_sessao} onChange={e=>setPlan(p=>({...p,tipo_sessao:e.target.value}))}><option value="pool_training">Treino de piscina</option><option value="dry_land">Treino fora d'água</option><option value="recovery">Recuperação</option><option value="assessment">Avaliação</option><option value="other">Outro</option></select></label>
          <label className="workflow-field">Data e hora<input required type="datetime-local" value={plan.inicio_planejado} onChange={e=>setPlan(p=>({...p,inicio_planejado:e.target.value}))} /></label>
          <label className="workflow-field">Duração (min)<input type="number" min="1" max="600" value={plan.duracao_min} onChange={e=>setPlan(p=>({...p,duracao_min:e.target.value}))} /></label>
          <label className="workflow-field">Volume planejado<input type="number" min="0" step="1" value={plan.volume_planejado} onChange={e=>setPlan(p=>({...p,volume_planejado:e.target.value}))} placeholder="Ex.: 4500 m" /></label>
          <label className="workflow-field">Intensidade planejada (0–10)<input type="number" min="0" max="10" step="0.1" value={plan.intensidade_planejada} onChange={e=>setPlan(p=>({...p,intensidade_planejada:e.target.value}))} /></label>
          <label className="workflow-field full">Objetivo<textarea rows="2" value={plan.objetivo} onChange={e=>setPlan(p=>({...p,objetivo:e.target.value}))} placeholder="Ex.: tolerância ao ritmo de 200 m livre" /></label>
          <label className="workflow-field full">Conteúdo geral<textarea required minLength="2" rows="5" value={plan.conteudo} onChange={e=>setPlan(p=>({...p,conteudo:e.target.value}))} placeholder={"Resumo do objetivo e organização geral da sessão."} /></label>
          <div className="workflow-field full">
            <div className="training-series-head"><span>Séries estruturadas</span><button type="button" className="swim-secondary" onClick={addSeries}>Adicionar série</button></div>
            <small className="workflow-help">Estruture o treino com linguagem própria da Natação. Ex.: 8 × 50 m livre, saída a cada 45 s, ritmo de prova.</small>
            <div className="training-series-list">
              {plan.series.length===0?<div className="swim-empty">Você pode usar somente o conteúdo geral ou adicionar séries estruturadas.</div>:plan.series.map((s,index)=><div className="training-series-card" key={index}>
                <div className="training-series-title"><strong>Série {index+1}</strong><button type="button" className="swim-ghost" onClick={()=>removeSeries(index)}>Remover</button></div>
                <div className="workflow-grid">
                  <label className="workflow-field">Nome<input value={s.nome} onChange={e=>updateSeries(index,"nome",e.target.value)} placeholder="Ex.: Principal" /></label>
                  <label className="workflow-field">Repetições<input type="number" min="1" max="200" value={s.repeticoes} onChange={e=>updateSeries(index,"repeticoes",e.target.value)} /></label>
                  <label className="workflow-field">Distância por repetição (m)<input type="number" min="1" step="1" value={s.distancia_m} onChange={e=>updateSeries(index,"distancia_m",e.target.value)} /></label>
                  <label className="workflow-field">Estilo<select value={s.estilo} onChange={e=>updateSeries(index,"estilo",e.target.value)}><option value="livre">Livre</option><option value="costas">Costas</option><option value="peito">Peito</option><option value="borboleta">Borboleta</option><option value="medley">Medley</option><option value="pernada">Pernada</option><option value="bracada">Braçada</option><option value="misto">Misto</option></select></label>
                  <label className="workflow-field">Saída / intervalo (s)<input type="number" min="1" step="0.1" value={s.saida_segundos} onChange={e=>updateSeries(index,"saida_segundos",e.target.value)} placeholder="Ex.: 45" /></label>
                  <label className="workflow-field">Ritmo-alvo<input value={s.ritmo_alvo} onChange={e=>updateSeries(index,"ritmo_alvo",e.target.value)} placeholder="Ex.: ritmo 200 livre" /></label>
                  <label className="workflow-field">Equipamentos<input value={s.equipamento} onChange={e=>updateSeries(index,"equipamento",e.target.value)} placeholder="Ex.: nadadeira, palmar" /></label>
                  <label className="workflow-field">Objetivo da série<input value={s.objetivo} onChange={e=>updateSeries(index,"objetivo",e.target.value)} /></label>
                  <label className="workflow-field full">Observação<input value={s.observacao} onChange={e=>updateSeries(index,"observacao",e.target.value)} /></label>
                </div>
              </div>)}
            </div>
          </div>
          <div className="workflow-field full"><span>Adicionar atletas específicos</span><div className="training-athletes">{athletes.map(a=><label key={a.participante_id}><input type="checkbox" checked={plan.participante_ids.includes(a.participante_id)} onChange={()=>togglePlanAthlete(a.participante_id)} /><span><strong>{a.nome}</strong><small>{athleteLabel(a)}</small></span></label>)}</div></div>
        </div>

        {targetedIds.length>0&&<div className="training-adjustments"><h3>Ajustes individuais</h3><p className="swim-muted">Opcional. A prescrição geral será usada quando não houver ajuste.</p>{targetedIds.map(id=>{const a=athleteMap[id];const v=plan.ajustes_individuais[id]||{};return <details key={id}><summary>{a?.nome||"Atleta"} {a?.status_federativo==="federado"?"· Federado":a?.status_federativo==="vinculado"?"· Vinculado":""}</summary><div className="workflow-grid"><label className="workflow-field">Volume individual<input type="number" min="0" value={v.volume_planejado||""} onChange={e=>setAdjustment(id,"volume_planejado",e.target.value)} /></label><label className="workflow-field">Intensidade individual<input type="number" min="0" max="10" step="0.1" value={v.intensidade_planejada||""} onChange={e=>setAdjustment(id,"intensidade_planejada",e.target.value)} /></label><label className="workflow-field full">Conteúdo diferente<textarea rows="4" value={v.conteudo||""} onChange={e=>setAdjustment(id,"conteudo",e.target.value)} /></label><label className="workflow-field full">Observação<input value={v.observacao||""} onChange={e=>setAdjustment(id,"observacao",e.target.value)} /></label></div></details>})}</div>}

        <div className="workflow-actions"><button className="swim-primary" disabled={working||targetedIds.length===0}>{working?"Registrando...":`Criar treino para ${targetedIds.length} atleta(s)`}</button></div>
      </form>

      <section className="swim-panel">
        <span className="swim-panel-label">Execução</span><h2>Treinos planejados por atleta</h2>
        <p className="swim-muted">Mesmo quando a prescrição nasce no grupo, cada atleta mantém sua própria execução, intercorrências e resposta longitudinal.</p>
        {plans.length?plans.map(p=>{
          const planRecipients=recipients.filter(r=>r.plano_id===p.id);
          return <div className="training-plan-card" key={p.id}><div className="training-plan-head"><div><strong>{p.objetivo||"Treino planejado"}</strong><span>{new Date(p.inicio_planejado).toLocaleString("pt-BR")} · {planRecipients.length} atleta(s)</span></div><span className="swim-pill">{p.status}</span></div><div className="training-session-list">{planRecipients.map(r=>{const a=athleteMap[r.participante_id];const s=sessionMap[r.sessao_id]||{};const d=executionDrafts[r.sessao_id]||{};return <details key={r.participante_id}><summary><span><strong>{a?.nome||"Atleta"}</strong><small>{s.status||"planejada"} · {r.origem}</small></span></summary><div className="workflow-grid"><label className="workflow-field">Estado<select value={d.status||s.status||"concluida"} onChange={e=>setExecutionDrafts(x=>({...x,[r.sessao_id]:{...d,status:e.target.value}}))}><option value="em_execucao">Em execução</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select></label><label className="workflow-field">Volume executado<input type="number" min="0" value={d.volume_executado||""} onChange={e=>setExecutionDrafts(x=>({...x,[r.sessao_id]:{...d,volume_executado:e.target.value}}))} /></label><label className="workflow-field">Intensidade percebida (0–10)<input type="number" min="0" max="10" step="0.1" value={d.intensidade_percebida||""} onChange={e=>setExecutionDrafts(x=>({...x,[r.sessao_id]:{...d,intensidade_percebida:e.target.value}}))} /></label><label className="workflow-field full">Conteúdo executado<textarea rows="3" value={d.conteudo_executado||""} onChange={e=>setExecutionDrafts(x=>({...x,[r.sessao_id]:{...d,conteudo_executado:e.target.value}}))} /></label><label className="workflow-field full">Intercorrências<textarea rows="2" value={d.intercorrencias||""} onChange={e=>setExecutionDrafts(x=>({...x,[r.sessao_id]:{...d,intercorrencias:e.target.value}}))} /></label></div><div className="workflow-actions"><button type="button" className="swim-secondary" disabled={working||!r.sessao_id} onClick={()=>saveExecution(r.sessao_id)}>Salvar execução</button></div></details>})}</div></div>
        }):<div className="swim-empty">Nenhum treino planejado ainda.</div>}
      </section>
    </>}
  </SwimmingShell>
}
