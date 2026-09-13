import {useEffect,useState} from "react";
import {supabase} from "../supabaseClient";

export default function InstitutionalAuthorizedReturns(){
 const [rows,setRows]=useState([]);
 useEffect(()=>{let active=true;(async()=>{const r=await supabase.from("agp_retornos_institucionais_visiveis").select("*").order("data_avaliacao",{ascending:false}).limit(12);if(active&&!r.error)setRows(r.data||[]);})();return()=>{active=false}},[]);
 if(!rows.length)return null;
 return <section className="dashboard-section"><h2>Retornos longitudinais liberados</h2><div className="alert-list">{rows.map(x=><article className="card" key={x.id}><strong>{x.classificacao_resposta||"Resposta acompanhada"}</strong><p>{x.conclusao||"Retorno registrado pela equipe."}</p><small>{x.recomendacao_proximo_ciclo||"Sem orientação adicional liberada."}</small></article>)}</div></section>;
}
