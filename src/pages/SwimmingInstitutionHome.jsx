import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import { getInstitutionalIntelligence } from "../services/canonicalAgp";

export default function SwimmingInstitutionHome(){
  const { perfil } = useAuth();
  const [data,setData]=useState({institution:null,projects:[],members:[],athletes:[],intelligence:null});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const membership=await supabase.from("agp_membros_instituicao")
        .select("instituicao_id").eq("auth_id",perfil?.auth_id).eq("ativo",true).limit(1).maybeSingle();
      if(membership.error||!membership.data?.instituicao_id)throw membership.error||new Error("sem vínculo");
      const institutionId=membership.data.instituicao_id;
      const [i,p,m]=await Promise.all([
        supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,status").eq("id",institutionId).maybeSingle(),
        supabase.from("agp_projetos_validacao").select("id,nome,status").eq("instituicao_id",institutionId),
        supabase.from("agp_membros_instituicao").select("id,papel,ativo").eq("instituicao_id",institutionId).eq("ativo",true)
      ]);
      if(i.error||p.error||m.error)throw i.error||p.error||m.error;
      const projects=p.data||[];
      const ids=projects.map(x=>x.id);
      let athletes=[];
      if(ids.length){
        const a=await supabase.from("agp_participantes_projeto")
          .select("id,pessoa_id,projeto_id,status_onboarding,tecnico_responsavel_pessoa_id")
          .in("projeto_id",ids).eq("funcao_no_projeto","atleta").eq("ativo",true);
        if(a.error)throw a.error;
        const rows=a.data||[];
        const personIds=[...new Set(rows.map(x=>x.pessoa_id).filter(Boolean))];
        const profiles=personIds.length?await supabase.from("agp_perfis_esportivos")
          .select("pessoa_id,status_federativo,federacao_nome,registro_federativo")
          .in("pessoa_id",personIds).eq("status","ativo"):{data:[],error:null};
        if(profiles.error)throw profiles.error;
        const profileMap=Object.fromEntries((profiles.data||[]).map(x=>[x.pessoa_id,x]));
        athletes=rows.map(x=>({...x,perfil_esportivo:profileMap[x.pessoa_id]||{}}));
      }
      let intelligence=null;
      try{intelligence=await getInstitutionalIntelligence(institutionId)}catch{}
      setData({institution:i.data,projects,members:m.data||[],athletes,intelligence});
    }catch{
      setError("A visão institucional não está disponível para este acesso.");
      setData({institution:null,projects:[],members:[],athletes:[],intelligence:null});
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[perfil?.auth_id]);

  const pending=useMemo(()=>data.athletes.filter(a=>!a.tecnico_responsavel_pessoa_id||!["ativo","apto_para_coleta"].includes(String(a.status_onboarding||"").toLowerCase())),[data.athletes]);
  const activeProjects=data.projects.filter(p=>!["suspenso","concluido"].includes(String(p.status||"").toLowerCase()));
  const federated=data.athletes.filter(a=>a.perfil_esportivo?.status_federativo==="federado").length;
  const linked=data.athletes.filter(a=>a.perfil_esportivo?.status_federativo==="vinculado").length;
  const canonicalProjects=data.intelligence?.projetos||[];
  const sessionsTotal=canonicalProjects.reduce((s,p)=>s+Number(p.sessoes_total||0),0);
  const sessionsCompleted=canonicalProjects.reduce((s,p)=>s+Number(p.sessoes_concluidas||0),0);
  const sessionsOpen=canonicalProjects.reduce((s,p)=>s+Number(p.sessoes_abertas||0),0);
  const longitudinalAthletes=canonicalProjects.reduce((s,p)=>s+Number(p.atletas_com_evidencia_longitudinal||0),0);

  const focus=loading?["Organizando a instituição","O AGP está reunindo somente o contexto institucional autorizado."]:
    pending.length?[String(pending.length)+" atleta(s) com pendência","A instituição deve tratar vínculos e condições operacionais; a decisão esportiva continua com os profissionais responsáveis."]:
    data.athletes.length?["Operação estrutural em ordem","Acompanhe exceções e continuidade. O AGP não cria ranking institucional ou score global."]:
    ["Preparar os primeiros atletas","A estrutura institucional existe; o próximo passo real ocorre quando atletas e profissionais legítimos forem vinculados."];

  return <SwimmingShell eyebrow="Instituição · Natação" title={data.institution?.nome_exibicao||data.institution?.nome||"N1 · Natação"} subtitle="Governança institucional sem substituir o trabalho técnico." actions={[{label:"Atualizar",onClick:load}]}>
    {error&&<div className="swim-notice">{error}</div>}
    <section className="swim-focus"><div><span className="swim-eyebrow">Agora</span><h2>{focus[0]}</h2><p>{focus[1]}</p></div></section>
    <section className="swim-grid">
      <article className="swim-card"><span>Atletas ativos</span><strong className="swim-kpi">{loading?"…":data.athletes.length}</strong><p>Pessoas acompanhadas no contexto institucional.</p></article>
      <article className="swim-card"><span>Equipe ativa</span><strong className="swim-kpi">{loading?"…":data.members.length}</strong><p>Vínculos institucionais ativos.</p></article>
      <article className="swim-card"><span>Projetos ativos</span><strong className="swim-kpi">{loading?"…":activeProjects.length}</strong><p>Contextos esportivos em andamento.</p></article>
      <article className="swim-card"><span>Status esportivo</span><strong>{loading?"…":federated+" federado(s)"}</strong><p>{linked} vinculado(s) · classificação contextual para planejamento e inscrição, não elegibilidade automática.</p></article>
      <article className="swim-card"><span>Sessões registradas</span><strong className="swim-kpi">{loading?"…":sessionsTotal}</strong><p>{sessionsCompleted} concluída(s) · {sessionsOpen} aberta(s).</p></article>
      <article className="swim-card"><span>Longitudinalidade</span><strong className="swim-kpi">{loading?"…":longitudinalAthletes}</strong><p>Atleta(s) com evidência longitudinal observável.</p></article>
    </section>
    <section className="swim-panel">
      <span className="swim-panel-label">Leitura institucional</span><h2>Do dado à decisão com contexto</h2>
      <p className="swim-muted">{data.intelligence?.devolucao_operacional?.significado||"A inteligência institucional cresce com a continuidade de dados reais, sem ranking global de atletas."}</p>
      <div className="swim-list">
        {(data.intelligence?.atencoes_operacionais||[]).length?(data.intelligence.atencoes_operacionais||[]).map((item,index)=><div className="swim-row" key={index}><div><strong>{String(item.tipo||"atenção").replaceAll("_"," ")}</strong><span>{item.mensagem}</span></div><span className="swim-pill">{item.quantidade}</span></div>):<div className="swim-empty">Nenhuma atenção operacional agregada imediata.</div>}
      </div>
    </section>
    
    <section className="swim-panel">
      <span className="swim-panel-label">Exceções institucionais</span><h2>O que exige ação administrativa</h2>
      {pending.length?<div className="swim-list">{pending.map(item=><div className="swim-row" key={item.id}><div><strong>Atleta com preparação incompleta</strong><span>{!item.tecnico_responsavel_pessoa_id?"Sem profissional responsável":"Onboarding ainda não concluído"}</span></div><span className="swim-pill">institucional</span></div>)}</div>:<div className="swim-empty">Nenhuma exceção institucional imediata.</div>}
    </section>
  </SwimmingShell>
}
