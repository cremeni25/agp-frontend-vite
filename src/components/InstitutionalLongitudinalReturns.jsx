import {useEffect,useState} from "react";
import {supabase} from "../supabaseClient";

export default function InstitutionalLongitudinalReturns({institutionId}){
 const [rows,setRows]=useState([]);
 useEffect(()=>{let active=true;(async()=>{if(!institutionId)return;const p=await supabase.from("agp_projetos_validacao").select("id").eq("instituicao_id",institutionId);if(p.error||!active)return;const ids=(p.data||[]).map(x=>x.id);if(!ids.length)return;const r=await supabase.from("agp_respostas_intervencao").select("id,data_avaliacao,classificacao_resposta,conclusao,recomendacao_proximo_ciclo").in("projeto_id",ids).eq("visivel_instituicao",true).order("data_avaliacao",{ascending:false}).limit(12);if(active&&!r.error)setRows(r.data||[]);})();return()=>{active=false}},[institutionId]);
 if(!rows.length)return null;
 return <section className="dashboard-section"><h2>Retornos longitudinais liberados</h2><div className="alert-list">{rows.map(x=><article className="card" key={x.id}><strong>{x.classificacao_resposta||"Resposta acompanhada"}</strong><p>{x.conclusao||"Retorno registrado pela equipe."}</p><small>{x.recomendacao_proximo_ciclo||"Sem orientação adicional liberada."}</small></article>)}</div></section>;
}
