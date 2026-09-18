import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import SwimmingShell from "../components/SwimmingShell";
import { getMasterTrainingOverview } from "../services/canonicalAgp";

function fmt(value){
  if(!value)return "—";
  try{return new Date(value).toLocaleString("pt-BR")}catch{return String(value)}
}

export default function MasterTrainingObservability(){
  const navigate=useNavigate();
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{setData(await getMasterTrainingOverview())}
    catch(e){setError(e.message||"Não foi possível carregar os treinos.");setData(null)}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  const projects=useMemo(()=>Object.fromEntries((data?.projetos||[]).map(x=>[x.id,x])),[data]);
  const participants=useMemo(()=>Object.fromEntries((data?.participantes||[]).map(x=>[x.participante_id,x])),[data]);
  const creators=useMemo(()=>Object.fromEntries((data?.criadores||[]).map(x=>[x.id,x])),[data]);
  const sessions=useMemo(()=>Object.fromEntries((data?.sessoes||[]).map(x=>[x.id,x])),[data]);
  const destinations=data?.destinos||[];
  const units=data?.unidades||[];
  const plans=data?.planos||[];

  return <SwimmingShell
    eyebrow="Governança · Acompanhamento"
    title="Treinos criados na homologação"
    subtitle="Visão somente leitura. O Master acompanha o que foi planejado e executado, sem editar, confirmar ou operar em nome do técnico."
    actions={[{label:"Voltar à governança",onClick:()=>navigate("/dashboard-master")},{label:"Atualizar",onClick:load}]}
  >
    {error&&<div className="workflow-error">{error}</div>}

    <section className="swim-grid">
      <article className="swim-card"><span>Planos de treino</span><strong className="swim-kpi">{loading?"…":plans.length}</strong><p>Treinos registrados no ambiente canônico.</p></article>
      <article className="swim-card"><span>Sessões individuais</span><strong className="swim-kpi">{loading?"…":data?.sessoes?.length||0}</strong><p>Materializadas por atleta.</p></article>
      <article className="swim-card"><span>Modo Master</span><strong>Somente leitura</strong><p>Nenhuma ação esportiva é permitida aqui.</p></article>
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Histórico</span><h2>Treinos planejados</h2>
      {loading?<div className="swim-empty">Carregando...</div>:plans.length?plans.map(plan=>{
        const rows=destinations.filter(x=>x.plano_id===plan.id);
        const base=plan.prescricao_base||{};
        const planUnits=units.filter(u=>rows.some(r=>r.sessao_id===u.sessao_id));
        return <article className="training-plan-card" key={plan.id}>
          <div className="training-plan-head">
            <div>
              <strong>{plan.objetivo||"Treino planejado"}</strong>
              <span>{projects[plan.projeto_id]?.nome||"Projeto"} · {fmt(plan.inicio_planejado)}</span>
              <span>Por: {creators[plan.criado_por_pessoa_id]?.nome||"Profissional autorizado"}</span>
            </div>
            <span className="swim-pill">{plan.status}</span>
          </div>

          <div className="swim-grid" style={{marginTop:12}}>
            <article className="swim-card"><span>Volume</span><strong>{base.volume_planejado??"—"} m</strong><p>Planejado</p></article>
            <article className="swim-card"><span>Intensidade</span><strong>{base.intensidade_planejada??"—"}</strong><p>Escala utilizada pelo técnico</p></article>
            <article className="swim-card"><span>Atletas</span><strong>{rows.length}</strong><p>Destinos deste plano</p></article>
          </div>

          <details style={{marginTop:12}}>
            <summary>Ver conteúdo e atletas</summary>
            <div className="workflow-grid" style={{marginTop:12}}>
              <div className="workflow-field full"><span>Conteúdo geral</span><div className="swim-empty" style={{whiteSpace:"pre-wrap",textAlign:"left"}}>{base.conteudo||"Sem conteúdo textual."}</div></div>
              <div className="workflow-field full"><span>Atletas</span><div className="swim-list">{rows.map(r=>{
                const p=participants[r.participante_id]||{};
                const s=sessions[r.sessao_id]||{};
                return <div className="swim-row" key={r.participante_id}><div><strong>{p.nome||"Atleta"}</strong><span>{p.categoria||"Natação"} · {s.status||"—"}</span></div><span className="swim-pill">{r.origem}</span></div>
              })}</div></div>
              {planUnits.length>0&&<div className="workflow-field full"><span>Séries estruturadas</span><div className="swim-list">{planUnits.map(u=><div className="swim-row" key={u.id}><div><strong>{u.nome||`Série ${Number(u.ordem||0)+1}`}</strong><span>{u.planejado?.repeticoes||1} × {u.planejado?.distancia_m||"—"} m · {u.planejado?.estilo||"—"} · saída {u.planejado?.saida_segundos||"—"} s</span></div><span className="swim-pill">{u.status}</span></div>)}</div></div>}
            </div>
          </details>
        </article>
      }):<div className="swim-empty">Nenhum treino registrado ainda.</div>}
    </section>
  </SwimmingShell>;
}
