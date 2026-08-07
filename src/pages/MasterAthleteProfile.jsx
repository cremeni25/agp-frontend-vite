import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectEligibility, formatEligibilityPending } from "../services/eligibilityManagement";
import { listProjectConsents } from "../services/consentManagement";
import { listProjectBaselines } from "../services/baselineManagement";
import "../styles/dashboard-master.css";

export default function MasterAthleteProfile() {
  const navigate = useNavigate();
  const { participantId } = useParams();
  const [record, setRecord] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [consent, setConsent] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const participantResult = await supabase
        .from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,status_onboarding,ativo,tecnico_responsavel_pessoa_id,funcao_no_projeto")
        .eq("id", participantId)
        .single();
      if (participantResult.error) throw participantResult.error;
      const participant = participantResult.data;
      if (participant.funcao_no_projeto !== "atleta") throw new Error("O participante selecionado não é um atleta.");

      await listProjectEligibility(participant.projeto_id);

      const [personResult, projectResult, profileResult, consentRows, baselineRows, eligibilityRows] = await Promise.all([
        supabase.from("agp_pessoas").select("id,nome,email_contato,telefone_contato,data_nascimento,status").eq("id", participant.pessoa_id).single(),
        supabase.from("agp_projetos_validacao").select("id,nome,instituicao_id,status").eq("id", participant.projeto_id).single(),
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,prova_posicao,categoria,nivel,status").eq("pessoa_id", participant.pessoa_id).eq("status", "ativo").maybeSingle(),
        listProjectConsents(participant.projeto_id),
        listProjectBaselines(participant.projeto_id),
        listProjectEligibility(participant.projeto_id)
      ]);
      const firstError = personResult.error || projectResult.error || profileResult.error;
      if (firstError) throw firstError;

      const institutionResult = await supabase.from("agp_instituicoes").select("id,nome,status").eq("id", projectResult.data.instituicao_id).single();
      if (institutionResult.error) throw institutionResult.error;

      let technician = null;
      if (participant.tecnico_responsavel_pessoa_id) {
        const technicianResult = await supabase.from("agp_pessoas").select("id,nome,email_contato").eq("id", participant.tecnico_responsavel_pessoa_id).maybeSingle();
        if (!technicianResult.error) technician = technicianResult.data;
      }

      setRecord({ participant, person: personResult.data, project: projectResult.data, institution: institutionResult.data, profile: profileResult.data || {}, technician });
      setConsent((consentRows || []).find((item) => String(item.participante_id) === String(participantId) && item.vigente) || null);
      setBaseline((baselineRows || []).find((item) => String(item.participante_id) === String(participantId) && item.vigente) || null);
      setEligibility((eligibilityRows || []).find((item) => String(item.participante_id) === String(participantId)) || null);
    } catch (requestError) {
      setError(`Falha ao carregar a ficha do atleta: ${requestError.message}`);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [participantId]);

  const contextQuery = useMemo(() => {
    if (!record) return "";
    return new URLSearchParams({
      instituicao: record.institution.id,
      projeto: record.project.id,
      participante: record.participant.id
    }).toString();
  }, [record]);

  const pending = formatEligibilityPending(eligibility?.pendencias || []);
  const eligibilityLabel = eligibility?.apto_analise ? "Apto para análise" : eligibility?.apto_coleta ? "Apto somente para coleta" : "Bloqueado";
  const openService = (service) => navigate(`/master/participantes/operacao?${contextQuery}&servico=${service}`);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header">
      <div><span className="master-eyebrow">Ficha individual</span><h1>{record?.person?.nome || "Atleta"}</h1><p>Identificação, contexto esportivo e operações deste atleta.</p></div>
      <div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/master/atletas")}>Voltar para atletas</button><button className="master-button secondary" onClick={() => navigate("/master/participantes")}>Central de Participantes</button><button className="master-button" onClick={load}>Atualizar</button></div>
    </header>

    {error && <div className="master-error" role="alert">{error}</div>}
    {loading ? <div className="master-empty">Carregando ficha do atleta...</div> : record && <>
      <section className="master-content-grid">
        <article className="master-panel"><span className="master-eyebrow">Identificação</span><h2>{record.person.nome}</h2><p>{record.person.email_contato || "E-mail não informado"}</p><p>{record.person.telefone_contato || "Telefone não informado"}</p><p>{record.person.data_nascimento ? new Date(record.person.data_nascimento).toLocaleDateString("pt-BR") : "Data de nascimento não informada"}</p></article>
        <article className="master-panel"><span className="master-eyebrow">Vínculo institucional</span><h2>{record.institution.nome}</h2><p>{record.project.nome}</p><p>{record.participant.ativo ? "Vínculo ativo" : "Vínculo inativo"}</p><p>Onboarding: {record.participant.status_onboarding || "não informado"}</p></article>
        <article className="master-panel"><span className="master-eyebrow">Perfil esportivo</span><h2>{record.profile.modalidade || "Modalidade não informada"}</h2><p>{record.profile.prova_posicao || "Prova/posição não informada"}</p><p>{record.profile.categoria || "Categoria não informada"}</p><p>{record.profile.nivel || "Nível não informado"}</p></article>
      </section>

      <section className="master-panel">
        <div className="master-section-heading"><div><span className="master-eyebrow">Operações deste atleta</span><h2>Consultar ou alterar</h2></div></div>
        <div className="master-action-grid">
          <button className="master-action-card" onClick={() => openService("tecnico")}><strong>Técnico responsável</strong><span>Atual: {record.technician?.nome || "não definido"}. Consultar vínculo, alterar técnico e ver histórico.</span></button>
          <button className="master-action-card" onClick={() => openService("consentimento")}><strong>Consentimentos</strong><span>Status: {consent ? "vigente" : "pendente"}. Consultar, conceder ou revogar consentimento.</span></button>
          <button className="master-action-card" onClick={() => openService("linha-base")}><strong>Linha de base</strong><span>Status: {baseline ? "registrada" : "pendente"}. Consultar ou atualizar os parâmetros iniciais.</span></button>
          <button className="master-action-card" onClick={() => openService("elegibilidade")}><strong>Elegibilidade</strong><span>Status: {eligibilityLabel}. Consultar bloqueios, coleta e análise.</span></button>
        </div>
        {pending.length > 0 && <div className="master-feedback error" style={{ marginTop: 16 }}>Pendências atuais: {pending.join(" · ")}</div>}
      </section>
    </>}
  </div></main>;
}
