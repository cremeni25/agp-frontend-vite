import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { inviteParticipantAccess } from "../services/participantOnboarding";
import "../styles/dashboard-master.css";

export default function MasterTechnicalAccess(){
  const navigate=useNavigate();
  const [participant,setParticipant]=useState(null);
  const [account,setAccount]=useState(null);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function load(){
    setLoading(true); setError("");
    try{
      const projectResult=await supabase.from("agp_projetos_validacao").select("id,nome").eq("status","homologacao").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(projectResult.error) throw projectResult.error;
      if(!projectResult.data){setParticipant(null);setAccount(null);return;}
      const participantResult=await supabase.from("agp_participantes_projeto").select("id,pessoa_id,funcao_no_projeto,status_onboarding,ativo").eq("projeto_id",projectResult.data.id).neq("funcao_no_projeto","atleta").eq("ativo",true).order("created_at",{ascending:true}).limit(1).maybeSingle();
      if(participantResult.error) throw participantResult.error;
      setParticipant(participantResult.data||null);
      if(!participantResult.data){setAccount(null);return;}
      const accountResult=await supabase.from("agp_contas_acesso").select("id,email_acesso,status,auth_id,pessoa_id").eq("pessoa_id",participantResult.data.pessoa_id).limit(1).maybeSingle();
      if(accountResult.error) throw accountResult.error;
      setAccount(accountResult.data||null);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  async function invite(){
    if(!participant?.id) return;
    setWorking(true); setError(""); setMessage("");
    try{
      const result=await inviteParticipantAccess(participant.id);
      setMessage(result?.status==="acesso_ja_vinculado"?"O acesso técnico já estava vinculado.":"Convite de acesso enviado. O técnico deve abrir o e-mail, definir a senha e entrar no AGP.");
      await load();
    }catch(e){setError(e.message)}finally{setWorking(false)}
  }

  const linked=Boolean(account?.auth_id);
  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Homologação Master · etapa 3/12</span><h1>Ativar acesso do técnico</h1><p>O cadastro só é considerado homologado quando o responsável consegue autenticar e exercer sua função.</p></div><button className="master-button secondary" onClick={()=>navigate("/master/homologacao")}>Voltar</button></header>
    {message&&<div className="master-success">{message}</div>}{error&&<div className="master-error">{error}</div>}
    {loading?<div className="master-empty">Verificando acesso...</div>:<section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Responsável</span><h2>RODRIGO ÁVILA</h2></div><strong>{linked?"CONVITE VINCULADO":"ACESSO PENDENTE"}</strong></div><p>E-mail de acesso: <strong>{account?.email_acesso||"não cadastrado"}</strong></p><p>Projeto: <strong>Natação Competitiva</strong></p><p>Função: <strong>{participant?.funcao_no_projeto||"técnico"}</strong></p><div className="master-header-actions" style={{marginTop:16}}><button className="master-button" disabled={working||linked||!participant?.id} onClick={invite}>{working?"Enviando...":linked?"Convite já enviado":"Enviar convite de acesso"}</button>{linked&&<button className="master-button secondary" onClick={()=>navigate("/master/homologacao")}>Voltar à homologação</button>}</div></section>}
  </div></main>;
}
