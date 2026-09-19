import { useEffect,useMemo,useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import { getInstitutionalIntelligence } from "../services/canonicalAgp";

export default function SwimmingProfessionalInstitution(){
  const {perfil}=useAuth();
  const [data,setData]=useState({institution:null,projects:[],athletes:[],intelligence:null});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      if(!perfil?.pessoa_id)throw new Error("Identidade profissional não disponível.");
      const own=await supabase.from("agp_participantes_projeto")
        .select("projeto_id,funcao_no_projeto,ativo")
        .eq("pessoa_id",perfil.pessoa_id).eq("ativo",true);
      if(own.error)throw own.error;
      const projectIds=[...new Set((own.data||[]).map(x=>x.projeto_id).filter(Boolean))];
      if(!projectIds.length)throw new Error("Nenhum projeto profissional ativo.");

      const projectsResult=await supabase.from("agp_projetos_validacao")
        .select("id,nome,status,instituicao_id").in("id",projectIds);
      if(projectsResult.error)throw projectsResult.error;
      const projects=projectsResult.data||[];
      const institutionId=projects.find(x=>x.instituicao_id)?.instituicao_id;
      if(!institutionId)throw new Error("Instituição do projeto não identificada.");

      const institutionResult=await supabase.from("agp_instituicoes")
        .select("id,nome,nome_exibicao,slug,status,tipo,localidade").eq("id",institutionId).maybeSingle();
      if(institutionResult.error)throw institutionResult.error;

      const athletesResult=await supabase.from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,status_onboarding,tecnico_responsavel_pessoa_id")
        .in("projeto_id",projectIds).eq("funcao_no_projeto","atleta").eq("ativo",true);
      if(athletesResult.error)throw athletesResult.error;

      let intelligence=null;
      try{intelligence=await getInstitutionalIntelligence(institutionId)}catch{}
      setData({institution:institutionResult.data,projects,athletes:athletesResult.data||[],intelligence});
    }catch(e){
      setError(e.message||"Não foi possível carregar o contexto institucional.");
      setData({institution:null,projects:[],athletes:[],intelligence:null});
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[perfil?.pessoa_id]);

  const canonicalProjects=useMemo(()=>data.intelligence?.projetos||[],[data.intelligence]);
  const sessions=canonicalProjects.reduce((s,p)=>s+Number(p.sessoes_total||0),0);
  const completed=canonicalProjects.reduce((s,p)=>s+Number(p.sessoes_concluidas||0),0);
  const longitudinal=canonicalProjects.reduce((s,p)=>s+Number(p.atletas_longitudinalidade_observavel||0),0);

  return <SwimmingShell
    eyebrow="Profissional · Instituição"
    title={data.institution?.nome_exibicao||data.institution?.nome||"Contexto institucional"}
    subtitle="Visão do ambiente ao qual seu trabalho está vinculado. O técnico enxerga estrutura e continuidade sem assumir funções administrativas."
    actions={[{label:"Atualizar",onClick:load}]}
  >
    {error&&<div className="workflow-error">{error}</div>}
    <section className="swim-grid">
      <article className="swim-card"><span>Projetos</span><strong className="swim-kpi">{loading?"…":data.projects.length}</strong><p>Contextos esportivos aos quais você está vinculado.</p></article>
      <article className="swim-card"><span>Atletas</span><strong className="swim-kpi">{loading?"…":data.athletes.length}</strong><p>Atletas ativos nos projetos do seu escopo.</p></article>
      <article className="swim-card"><span>Sessões</span><strong className="swim-kpi">{loading?"…":sessions}</strong><p>{completed} concluída(s) no contexto institucional.</p></article>
      <article className="swim-card"><span>Longitudinalidade</span><strong className="swim-kpi">{loading?"…":longitudinal}</strong><p>Atleta(s) com evidência longitudinal observável.</p></article>
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Projetos vinculados</span><h2>Onde sua atuação acontece</h2>
      {data.projects.length?<div className="swim-list">{data.projects.map(p=>{
        const intel=canonicalProjects.find(x=>String(x.projeto_id)===String(p.id))||{};
        return <div className="swim-row" key={p.id}>
          <div><strong>{p.nome||"Projeto"}</strong><span>{p.status||"ativo"} · {intel.atletas_ativos||0} atleta(s) · {intel.sessoes_total||0} sessão(ões)</span></div>
          <span className="swim-pill">{String(intel.estado_operacional||"contexto ativo").replaceAll("_"," ")}</span>
        </div>
      })}</div>:<div className="swim-empty">Nenhum projeto disponível.</div>}
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Pertencimento</span><h2>Mesmo ambiente, responsabilidades diferentes</h2>
      <p className="swim-muted">O AGP Swim mantém atleta, técnico, especialistas e instituição dentro da mesma história esportiva. Aqui você enxerga o contexto institucional; decisões técnicas continuam vinculadas ao seu papel e às evidências do atleta.</p>
    </section>
  </SwimmingShell>;
}
