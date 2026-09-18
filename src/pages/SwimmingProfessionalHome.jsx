import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import { getParticipantCanonicalBundle } from "../services/canonicalAgp";

function formatDate(value){if(!value)return"—";try{return new Date(value).toLocaleString("pt-BR")}catch{return"—"}}
function arr(value, keys){for(const key of keys)if(Array.isArray(value?.[key]))return value[key];return[]}

export default function SwimmingProfessionalHome(){
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [athletes,setAthletes]=useState([]);
  const [selected,setSelected]=useState(null);
  const [bundle,setBundle]=useState(null);
  const [loading,setLoading]=useState(true);
  const [detailLoading,setDetailLoading]=useState(false);
  const [error,setError]=useState("");

  async function loadAthletes(){
    setLoading(true);setError("");
    try{
      const personId=perfil?.pessoa_id;
      if(!personId){setAthletes([]);return}
      const p=await supabase.from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,status_onboarding,funcao_canonica_codigo,tecnico_responsavel_pessoa_id")
        .eq("funcao_no_projeto","atleta").eq("ativo",true).eq("tecnico_responsavel_pessoa_id",personId);
      if(p.error)throw p.error;
      const rows=p.data||[];
      const personIds=[...new Set(rows.map(x=>x.pessoa_id).filter(Boolean))];
      const [people,profiles]=personIds.length?await Promise.all([
        supabase.from("agp_pessoas").select("id,nome").in("id",personIds),
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,categoria,nivel,status_federativo,federacao_nome,registro_federativo").in("pessoa_id",personIds).eq("status","ativo")
      ]):[{data:[],error:null},{data:[],error:null}];
      if(people.error||profiles.error)throw people.error||profiles.error;
      const map=Object.fromEntries((people.data||[]).map(x=>[x.id,x]));
      const profileMap=Object.fromEntries((profiles.data||[]).map(x=>[x.pessoa_id,x]));
      const result=rows.map(x=>({...x,nome:map[x.pessoa_id]?.nome||"Atleta",perfil_esportivo:profileMap[x.pessoa_id]||{}}));
      setAthletes(result);
      if(result.length&&!selected)await openAthlete(result[0]);
    }catch{
      setAthletes([]);setError("Não foi possível carregar os atletas vinculados ao seu escopo.");
    }finally{setLoading(false)}
  }

  async function openAthlete(athlete){
    setSelected(athlete);setDetailLoading(true);setBundle(null);setError("");
    try{setBundle(await getParticipantCanonicalBundle(athlete.id))}
    catch{setError("Não foi possível carregar o contexto canônico deste atleta.")}
    finally{setDetailLoading(false)}
  }

  useEffect(()=>{loadAthletes()},[perfil?.pessoa_id]);

  const sessions=useMemo(()=>arr(bundle?.training,["sessoes"]),[bundle]);
  const competitions=useMemo(()=>arr(bundle?.training,["participacoes_prova"]),[bundle]);
  const assessments=useMemo(()=>arr(bundle?.assessments,["avaliacoes","items","registros"]),[bundle]);
  const decisions=useMemo(()=>arr(bundle?.decision,["ciclos","decisoes","items"]),[bundle]);
  const series=useMemo(()=>arr(bundle?.longitudinal,["series","series_longitudinais","metricas"]),[bundle]);
  const analysisState=bundle?.analysis?.estado||bundle?.analysis?.estado_analitico||bundle?.analysis?.status||"dados_insuficientes";

  const nextAction=useMemo(()=>{
    if(!selected)return["Nenhum atleta vinculado","O AGP só apresenta pessoas dentro do seu escopo profissional."];
    if(bundle?.unavailable?.length)return["Contexto parcialmente disponível","Algumas camadas ainda não possuem evidência suficiente ou não pertencem ao seu escopo."];
    if(String(analysisState).includes("insuf"))return["Evidência antes de decisão","Ainda não há base suficiente para uma interpretação mais profunda."];
    if(!decisions.length)return["Interpretar antes de intervir","Há contexto disponível; a decisão profissional deve permanecer rastreável ao que a sustenta."];
    return["Acompanhar resposta","Existe decisão registrada. O próximo valor vem da resposta observada ao longo do tempo."];
  },[selected,bundle,analysisState,decisions.length]);

  return <SwimmingShell
    eyebrow="Profissional · Natação"
    title="Atenção ao atleta, não ao sistema"
    subtitle="O AGP organiza o contexto que você já tem autorização para usar e mantém a decisão sob responsabilidade profissional."
    actions={[{label:"Atualizar",onClick:loadAthletes}]}
  >
    {error&&<div className="swim-notice">{error}</div>}
    <section className="swim-focus"><div><span className="swim-eyebrow">Próxima leitura</span><h2>{nextAction[0]}</h2><p>{nextAction[1]}</p></div></section>

    <div className="swim-two">
      <section className="swim-panel">
        <span className="swim-panel-label">Meus atletas</span><h2>Vínculos ativos</h2>
        {loading?<div className="swim-empty">Carregando...</div>:athletes.length?<div className="swim-list">{athletes.map(a=><button key={a.id} className={selected?.id===a.id?"swim-athlete-button active":"swim-athlete-button"} onClick={()=>openAthlete(a)}><strong>{a.nome}</strong><span>{a.perfil_esportivo?.status_federativo === "federado" ? "Federado" : a.perfil_esportivo?.status_federativo === "vinculado" ? "Vinculado" : "Status federativo não informado"} · {a.status_onboarding||"acompanhamento ativo"}</span></button>)}</div>:<div className="swim-empty">Nenhum atleta está vinculado ao seu escopo atual.</div>}
      </section>

      <section className="swim-panel">
        <span className="swim-panel-label">Contexto selecionado</span><h2>{selected?.nome||"Selecione um atleta"}</h2>
        {detailLoading?<div className="swim-empty">Carregando contexto...</div>:selected&&<div className="swim-list">
          <div className="swim-row"><div><strong>Status esportivo</strong><span>{selected?.perfil_esportivo?.status_federativo === "federado" ? ["Federado",selected?.perfil_esportivo?.federacao_nome,selected?.perfil_esportivo?.registro_federativo].filter(Boolean).join(" · ") : selected?.perfil_esportivo?.status_federativo === "vinculado" ? "Vinculado" : "Não informado"}</span></div><span className="swim-pill">contexto</span></div>
          <div className="swim-row"><div><strong>Estado analítico</strong><span>{String(analysisState).replaceAll("_"," ")}</span></div><span className="swim-pill">evidência</span></div>
          <div className="swim-row"><div><strong>Treinos no recorte</strong><span>{sessions.length} sessão(ões)</span></div></div>
          <div className="swim-row"><div><strong>Competições</strong><span>{competitions.length} participação(ões)</span></div></div>
          <div className="swim-row"><div><strong>Avaliações profissionais</strong><span>{assessments.length} registro(s)</span></div></div>
          <div className="swim-row"><div><strong>Decisões</strong><span>{decisions.length} registro(s)</span></div></div>
          <div className="workflow-actions"><button className="swim-primary" onClick={()=>navigate(`/profissional/atletas/${selected.id}`)}>Abrir operação profissional</button></div>
        </div>}
      </section>
    </div>

    {selected&&bundle&&<section className="swim-panel">
      <div className="swim-panel-head"><div><span className="swim-panel-label">Linha longitudinal</span><h2>O que o histórico permite observar</h2></div></div>
      {series.length?<div className="swim-list">{series.slice(0,16).map((s,i)=><div className="swim-row" key={s.metrica_id||s.id||i}><div><strong>{s.nome_canonico||s.metrica_codigo||"Métrica"}</strong><span>{s.amostras ? String(s.amostras)+" observações" : "contexto longitudinal"} · última: {formatDate(s.ultima_medicao_em)}</span></div><span className="swim-pill">{s.estado_comparabilidade||"contextual"}</span></div>)}</div>:<div className="swim-empty">Ainda não há série comparável suficiente. O AGP preserva a ausência de evidência em vez de preencher lacunas.</div>}
    </section>}

    {selected&&bundle&&<section className="swim-panel">
      <span className="swim-panel-label">Segurança profissional</span><h2>Competência determina ação</h2>
      <p className="swim-muted">O sistema pode organizar evidência, contexto e histórico. A interpretação e a decisão permanecem limitadas ao papel, à competência e à credencial aplicável de cada profissional.</p>
    </section>}
  </SwimmingShell>
}
