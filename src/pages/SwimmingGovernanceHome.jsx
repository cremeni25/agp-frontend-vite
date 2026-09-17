import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";

export default function SwimmingGovernanceHome(){
  const [data,setData]=useState({institutions:[],projects:[],participants:[],profiles:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    const [i,p,pa,sp]=await Promise.all([
      supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,status,tipo"),
      supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,status"),
      supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,funcao_no_projeto,status_onboarding,ativo"),
      supabase.from("agp_perfis_especializacao_esportiva").select("id,codigo,versao,status_catalogo")
    ]);
    const e=i.error||p.error||pa.error||sp.error;
    if(e)setError("Não foi possível consolidar a governança agora.");
    setData({institutions:i.data||[],projects:p.data||[],participants:pa.data||[],profiles:sp.data||[]});
    setLoading(false);
  }

  useEffect(()=>{load()},[]);

  const n1=useMemo(()=>data.institutions.find(x=>x.slug==="n1-academia")||data.institutions.find(x=>String(x.nome||"").toLowerCase().includes("n1"))||null,[data.institutions]);
  const n1Projects=data.projects.filter(x=>x.instituicao_id===n1?.id);
  const swimmers=data.participants.filter(x=>x.ativo&&x.funcao_no_projeto==="atleta"&&n1Projects.some(p=>p.id===x.projeto_id));
  const swimmingProfile=data.profiles.find(x=>x.codigo==="AGP-SWIMMING-POOL");

  return <SwimmingShell eyebrow="Governança · AGP Swimming" title="Preparar a homologação sem operar o atleta" subtitle="O Master governa estrutura, segurança, versões e implantação. A operação esportiva pertence aos usuários legítimos." actions={[{label:"Atualizar",onClick:load}]}>
    {error&&<div className="swim-notice">{error}</div>}
    <section className="swim-focus"><div><span className="swim-eyebrow">Marco atual</span><h2>Interface de homologação N1</h2><p>A base técnica está fechada. Esta camada existe para permitir que a N1 utilize o AGP com atletas e profissionais reais.</p></div></section>
    <section className="swim-grid">
      <article className="swim-card"><span>Instituição N1</span><strong>{loading?"…":n1?"Vinculada":"Pendente"}</strong><p>{n1?.nome_exibicao||n1?.nome||"Aguardando vínculo institucional."}</p></article>
      <article className="swim-card"><span>Perfil Natação</span><strong>{loading?"…":swimmingProfile?.versao||"—"}</strong><p>{swimmingProfile?.codigo||"Perfil não encontrado"} · {swimmingProfile?.status_catalogo||"—"}</p></article>
      <article className="swim-card"><span>Atletas N1</span><strong className="swim-kpi">{loading?"…":swimmers.length}</strong><p>Somente vínculos reais serão usados na homologação.</p></article>
    </section>
    <section className="swim-panel">
      <span className="swim-panel-label">Regra de governança</span><h2>O Master não é operador esportivo</h2>
      <p className="swim-muted">Não há atalho de governança para registrar treino, validar evidência ou tomar decisão profissional. O Marco 0 será homologado por pessoas legítimas em seus próprios papéis.</p>
    </section>
  </SwimmingShell>
}
