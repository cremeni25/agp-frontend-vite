import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-clube.css";

export default function DashboardClubeCanonical() {
  const { perfil } = useAuth();
  const [data, setData] = useState({ athletes: [], members: [], projects: [], institution: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const membership = await supabase
        .from("agp_membros_instituicao")
        .select("instituicao_id")
        .eq("auth_id", perfil?.auth_id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();

      if (membership.error || !membership.data) {
        throw membership.error || new Error("Vínculo institucional não encontrado.");
      }

      const institutionId = membership.data.instituicao_id;
      const [institutionResult, projectsResult, membersResult] = await Promise.all([
        supabase.from("agp_instituicoes").select("id,nome").eq("id", institutionId).maybeSingle(),
        supabase.from("agp_projetos_validacao").select("id").eq("instituicao_id", institutionId),
        supabase.from("agp_membros_instituicao").select("id").eq("instituicao_id", institutionId).eq("ativo", true)
      ]);

      const firstError = institutionResult.error || projectsResult.error || membersResult.error;
      if (firstError) throw firstError;

      const projectIds = (projectsResult.data || []).map((item) => item.id);
      let athletes = [];

      if (projectIds.length) {
        const athleteResult = await supabase
          .from("agp_participantes_projeto")
          .select("id,status_onboarding,tecnico_responsavel_pessoa_id")
          .in("projeto_id", projectIds)
          .eq("funcao_no_projeto", "atleta")
          .eq("ativo", true);

        if (athleteResult.error) throw athleteResult.error;
        athletes = athleteResult.data || [];
      }

      setData({
        institution: institutionResult.data,
        projects: projectsResult.data || [],
        members: membersResult.data || [],
        athletes
      });
    } catch (requestError) {
      setError("A visão institucional ainda não está disponível para este acesso.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [perfil?.auth_id]);

  const summary = useMemo(() => ({
    athletes: data.athletes.length,
    projects: data.projects.length,
    members: data.members.length,
    pending: data.athletes.filter((item) =>
      !item.tecnico_responsavel_pessoa_id ||
      !["ativo", "apto_para_coleta"].includes(String(item.status_onboarding || "").toLowerCase())
    ).length
  }), [data]);

  const nextAction = summary.members === 0
    ? ["Vincular equipe", "A instituição precisa de profissionais ativos antes da operação esportiva."]
    : summary.athletes === 0
      ? ["Incluir atletas", "A estrutura está pronta para receber os primeiros atletas."]
      : summary.pending > 0
        ? [`${summary.pending} atleta(s) com pendência`, "Resolva preparação ou vínculo técnico antes de avançar."]
        : ["Operação em ordem", "Acompanhe exceções; os indicadores permanecem como contexto gerencial."];

  if (loading) return <div className="dashboard-loading">Carregando situação atual...</div>;

  return (
    <main className="dashboard-clube">
      <div className="dashboard-overlay">
        <header className="dashboard-header">
          <div>
            <span>AGP · Instituição</span>
            <h1>{data.institution?.nome || "Instituição"}</h1>
            <p>Estrutura, equipe e atletas em uma única operação.</p>
          </div>
          <button onClick={load}>Atualizar</button>
        </header>

        {error && <div className="club-notice">{error}</div>}

        <section className="club-now-card">
          <span>Agora</span>
          <h2>{nextAction[0]}</h2>
          <p>{nextAction[1]}</p>
        </section>

        <details className="dashboard-section">
          <summary>Ver panorama</summary>
          <div className="dashboard-section grid">
            <div className="card"><h3>Atletas</h3><p>{summary.athletes}</p></div>
            <div className="card"><h3>Projetos</h3><p>{summary.projects}</p></div>
            <div className="card"><h3>Equipe</h3><p>{summary.members}</p></div>
            <div className="card"><h3>Pendências</h3><p>{summary.pending}</p></div>
          </div>
        </details>
      </div>
    </main>
  );
}
