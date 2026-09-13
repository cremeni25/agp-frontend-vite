import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const SLUG = "agp-homologacao-master";
const STEPS = ["Master e governança","Instituição","Técnico e profissionais","Atleta","Coleta de evidência","Validação profissional","Histórico longitudinal","Cruzamento analítico","Intervenção","Resposta à intervenção","Retorno ao histórico","Homologação integral"];

export default function MasterHomologationFlow() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    const { data, error: queryError } = await supabase.from("agp_instituicoes").select("id").eq("slug", SLUG).maybeSingle();
    if (queryError) setError(queryError.message);
    setReady(Boolean(data));
  }

  useEffect(() => { check(); }, []);

  async function prepare() {
    setWorking(true); setError("");
    try {
      const { data: institution, error: institutionError } = await supabase.from("agp_instituicoes").upsert({ nome: "AGP Homologação Controlada", slug: SLUG, tipo: "homologacao", localidade: "Ambiente interno", status: "ativo" }, { onConflict: "slug" }).select("id").single();
      if (institutionError) throw institutionError;
      const { data: project } = await supabase.from("agp_projetos_validacao").select("id").eq("instituicao_id", institution.id).maybeSingle();
      if (!project) {
        const { error: projectError } = await supabase.from("agp_projetos_validacao").insert({ instituicao_id: institution.id, nome: "Homologação integral multiusuário", objetivo: "Validar o ciclo completo antes do piloto real de 30 dias.", localidade: "Ambiente interno", status: "homologacao", versao_motor: "agp-core-v2" });
        if (projectError) throw projectError;
      }
      setReady(true);
    } catch (requestError) { setError(requestError.message); }
    finally { setWorking(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Homologação controlada</span><h1>Validar o AGP inteiro antes do piloto real</h1><p>Dados sintéticos identificáveis validam fluxo e UX. Resultados científicos não serão simulados como evidência real.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button><button className="master-button" disabled={working} onClick={ready ? () => navigate(`/master/homologacao/${SLUG}`) : prepare}>{working ? "Preparando..." : ready ? "Abrir homologação" : "Preparar homologação"}</button></div></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Ciclo obrigatório</span><h2>Jornadas que precisam fechar</h2></div><strong>{STEPS.length}</strong></div><ol className="master-activity-list">{STEPS.map((step,index)=><li key={step}><div><strong>{String(index+1).padStart(2,"0")}</strong><span>{step}</span></div><b>Homologar</b></li>)}</ol></section>
    <section className="master-panel"><span className="master-eyebrow">Depois</span><h2>Piloto real de 30 dias</h2><p>Somente após homologação integral e limpeza controlada dos registros sintéticos, preservando estruturas, protocolos, instrumentos, permissões e configurações válidas.</p></section>
  </div></main>;
}
