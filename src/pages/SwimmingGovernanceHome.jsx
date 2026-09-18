import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";

export default function SwimmingGovernanceHome(){
  const navigate=useNavigate();
  const [data,setData]=useState({institutions:[],projects:[],participants:[],profiles:[],athleteProfiles:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    const [i,p,pa,sp,ap]=await Promise.all([
      supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,status,tipo"),
      supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,status"),
      supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,funcao_no_projeto,status_onboarding,ativo"),
      supabase.from("agp_perfis_especializacao_esportiva").select("id,codigo,versao,status_catalogo"),
      supabase.from("agp_perfis_esportivos").select("pessoa_id,status_federativo,federacao_nome,registro_federativo").eq("status","ativo")
    ]);
    const e=i.error||p.error||pa.error||sp.error||ap.error;
    if(e)setError("Não foi possível consolidar a governança agora.");
    setData({institutions:i.data||[],projects:p.data||[],participants:pa.data||[],profiles:sp.data||[],athleteProfiles:ap.data||[]});
    setLoading(false);
  }

  useEffect(()=>{load()},[]);

  const n1=useMemo(()=>data.institutions.find(x=>x.slug==="n1-academia")||data.institutions.find(x=>String(x.nome||"").toLowerCase().includes("n1"))||null,[data.institutions]);
  const n1Projects=data.projects.filter(x=>x.instituicao_id===n1?.id);
  const swimmers=data.participants.filter(x=>x.ativo&&x.funcao_no_projeto==="atleta"&&n1Projects.some(p=>p.id===x.projeto_id));
  const swimmingProfile=data.profiles.find(x=>x.codigo==="AGP-SWIMMING-POOL");
  const swimmerIds=new Set(swimmers.map(x=>x.pessoa_id));
  const federated=data.athleteProfiles.filter(x=>swimmerIds.has(x.pessoa_id)&&x.status_federativo==="federado").length;
  const linked=data.athleteProfiles.filter(x=>swimmerIds.has(x.pessoa_id)&&x.status_federativo==="vinculado").length;

  return <SwimmingShell eyebrow="Governança · AGP Swimming" title="Governar o sistema sem interferir no acompanhamento esportivo" subtitle="O Master administra estrutura, segurança, versões e implantação. O acompanhamento do atleta pertence aos profissionais autorizados." actions={[{label:"Entender as jornadas",onClick:()=>navigate("/master/jornada-homologacao"),primary:true},{label:"Atualizar",onClick:load}]}>
    {error&&<div className="swim-notice">{error}</div>}
    <section className="swim-focus"><div><span className="swim-eyebrow">Marco atual</span><h2>Interface de homologação N1</h2><p>A base técnica está fechada. Esta camada existe para permitir que a N1 utilize o AGP com atletas e profissionais reais.</p></div></section>
    <section className="swim-grid">
      <article className="swim-card"><span>Instituição N1</span><strong>{loading?"…":n1?"Vinculada":"Pendente"}</strong><p>{n1?.nome_exibicao||n1?.nome||"Aguardando vínculo institucional."}</p></article>
      <article className="swim-card"><span>Perfil Natação</span><strong>{loading?"…":swimmingProfile?.versao||"—"}</strong><p>{swimmingProfile?.codigo||"Perfil não encontrado"} · {swimmingProfile?.status_catalogo||"—"}</p></article>
      <article className="swim-card"><span>Atletas N1</span><strong className="swim-kpi">{loading?"…":swimmers.length}</strong><p>Somente vínculos reais serão usados na homologação.</p></article>
      <article className="swim-card"><span>Status esportivo</span><strong>{loading?"…":federated+" federado(s)"}</strong><p>{linked} vinculado(s) · contexto visível em toda a homologação.</p></article>
    </section>
    <section className="swim-panel">
      <span className="swim-panel-label">Regra de governança</span><h2>O Master administra a plataforma, não substitui os profissionais</h2>
      <p className="swim-muted">O Master pode compreender e apresentar todas as jornadas do produto, mas não registra treino, valida evidência ou toma decisão profissional em nome de atletas, técnicos ou especialistas.</p>
    </section>
  </SwimmingShell>
}
