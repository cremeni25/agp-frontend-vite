import { useEffect,useMemo,useState } from "react";
import { getSwimmingEvolution } from "../services/canonicalAgp";
import "../styles/agp-swimming.css";

function km(value){
  const n=Number(value||0)/1000;
  return new Intl.NumberFormat("pt-BR",{minimumFractionDigits:n<10?1:0,maximumFractionDigits:1}).format(n);
}

function pct(value){
  if(value==null||Number.isNaN(Number(value)))return null;
  const n=Number(value);
  const sign=n>0?"+":"";
  return `${sign}${new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(n)}%`;
}

function monthSlice(rows,windowMonths){
  if(!Array.isArray(rows))return[];
  return rows.slice(Math.max(0,rows.length-windowMonths));
}

function VolumeChart({rows}){
  const data=rows||[];
  const max=Math.max(1,...data.flatMap(x=>[Number(x.volume_planejado_m||0),Number(x.volume_executado_m||0)]));
  const w=900,h=300,padL=54,padR=20,padT=20,padB=46;
  const innerW=w-padL-padR,innerH=h-padT-padB;
  const step=data.length?innerW/data.length:innerW;
  const barW=Math.max(8,Math.min(24,step*.24));
  const y=v=>padT+innerH-(Number(v||0)/max)*innerH;
  const grid=[0,.25,.5,.75,1];

  return <div className="swim-chart-wrap">
    <svg className="swim-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Progressão mensal de volume de treino">
      {grid.map(g=>{
        const yy=padT+innerH-innerH*g;
        return <g key={g}><line x1={padL} x2={w-padR} y1={yy} y2={yy} className="swim-chart-grid"/><text x={padL-10} y={yy+4} textAnchor="end" className="swim-chart-axis">{Math.round(max*g/1000)}k</text></g>
      })}
      {data.map((row,i)=>{
        const center=padL+step*i+step/2;
        const planned=Number(row.volume_planejado_m||0);
        const executed=Number(row.volume_executado_m||0);
        return <g key={row.mes}>
          <rect x={center-barW-2} y={y(planned)} width={barW} height={Math.max(1,padT+innerH-y(planned))} rx="5" className="swim-chart-planned"/>
          <rect x={center+2} y={y(executed)} width={barW} height={Math.max(1,padT+innerH-y(executed))} rx="5" className="swim-chart-executed"/>
          <text x={center} y={h-18} textAnchor="middle" className="swim-chart-axis">{row.rotulo}</text>
        </g>
      })}
    </svg>
    <div className="swim-chart-legend"><span><i className="planned"/>Planejado</span><span><i className="executed"/>Executado</span></div>
  </div>;
}

export default function AthleteEvolutionDashboard({participantId,role="athlete",embedded=false}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [windowMonths,setWindowMonths]=useState(12);

  async function load(){
    if(!participantId)return;
    setLoading(true);setError("");
    try{setData(await getSwimmingEvolution(participantId))}
    catch(e){setError(e.message||"Não foi possível carregar a evolução do atleta.");setData(null)}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[participantId]);

  const rows=useMemo(()=>monthSlice(data?.progressao_mensal,windowMonths),[data,windowMonths]);
  const summary=useMemo(()=>{
    const planned=rows.reduce((s,x)=>s+Number(x.volume_planejado_m||0),0);
    const executed=rows.reduce((s,x)=>s+Number(x.volume_executado_m||0),0);
    const sessions=rows.reduce((s,x)=>s+Number(x.sessoes||0),0);
    const completed=rows.reduce((s,x)=>s+Number(x.sessoes_concluidas||0),0);
    const readiness=rows.reduce((s,x)=>s+Number(x.prontidao_registros||0),0);
    return {planned,executed,sessions,completed,readiness};
  },[rows]);
  const tech=data?.indicador_tecnico||{};
  const athlete=data?.atleta||{};
  const roleCopy=role==="master"
    ?"Governança observa a evolução sem operar o atleta."
    :role==="professional"
      ?"Leitura técnica do histórico real para apoiar interpretação e decisão profissional."
      :"Seu histórico transforma rotina esportiva em contexto para acompanhar sua evolução.";

  if(loading)return <section className={embedded?"swim-evolution embedded":"swim-evolution"}><div className="swim-panel">Carregando evolução...</div></section>;
  if(error)return <section className={embedded?"swim-evolution embedded":"swim-evolution"}><div className="workflow-error">{error}</div></section>;

  return <section className={embedded?"swim-evolution embedded":"swim-evolution"}>
    <div className="swim-evolution-head">
      <div><span className="swim-panel-label">Histórico, contexto e performance</span><h2>Evolução do atleta</h2><p>{roleCopy}</p></div>
      <select className="swim-period-select" value={windowMonths} onChange={e=>setWindowMonths(Number(e.target.value))}>
        <option value={3}>Últimos 3 meses</option><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option>
      </select>
    </div>

    <div className="swim-evolution-athlete">
      <div><strong>{athlete.nome||"Atleta"}</strong><span>{[athlete.modalidade||"Natação",athlete.categoria,athlete.nivel].filter(Boolean).join(" · ")}</span></div>
      <span className="swim-pill">{athlete.status_federativo==="federado"?"Federado":athlete.status_federativo==="vinculado"?"Vinculado":"Contexto esportivo"}</span>
    </div>

    <div className="swim-evolution-kpis">
      <article><span>Volume executado</span><strong>{km(summary.executed)} km</strong><small>{summary.executed>0?`${km(summary.planned)} km planejados`:"Aguardando execução registrada"}</small></article>
      <article><span>Sessões</span><strong>{summary.sessions}</strong><small>{summary.completed} concluída(s) no período</small></article>
      <article><span>Evolução técnica</span><strong>{tech.estado==="comparavel"?(pct(tech.delta_percentual)||String(tech.valor_atual??"—")):"Em formação"}</strong><small>{tech.estado==="comparavel"?`${tech.nome} · ${tech.amostras||0} observações`:"Sem percentual ilustrativo; exige métrica comparável"}</small></article>
    </div>

    <div className="swim-evolution-chart-card">
      <div className="swim-panel-head"><div><span className="swim-panel-label">Carga externa observável</span><h3>Progressão de volume</h3></div><span className="swim-pill">{summary.readiness} prontidão(ões)</span></div>
      <VolumeChart rows={rows}/>
      <p className="swim-muted evolution-note">O gráfico exibe volume planejado e executado registrado no AGP. Ausência de execução não é preenchida por estimativa.</p>
    </div>

    <div className="swim-two">
      <article className="swim-panel">
        <span className="swim-panel-label">Evidência longitudinal</span><h3>Métricas disponíveis</h3>
        {(data?.series_longitudinais||[]).length?<div className="swim-list">{data.series_longitudinais.slice(0,8).map((s,i)=><div className="swim-row" key={s.metrica_id||i}><div><strong>{s.nome_canonico||s.metrica_codigo||"Métrica"}</strong><span>{s.amostras||0} observações · {s.estado_comparabilidade||"contextual"}</span></div>{s.delta_percentual!=null&&<span className="swim-pill">{pct(s.delta_percentual)}</span>}</div>)}</div>:<div className="swim-empty">Ainda não existem séries métricas comparáveis suficientes.</div>}
      </article>
      <article className="swim-panel">
        <span className="swim-panel-label">Continuidade</span><h3>Base que sustenta a leitura</h3>
        <div className="swim-list">
          <div className="swim-row"><div><strong>{summary.readiness} autorrelato(s)</strong><span>Prontidão diária no período selecionado</span></div></div>
          <div className="swim-row"><div><strong>{data?.resumo?.provas_total||0} participação(ões)</strong><span>Competições registradas no contexto atual</span></div></div>
          <div className="swim-row"><div><strong>{data?.resumo?.metricas_comparaveis||0} métrica(s) comparável(is)</strong><span>Somente evidência estruturalmente comparável entra como fato longitudinal</span></div></div>
        </div>
      </article>
    </div>
  </section>;
}
