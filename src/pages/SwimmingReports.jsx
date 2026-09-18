import { useEffect,useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import { getSwimmingEvolution, getInstitutionalIntelligence } from "../services/canonicalAgp";

function km(v){
  return new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(Number(v||0)/1000);
}

export default function SwimmingReports(){
  const navigate=useNavigate();
  const {perfil}=useAuth();
  const role=perfil?.tipo_usuario_normalizado||perfil?.tipo_usuario||"comissao";
  const [rows,setRows]=useState([]);
  const [institution,setInstitution]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      if(role==="clube"){
        const membership=await supabase.from("agp_membros_instituicao")
          .select("instituicao_id").eq("auth_id",perfil?.auth_id).eq("ativo",true).limit(1).maybeSingle();
        if(membership.error||!membership.data?.instituicao_id)throw membership.error||new Error("Instituição não vinculada.");
        setInstitution(await getInstitutionalIntelligence(membership.data.instituicao_id));
        setRows([]);
        return;
      }

      let participants=[];
      if(role==="master"){
        const p=await supabase.from("agp_participantes_projeto")
          .select("id,pessoa_id,projeto_id,status_onboarding")
          .eq("funcao_no_projeto","atleta").eq("ativo",true);
        if(p.error)throw p.error;
        participants=p.data||[];
      }else{
        const own=await supabase.from("agp_participantes_projeto")
          .select("projeto_id").eq("pessoa_id",perfil?.pessoa_id).eq("ativo",true);
        if(own.error)throw own.error;
        const ids=[...new Set((own.data||[]).map(x=>x.projeto_id).filter(Boolean))];
        if(ids.length){
          const p=await supabase.from("agp_participantes_projeto")
            .select("id,pessoa_id,projeto_id,status_onboarding")
            .in("projeto_id",ids).eq("funcao_no_projeto","atleta").eq("ativo",true);
          if(p.error)throw p.error;
          participants=p.data||[];
        }
      }

      const peopleIds=[...new Set(participants.map(x=>x.pessoa_id).filter(Boolean))];
      const people=peopleIds.length?await supabase.from("agp_pessoas").select("id,nome").in("id",peopleIds):{data:[],error:null};
      if(people.error)throw people.error;
      const names=Object.fromEntries((people.data||[]).map(x=>[x.id,x.nome]));

      const evolution=await Promise.allSettled(participants.map(p=>getSwimmingEvolution(p.id)));
      setRows(participants.map((p,i)=>({
        participante_id:p.id,
        pessoa_id:p.pessoa_id,
        projeto_id:p.projeto_id,
        nome:names[p.pessoa_id]||"Atleta",
        status_onboarding:p.status_onboarding,
        evolution:evolution[i].status==="fulfilled"?evolution[i].value:null
      })));
      setInstitution(null);
    }catch(e){
      setError(e.message||"Não foi possível montar os relatórios.");
      setRows([]);setInstitution(null);
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[role,perfil?.pessoa_id,perfil?.auth_id]);

  const totals=useMemo(()=>rows.reduce((acc,row)=>{
    const r=row.evolution?.resumo||{};
    acc.athletes+=1;
    acc.sessions+=Number(r.sessoes_total||0);
    acc.completed+=Number(r.sessoes_concluidas||0);
    acc.executed+=Number(r.volume_executado_m||0);
    acc.planned+=Number(r.volume_planejado_m||0);
    acc.readiness+=Number(r.prontidao_registros||0);
    acc.comparable+=Number(r.metricas_comparaveis||0);
    return acc;
  },{athletes:0,sessions:0,completed:0,executed:0,planned:0,readiness:0,comparable:0}),[rows]);

  const institutionalProjects=institution?.projetos||[];

  return <SwimmingShell
    eyebrow={role==="master"?"Governança · Relatórios":role==="clube"?"Instituição · Relatórios":"Profissional · Relatórios"}
    title="Relatórios AGP Swim"
    subtitle={role==="clube"
      ?"Leitura agregada da operação institucional. Nenhum ranking individual é criado."
      :role==="master"
        ?"Visão de governança sobre a cobertura real do sistema, sem operar decisões esportivas."
        :"Leitura consolidada dos atletas dentro do seu escopo profissional, sem substituir análise individual."}
    actions={[{label:"Atualizar",onClick:load}]}
  >
    {error&&<div className="workflow-error">{error}</div>}
    {loading&&<div className="swim-panel">Consolidando dados reais...</div>}

    {!loading&&role==="clube"&&institution&&<>
      <section className="swim-grid">
        <article className="swim-card"><span>Projetos</span><strong className="swim-kpi">{institutionalProjects.length}</strong><p>Contextos esportivos autorizados.</p></article>
        <article className="swim-card"><span>Sessões</span><strong className="swim-kpi">{institutionalProjects.reduce((s,p)=>s+Number(p.sessoes_total||0),0)}</strong><p>Treinos registrados no contexto institucional.</p></article>
        <article className="swim-card"><span>Atletas com longitudinalidade</span><strong className="swim-kpi">{institutionalProjects.reduce((s,p)=>s+Number(p.atletas_com_evidencia_longitudinal||0),0)}</strong><p>Evidência longitudinal observável.</p></article>
      </section>
      <section className="swim-panel"><span className="swim-panel-label">Projetos</span><h2>Continuidade operacional</h2>
        <div className="swim-list">{institutionalProjects.map(p=><div className="swim-row" key={p.projeto_id}><div><strong>{p.projeto_nome||"Projeto"}</strong><span>{p.atletas_ativos||0} atleta(s) · {p.sessoes_total||0} sessão(ões) · {p.sessoes_concluidas||0} concluída(s)</span></div><span className="swim-pill">{String(p.estado_operacional||"em formação").replaceAll("_"," ")}</span></div>)}</div>
      </section>
      <section className="swim-panel"><span className="swim-panel-label">Governança institucional</span><h2>O que exige atenção</h2>
        {(institution.atencoes_operacionais||[]).length?<div className="swim-list">{institution.atencoes_operacionais.map((a,i)=><div className="swim-row" key={i}><div><strong>{String(a.tipo).replaceAll("_"," ")}</strong><span>{a.mensagem}</span></div><span className="swim-pill">{a.quantidade}</span></div>)}</div>:<div className="swim-empty">Nenhuma atenção agregada imediata.</div>}
      </section>
    </>}

    {!loading&&role!=="clube"&&<>
      <section className="swim-grid">
        <article className="swim-card"><span>Atletas</span><strong className="swim-kpi">{totals.athletes}</strong><p>Dentro do escopo autorizado.</p></article>
        <article className="swim-card"><span>Sessões</span><strong className="swim-kpi">{totals.sessions}</strong><p>{totals.completed} concluída(s).</p></article>
        <article className="swim-card"><span>Volume executado</span><strong>{km(totals.executed)} km</strong><p>{km(totals.planned)} km planejados.</p></article>
        <article className="swim-card"><span>Prontidão</span><strong className="swim-kpi">{totals.readiness}</strong><p>Registros autodeclarados.</p></article>
        <article className="swim-card"><span>Métricas comparáveis</span><strong className="swim-kpi">{totals.comparable}</strong><p>Sem score global substituto.</p></article>
      </section>
      <section className="swim-panel">
        <span className="swim-panel-label">Atletas</span><h2>Relatório de continuidade</h2>
        {rows.length?<div className="swim-list">{rows.map(row=>{
          const r=row.evolution?.resumo||{};
          const tech=row.evolution?.indicador_tecnico||{};
          return <div className="swim-row" key={row.participante_id}>
            <div><strong>{row.nome}</strong><span>{r.sessoes_total||0} sessão(ões) · {km(r.volume_executado_m)} km executados · {r.prontidao_registros||0} prontidão(ões)</span><small>{tech.estado==="comparavel"?(tech.nome||"Métrica técnica comparável"):"Evolução técnica em formação"}</small></div>
            <div className="workflow-actions"><span className="swim-pill">{r.metricas_comparaveis||0} comparável(is)</span><button type="button" className="swim-secondary" onClick={()=>navigate(role==="master"?`/master/atletas/${row.participante_id}`:`/profissional/atletas/${row.participante_id}`)}>Abrir atleta</button></div>
          </div>
        })}</div>:<div className="swim-empty">Nenhum atleta disponível neste escopo.</div>}
      </section>
    </>}
  </SwimmingShell>;
}
