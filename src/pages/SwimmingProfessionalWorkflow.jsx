import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SwimmingShell from "../components/SwimmingShell";
import {
  getParticipantCanonicalBundle,
  createProfessionalAssessment,
  createCanonicalDecision,
  createCanonicalIntervention,
  createCanonicalResponse,
  createCanonicalLearning
} from "../services/canonicalAgp";

const DOMAIN_OPTIONS=[
  ["tecnico","Técnico"],["treino","Treino"],["competicao","Competição"],["fisico","Físico"],
  ["recuperacao","Recuperação"],["fisiologico","Fisiológico"],["medico","Médico"],
  ["psicologico","Psicológico"],["nutricional","Nutricional"],["contextual","Contextual"]
];
const TYPE_OPTIONS=[
  ["tecnica","Técnica"],["treino","Treino"],["recuperacao","Recuperação"],["competicao","Competição"],
  ["saude","Saúde"],["psicologia","Psicologia"],["nutricao","Nutrição"],["disponibilidade","Disponibilidade"],["outra","Outra"]
];

function arr(value,keys){for(const k of keys)if(Array.isArray(value?.[k]))return value[k];return[]}

export default function SwimmingProfessionalWorkflow(){
  const { participantId }=useParams();
  const navigate=useNavigate();
  const [bundle,setBundle]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [assessment,setAssessment]=useState({dominio:"tecnico",instrumento_referencia:"",achados:"",restricoes:"",recomendacoes:"",confianca:""});
  const [decision,setDecision]=useState({dominio:"tecnico",tipo:"tecnica",decisao:"",justificativa:""});
  const [selectedEvidence,setSelectedEvidence]=useState([]);
  const [chain,setChain]=useState({decisionId:null,interventionId:null,responseId:null});
  const [intervention,setIntervention]=useState({descricao:"",resultado_esperado:"",status:"proposta"});
  const [response,setResponse]=useState({conclusao:"",classificacao_profissional:"inconclusiva",confianca:""});
  const [learning,setLearning]=useState({tipo:"resposta_a_intervencao",descricao:"",confianca:""});

  async function load(){
    setLoading(true);setError("");
    try{setBundle(await getParticipantCanonicalBundle(participantId))}
    catch(e){setError(e.message||"Não foi possível carregar o contexto profissional.")}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[participantId]);

  const assessments=useMemo(()=>arr(bundle?.assessments,["avaliacoes","items","registros"]),[bundle]);
  const sessions=useMemo(()=>arr(bundle?.training,["sessoes"]),[bundle]);
  const competitions=useMemo(()=>arr(bundle?.training,["participacoes_prova"]),[bundle]);
  const readiness=useMemo(()=>arr(bundle?.readiness,["historico_recente"]),[bundle]);
  const cycles=useMemo(()=>arr(bundle?.decision,["ciclos"]),[bundle]);
  const facts=useMemo(()=>arr(bundle?.analysis,["fatos_comparaveis"]),[bundle]);

  const evidence=useMemo(()=>{
    const items=[];
    readiness.slice(0,3).forEach(x=>items.push({key:"coleta:"+x.id,tipo_evidencia:"coleta",referencia_id:x.id,label:"Autorreporte do atleta",detail:x.data_hora_coleta||"evidência recente"}));
    sessions.slice(0,3).forEach(x=>items.push({key:"sessao:"+x.id,tipo_evidencia:"sessao",referencia_id:x.id,label:"Sessão de treino",detail:x.tipo_sessao||x.status||"sessão"}));
    competitions.slice(0,3).forEach(x=>items.push({key:"competicao:"+x.id,tipo_evidencia:"competicao",referencia_id:x.id,label:"Participação em prova",detail:x.status||"competição"}));
    assessments.slice(0,3).forEach(x=>items.push({key:"avaliacao:"+x.id,tipo_evidencia:"avaliacao_profissional",referencia_id:x.id,label:"Avaliação profissional",detail:x.dominio||"avaliação"}));
    facts.slice(0,5).forEach(x=>items.push({key:"metrica:"+x.metrica_codigo,tipo_evidencia:"serie_longitudinal",referencia_codigo:x.metrica_codigo,label:x.nome||x.metrica_codigo,detail:"série longitudinal comparável"}));
    return items;
  },[readiness,sessions,competitions,assessments,facts]);

  function toggleEvidence(key){setSelectedEvidence(current=>current.includes(key)?current.filter(x=>x!==key):[...current,key])}

  async function saveAssessment(e){
    e.preventDefault();setError("");setSuccess("");
    try{
      await createProfessionalAssessment(participantId,{
        dominio:assessment.dominio,
        instrumento_referencia:assessment.instrumento_referencia||null,
        metricas:{},
        achados:assessment.achados.trim()?[assessment.achados.trim()]:[],
        restricoes:assessment.restricoes.trim()?[assessment.restricoes.trim()]:[],
        recomendacoes:assessment.recomendacoes.trim()?[assessment.recomendacoes.trim()]:[],
        evidencias:[],
        confianca:assessment.confianca===""?null:Number(assessment.confianca)
      });
      setSuccess("Avaliação profissional registrada dentro do seu escopo.");
      setAssessment({...assessment,instrumento_referencia:"",achados:"",restricoes:"",recomendacoes:"",confianca:""});
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar a avaliação.")}
  }

  async function saveDecision(e){
    e.preventDefault();setError("");setSuccess("");
    const refs=evidence.filter(x=>selectedEvidence.includes(x.key)).map(x=>({
      tipo_evidencia:x.tipo_evidencia,
      referencia_id:x.referencia_id||null,
      referencia_codigo:x.referencia_codigo||null,
      papel:"suporte",
      resumo:{origem_interface:"AGP-Swimming-N1"}
    }));
    if(!refs.length){setError("Selecione ao menos uma evidência real que sustente a decisão.");return}
    try{
      const result=await createCanonicalDecision(participantId,{...decision,evidencias:refs});
      const id=result?.decisao?.id;
      setChain({decisionId:id,interventionId:null,responseId:null});
      setSuccess("Decisão registrada e ligada às evidências selecionadas.");
      setDecision({...decision,decisao:"",justificativa:""});
      setSelectedEvidence([]);
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar a decisão.")}
  }

  async function saveIntervention(e){
    e.preventDefault();setError("");setSuccess("");
    if(!chain.decisionId){setError("Abra uma decisão antes de registrar a intervenção.");return}
    try{
      const r=await createCanonicalIntervention(chain.decisionId,{
        descricao:intervention.descricao,
        resultado_esperado:intervention.resultado_esperado.trim()?{descricao:intervention.resultado_esperado.trim()}:{},
        status:intervention.status
      });
      setChain(c=>({...c,interventionId:r?.intervencao?.id||null}));
      setSuccess("Intervenção registrada como consequência da decisão.");
      setIntervention({descricao:"",resultado_esperado:"",status:"proposta"});
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar a intervenção.")}
  }

  async function saveResponse(e){
    e.preventDefault();setError("");setSuccess("");
    if(!chain.interventionId){setError("Registre a intervenção antes de avaliar a resposta.");return}
    try{
      const r=await createCanonicalResponse(chain.interventionId,{
        conclusao:response.conclusao,
        classificacao_profissional:response.classificacao_profissional||null,
        confianca:response.confianca===""?null:Number(response.confianca)
      });
      setChain(c=>({...c,responseId:r?.resposta?.id||null}));
      setSuccess("Resposta observada registrada. O AGP derivou a comparabilidade disponível.");
      setResponse({conclusao:"",classificacao_profissional:"inconclusiva",confianca:""});
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar a resposta.")}
  }

  async function saveLearning(e){
    e.preventDefault();setError("");setSuccess("");
    if(!chain.responseId){setError("Registre a resposta antes de consolidar aprendizado.");return}
    try{
      await createCanonicalLearning(chain.responseId,{
        tipo:learning.tipo,
        descricao:learning.descricao,
        confianca:learning.confianca===""?null:Number(learning.confianca)
      });
      setSuccess("Aprendizado longitudinal registrado com rastreabilidade ao ciclo.");
      setLearning({tipo:"resposta_a_intervencao",descricao:"",confianca:""});
      setChain({decisionId:null,interventionId:null,responseId:null});
      await load();
    }catch(e){setError(e.message||"Não foi possível registrar o aprendizado.")}
  }

  return <SwimmingShell eyebrow="Profissional · Operação" title="Decidir com contexto, registrar só o essencial" subtitle="O AGP preserva atleta, projeto, papel, competência, credencial e rastreabilidade sem pedir que você redigite o que o sistema já conhece." actions={[{label:"Voltar",onClick:()=>navigate("/dashboard-comissao")},{label:"Atualizar",onClick:load}]}>
    {loading&&<div className="swim-panel">Carregando contexto canônico...</div>}
    {error&&<div className="workflow-error">{error}</div>}
    {success&&<div className="workflow-success">{success}</div>}
    {!loading&&<>
      <section className="swim-grid">
        <article className="swim-card"><span>Avaliações</span><strong className="swim-kpi">{assessments.length}</strong><p>Registros profissionais no contexto atual.</p></article>
        <article className="swim-card"><span>Ciclos de decisão</span><strong className="swim-kpi">{cycles.length}</strong><p>Decisão → intervenção → resposta → aprendizado.</p></article>
        <article className="swim-card"><span>Evidências disponíveis</span><strong className="swim-kpi">{evidence.length}</strong><p>Referências que podem sustentar a decisão sem reentrada manual.</p></article>
      </section>

      <div className="workflow-stack">
        <section className="swim-panel">
          <span className="swim-panel-label">Avaliação profissional</span><h2>Registrar sua leitura</h2>
          <form onSubmit={saveAssessment} className="workflow-grid">
            <label className="workflow-field">Área<select value={assessment.dominio} onChange={e=>setAssessment(a=>({...a,dominio:e.target.value}))}>{DOMAIN_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><small className="workflow-help">Escolha apenas uma área dentro da sua competência. O backend valida escopo e credencial.</small></label>
            <label className="workflow-field">Instrumento ou referência<input value={assessment.instrumento_referencia} onChange={e=>setAssessment(a=>({...a,instrumento_referencia:e.target.value}))} placeholder="Opcional" /></label>
            <label className="workflow-field full">Achados<textarea rows="4" value={assessment.achados} onChange={e=>setAssessment(a=>({...a,achados:e.target.value}))} placeholder="O que você observou?" /></label>
            <label className="workflow-field">Restrições<textarea rows="3" value={assessment.restricoes} onChange={e=>setAssessment(a=>({...a,restricoes:e.target.value}))} placeholder="Opcional" /></label>
            <label className="workflow-field">Recomendações<textarea rows="3" value={assessment.recomendacoes} onChange={e=>setAssessment(a=>({...a,recomendacoes:e.target.value}))} placeholder="Opcional" /></label>
            <label className="workflow-field">Confiança profissional (%)<input type="number" min="0" max="100" value={assessment.confianca} onChange={e=>setAssessment(a=>({...a,confianca:e.target.value}))} placeholder="Opcional" /></label>
            <div className="workflow-actions"><button className="swim-primary" type="submit">Registrar avaliação</button></div>
          </form>
        </section>

        <section className="swim-panel">
          <span className="swim-panel-label">Decisão</span><h2>Evidência → decisão</h2>
          <form onSubmit={saveDecision} className="workflow-grid">
            <label className="workflow-field">Domínio<select value={decision.dominio} onChange={e=>setDecision(d=>({...d,dominio:e.target.value}))}>{DOMAIN_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
            <label className="workflow-field">Tipo<select value={decision.tipo} onChange={e=>setDecision(d=>({...d,tipo:e.target.value}))}>{TYPE_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
            <label className="workflow-field full">Decisão<textarea rows="3" required minLength="5" value={decision.decisao} onChange={e=>setDecision(d=>({...d,decisao:e.target.value}))} placeholder="O que deve ser feito ou considerado?" /></label>
            <label className="workflow-field full">Justificativa<textarea rows="3" required minLength="5" value={decision.justificativa} onChange={e=>setDecision(d=>({...d,justificativa:e.target.value}))} placeholder="Por que esta decisão faz sentido diante das evidências?" /></label>
            <div className="workflow-field full"><span>Evidências de suporte</span><div className="workflow-evidence">{evidence.length?evidence.map(item=><label key={item.key}><input type="checkbox" checked={selectedEvidence.includes(item.key)} onChange={()=>toggleEvidence(item.key)} /><span><strong>{item.label}</strong><span>{item.detail}</span></span></label>):<div className="swim-empty">Ainda não há evidências estruturadas disponíveis para sustentar uma decisão.</div>}</div></div>
            <div className="workflow-actions"><button className="swim-primary" type="submit" disabled={!evidence.length}>Registrar decisão</button></div>
          </form>
        </section>

        <section className="swim-panel">
          <span className="swim-panel-label">Continuidade do ciclo</span><h2>Intervenção → resposta → aprendizado</h2>
          <p className="swim-muted">Depois de uma decisão registrada nesta sessão, o AGP mantém o contexto e você informa apenas o conteúdo humano necessário.</p>
          <div className="workflow-stack">
            <form onSubmit={saveIntervention} className="workflow-stage">
              <h3>1. Intervenção</h3><p>{chain.decisionId?"Decisão vinculada e pronta para continuidade.":"Registre ou selecione uma decisão para iniciar."}</p>
              <div className="workflow-grid"><label className="workflow-field full">Descrição<textarea rows="3" required minLength="5" value={intervention.descricao} onChange={e=>setIntervention(i=>({...i,descricao:e.target.value}))} /></label><label className="workflow-field full">Resultado esperado<input value={intervention.resultado_esperado} onChange={e=>setIntervention(i=>({...i,resultado_esperado:e.target.value}))} placeholder="Opcional" /></label><label className="workflow-field">Estado<select value={intervention.status} onChange={e=>setIntervention(i=>({...i,status:e.target.value}))}><option value="proposta">Proposta</option><option value="aprovada">Aprovada</option><option value="em_execucao">Em execução</option></select></label></div>
              <div className="workflow-actions"><button className="swim-secondary" disabled={!chain.decisionId}>Registrar intervenção</button></div>
            </form>

            <form onSubmit={saveResponse} className="workflow-stage">
              <h3>2. Resposta observada</h3><p>{chain.interventionId?"Intervenção vinculada. Registre o que foi observado.":"A resposta só aparece depois de uma intervenção."}</p>
              <div className="workflow-grid"><label className="workflow-field full">Conclusão<textarea rows="3" required minLength="5" value={response.conclusao} onChange={e=>setResponse(r=>({...r,conclusao:e.target.value}))} /></label><label className="workflow-field">Classificação profissional<select value={response.classificacao_profissional} onChange={e=>setResponse(r=>({...r,classificacao_profissional:e.target.value}))}><option value="favoravel">Favorável</option><option value="neutra">Neutra</option><option value="desfavoravel">Desfavorável</option><option value="inconclusiva">Inconclusiva</option></select></label><label className="workflow-field">Confiança (%)<input type="number" min="0" max="100" value={response.confianca} onChange={e=>setResponse(r=>({...r,confianca:e.target.value}))} /></label></div>
              <div className="workflow-actions"><button className="swim-secondary" disabled={!chain.interventionId}>Registrar resposta</button></div>
            </form>

            <form onSubmit={saveLearning} className="workflow-stage">
              <h3>3. Aprendizado longitudinal</h3><p>{chain.responseId?"Resposta vinculada. Registre o aprendizado sem transformar associação em causalidade.":"O aprendizado é registrado depois da resposta observada."}</p>
              <div className="workflow-grid"><label className="workflow-field">Tipo<select value={learning.tipo} onChange={e=>setLearning(l=>({...l,tipo:e.target.value}))}><option value="fato">Fato</option><option value="padrao_observado">Padrão observado</option><option value="hipotese">Hipótese</option><option value="limitacao">Limitação</option><option value="resposta_a_intervencao">Resposta à intervenção</option><option value="nao_comparavel">Não comparável</option></select></label><label className="workflow-field">Confiança (0 a 1)<input type="number" min="0" max="1" step="0.01" value={learning.confianca} onChange={e=>setLearning(l=>({...l,confianca:e.target.value}))} /></label><label className="workflow-field full">Descrição<textarea rows="3" required minLength="5" value={learning.descricao} onChange={e=>setLearning(l=>({...l,descricao:e.target.value}))} /></label></div>
              <div className="workflow-actions"><button className="swim-secondary" disabled={!chain.responseId}>Registrar aprendizado</button></div>
            </form>
          </div>
        </section>

        <section className="swim-panel">
          <span className="swim-panel-label">Histórico do ciclo</span><h2>Estado de fechamento</h2>
          {cycles.length?<div className="swim-list">{cycles.map(c=><div className="swim-row" key={c.decisao_id}><div><strong>{c.decisao}</strong><span>{c.dominio} · {c.tipo} · {c.evidencias_total||0} evidência(s)</span></div><span className="swim-pill">{String(c.estado_ciclo||c.decisao_estado||"registrado").replaceAll("_"," ")}</span></div>)}</div>:<div className="swim-empty">Nenhum ciclo de decisão registrado.</div>}
        </section>
      </div>
    </>}
  </SwimmingShell>
}
