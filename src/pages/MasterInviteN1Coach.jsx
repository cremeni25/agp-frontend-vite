import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";
import { createInstitutionParticipant, inviteParticipantAccess } from "../services/participantOnboarding";

const EMPTY={nome:"",email:""};

export default function MasterInviteN1Coach(){
  const navigate=useNavigate();
  const [institution,setInstitution]=useState(null);
  const [project,setProject]=useState(null);
  const [professionals,setProfessionals]=useState([]);
  const [accounts,setAccounts]=useState([]);
  const [form,setForm]=useState(EMPTY);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const i=await supabase.from("agp_instituicoes")
        .select("id,nome,nome_exibicao,slug,status")
        .eq("status","ativo")
        .or("slug.eq.n1-academia,nome.ilike.%N1%")
        .limit(1).maybeSingle();
      if(i.error)throw i.error;
      setInstitution(i.data||null);
      if(!i.data){setProject(null);setProfessionals([]);setAccounts([]);return;}

      const p=await supabase.from("agp_projetos_validacao")
        .select("id,instituicao_id,nome,status")
        .eq("instituicao_id",i.data.id)
        .order("created_at",{ascending:false});
      if(p.error)throw p.error;
      const selected=(p.data||[]).find(x=>String(x.status||"").toLowerCase()==="homologacao")||(p.data||[])[0]||null;
      setProject(selected);
      if(!selected){setProfessionals([]);setAccounts([]);return;}

      const pr=await supabase.from("agp_participantes_projeto")
        .select("id,pessoa_id,funcao_no_projeto,status_onboarding,ativo")
        .eq("projeto_id",selected.id)
        .neq("funcao_no_projeto","atleta")
        .eq("ativo",true);
      if(pr.error)throw pr.error;

      const rows=pr.data||[];
      const ids=[...new Set(rows.map(x=>x.pessoa_id).filter(Boolean))];
      let people=[],accountRows=[];
      if(ids.length){
        const [pe,ac]=await Promise.all([
          supabase.from("agp_pessoas").select("id,nome,email_contato").in("id",ids),
          supabase.from("agp_contas_acesso").select("id,pessoa_id,email_acesso,status,auth_id").in("pessoa_id",ids)
        ]);
        if(pe.error||ac.error)throw pe.error||ac.error;
        people=pe.data||[];accountRows=ac.data||[];
      }
      const peopleMap=Object.fromEntries(people.map(x=>[x.id,x]));
      setProfessionals(rows.map(x=>({...x,pessoa:peopleMap[x.pessoa_id]||{}})));
      setAccounts(accountRows);
    }catch(e){
      setError(e.message||"Não foi possível preparar o convite da N1.");
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  const accountByPerson=useMemo(()=>Object.fromEntries(accounts.map(x=>[x.pessoa_id,x])),[accounts]);

  async function createAndInvite(e){
    e.preventDefault();
    if(!institution?.id||!project?.id)return setError("A N1 ou o projeto de homologação ainda não está disponível.");
    setWorking(true);setError("");setMessage("");
    try{
      const created=await createInstitutionParticipant(institution.id,{
        nome:form.nome.trim(),
        email_contato:form.email.trim(),
        papel:"tecnico",
        projeto_id:project.id,
        tecnico_responsavel_pessoa_id:null,
        escopo:{origem:"homologacao_n1",sport_profile:"AGP-SWIMMING-POOL"},
        acesso:{email_acesso:form.email.trim()},
        perfil_esportivo:null
      });
      if(!created?.participante_id)throw new Error("O vínculo técnico foi criado sem participante de projeto.");
      await inviteParticipantAccess(created.participante_id);
      setMessage(`Convite enviado para ${form.email.trim()}. O técnico receberá o link e, ao aceitar, entrará diretamente no ambiente profissional da N1.`);
      setForm(EMPTY);
      await load();
    }catch(e){
      setError(e.message||"Não foi possível gerar o convite.");
      await load();
    }finally{setWorking(false)}
  }

  async function resend(participantId,email){
    setWorking(true);setError("");setMessage("");
    try{
      const result=await inviteParticipantAccess(participantId);
      setMessage(result?.status==="acesso_ja_vinculado"
        ? `${email||"O técnico"} já possui acesso vinculado ao AGP.`
        : `Convite enviado para ${email||"o técnico"}.`);
      await load();
    }catch(e){setError(e.message||"Não foi possível enviar o convite.")}
    finally{setWorking(false)}
  }

  return <SwimmingShell
    eyebrow="Homologação N1 · Acesso"
    title="Convidar técnico para o AGP"
    subtitle="Informe apenas os dados do técnico. O AGP cria a identidade, vincula à N1 e ao projeto de Natação e envia o acesso por e-mail."
    actions={[{label:"Voltar à governança",onClick:()=>navigate("/dashboard-master")},{label:"Atualizar",onClick:load}]}
  >
    {error&&<div className="workflow-error">{error}</div>}
    {message&&<div className="workflow-success">{message}</div>}

    <section className="swim-grid">
      <article className="swim-card"><span>Instituição</span><strong>{loading?"…":institution?.nome_exibicao||institution?.nome||"N1 não localizada"}</strong><p>O convite só é associado à instituição real.</p></article>
      <article className="swim-card"><span>Projeto</span><strong>{loading?"…":project?.nome||"Projeto não localizado"}</strong><p>{project?.status||"—"} · Natação</p></article>
      <article className="swim-card"><span>Profissionais vinculados</span><strong className="swim-kpi">{loading?"…":professionals.length}</strong><p>Inclui convites pendentes e acessos já ativados.</p></article>
    </section>

    <form className="swim-panel" onSubmit={createAndInvite}>
      <span className="swim-panel-label">Primeiro técnico</span>
      <h2>Gerar convite</h2>
      <p className="swim-muted">O técnico não escolhe o próprio papel. O vínculo com a N1 é criado antes do envio do convite e será reconhecido automaticamente no primeiro login.</p>
      <div className="workflow-grid">
        <label className="workflow-field">Nome completo<input required minLength="2" value={form.nome} onChange={e=>setForm(x=>({...x,nome:e.target.value}))} placeholder="Nome do técnico" /></label>
        <label className="workflow-field">E-mail<input required type="email" value={form.email} onChange={e=>setForm(x=>({...x,email:e.target.value}))} placeholder="tecnico@exemplo.com" /></label>
      </div>
      <div className="workflow-actions"><button className="swim-primary" disabled={working||!institution||!project}>{working?"Gerando convite...":"Criar vínculo e enviar convite"}</button></div>
    </form>

    <section className="swim-panel">
      <span className="swim-panel-label">Controle de acesso</span>
      <h2>Técnicos/profissionais deste projeto</h2>
      {professionals.length?<div className="swim-list">{professionals.map(p=>{
        const a=accountByPerson[p.pessoa_id]||{};
        const active=Boolean(a.auth_id);
        return <div className="swim-row" key={p.id}>
          <div><strong>{p.pessoa?.nome||"Profissional"}</strong><span>{p.pessoa?.email_contato||a.email_acesso||"E-mail não informado"} · {p.funcao_no_projeto}</span></div>
          <div className="workflow-actions"><span className="swim-pill">{active?"Acesso vinculado":"Convite pendente"}</span>{!active&&<button type="button" className="swim-secondary" disabled={working} onClick={()=>resend(p.id,a.email_acesso||p.pessoa?.email_contato)}>Enviar convite</button>}</div>
        </div>
      })}</div>:<div className="swim-empty">Nenhum técnico/profissional vinculado ainda.</div>}
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">O que acontecerá</span>
      <h2>Depois do envio</h2>
      <div className="journey-linear">
        <span>1. AGP envia e-mail</span><span>2. Técnico abre o link</span><span>3. Define/ativa a senha</span><span>4. Login reconhece a identidade</span><span>5. AGP abre o ambiente profissional</span><span>6. Técnico inicia os atletas do piloto</span>
      </div>
    </section>
  </SwimmingShell>;
}
