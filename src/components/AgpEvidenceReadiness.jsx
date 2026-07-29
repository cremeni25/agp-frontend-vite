import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const EMPTY = {
  coreAvailable: false,
  protocols: 0,
  instruments: 0,
  sources: 0,
  baselines: 0,
  collections: 0,
  validatedCollections: 0,
  plans: 0,
  sessions: 0,
  documents: 0,
  results: 0,
  adherence: []
};

export default function AgpEvidenceReadiness({ projectId, athleteLinks = [], profileById = {} }) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!projectId) return;
      setLoading(true);
      setError("");

      const queries = await Promise.all([
        supabase.from("agp_protocolos").select("id", { count: "exact", head: true }),
        supabase.from("agp_instrumentos").select("id", { count: "exact", head: true }),
        supabase.from("agp_fontes_cientificas").select("id", { count: "exact", head: true }).eq("status_validacao", "validada"),
        supabase.from("agp_linhas_base_atleta").select("id", { count: "exact", head: true }).eq("projeto_id", projectId),
        supabase.from("agp_coletas").select("id", { count: "exact", head: true }).eq("projeto_id", projectId),
        supabase.from("agp_coletas").select("id", { count: "exact", head: true }).eq("projeto_id", projectId).in("status", ["completa", "validada"]),
        supabase.from("agp_planos_tecnicos").select("id", { count: "exact", head: true }).eq("projeto_id", projectId),
        supabase.from("agp_sessoes_treinamento").select("id", { count: "exact", head: true }),
        supabase.from("agp_documentos_profissionais").select("id", { count: "exact", head: true }).eq("projeto_id", projectId),
        supabase.from("agp_resultados_analiticos").select("id", { count: "exact", head: true }).eq("projeto_id", projectId).eq("status", "validado"),
        supabase.from("agp_adesao_questionario_diario").select("*").eq("projeto_id", projectId)
      ]);

      const firstError = queries.find((item) => item.error)?.error;
      if (firstError) {
        setError("O núcleo longitudinal ainda não foi aplicado ao banco AGP ou não está acessível.");
        setState(EMPTY);
      } else {
        setState({
          coreAvailable: true,
          protocols: queries[0].count || 0,
          instruments: queries[1].count || 0,
          sources: queries[2].count || 0,
          baselines: queries[3].count || 0,
          collections: queries[4].count || 0,
          validatedCollections: queries[5].count || 0,
          plans: queries[6].count || 0,
          sessions: queries[7].count || 0,
          documents: queries[8].count || 0,
          results: queries[9].count || 0,
          adherence: queries[10].data || []
        });
      }
      setLoading(false);
    }

    load();
  }, [projectId]);

  const readiness = useMemo(() => {
    const checks = [
      { label: "Atleta vinculado", ready: athleteLinks.length > 0, detail: `${athleteLinks.length} participante(s)` },
      { label: "Linha de base individual", ready: state.baselines >= athleteLinks.length && athleteLinks.length > 0, detail: `${state.baselines} registrada(s)` },
      { label: "Protocolo e instrumento", ready: state.protocols > 0 && state.instruments > 0, detail: `${state.protocols} protocolo(s) · ${state.instruments} instrumento(s)` },
      { label: "Fontes científicas validadas", ready: state.sources > 0, detail: `${state.sources} fonte(s)` },
      { label: "Coletas completas ou validadas", ready: state.validatedCollections > 0, detail: `${state.validatedCollections} de ${state.collections}` },
      { label: "Plano técnico versionado", ready: state.plans > 0, detail: `${state.plans} plano(s)` },
      { label: "Avaliações profissionais", ready: state.documents > 0, detail: `${state.documents} documento(s)` },
      { label: "Resultado analítico validado", ready: state.results > 0, detail: `${state.results} resultado(s)` }
    ];
    return { checks, completed: checks.filter((item) => item.ready).length };
  }, [athleteLinks.length, state]);

  return (
    <section className="master-panel">
      <div className="master-section-heading">
        <div>
          <span className="master-eyebrow">Núcleo longitudinal real</span>
          <h2>Prontidão para análise</h2>
          <p>Nenhum score ou recomendação é liberado sem dados rastreáveis, protocolo, fonte e validação.</p>
        </div>
        <strong>{loading ? "..." : `${readiness.completed}/${readiness.checks.length}`}</strong>
      </div>

      {error && <div className="master-error" role="alert">{error}</div>}

      {!error && (
        <>
          <ol className="master-activity-list">
            {readiness.checks.map((item) => (
              <li key={item.label}>
                <div><strong>{item.label}</strong><span>{item.detail}</span></div>
                <b>{item.ready ? "Pronto" : "Pendente"}</b>
              </li>
            ))}
          </ol>

          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Adesão diária</span>
              <h2>Questionário de prontidão</h2>
            </div>
            <strong>{state.adherence.length}</strong>
          </div>

          {state.adherence.length === 0 ? (
            <div className="master-empty">Sem respostas reais. O sistema permanece em dados insuficientes.</div>
          ) : (
            <ul className="master-activity-list">
              {state.adherence.map((item) => {
                const athlete = profileById[item.atleta_id];
                return (
                  <li key={item.atleta_id}>
                    <div>
                      <strong>{athlete?.nome || item.atleta_id}</strong>
                      <span>{item.respostas_7d} resposta(s) nos últimos 7 dias · última: {item.ultima_resposta ? new Date(item.ultima_resposta).toLocaleString("pt-BR") : "sem resposta"}</span>
                    </div>
                    <b>{item.adesao_7d_percentual}%</b>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
