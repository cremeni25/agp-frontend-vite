import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-comissao.css";

function formatDate(value) {
  if (!value) return "Sem resposta";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function adherenceStatus(percentual, ultimaResposta) {
  if (!ultimaResposta) return { label: "Sem respostas", className: "critical" };
  const hours = (Date.now() - new Date(ultimaResposta).getTime()) / 3600000;
  if (hours > 48 || Number(percentual) < 50) return { label: "Atenção", className: "critical" };
  if (hours > 24 || Number(percentual) < 80) return { label: "Acompanhar", className: "warning" };
  return { label: "Regular", className: "ok" };
}

export default function DashboardComissao() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [history, setHistory] = useState([]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      window.location.href = "/";
      return;
    }

    const { data: links, error: linksError } = await supabase
      .from("agp_atletas_projeto")
      .select("id, projeto_id, atleta_id, status, tecnico_responsavel_auth_id")
      .eq("status", "ativo");

    if (linksError) {
      setError(`Falha ao carregar atletas vinculados: ${linksError.message}`);
      setLoading(false);
      return;
    }

    const athleteIds = [...new Set((links || []).map((item) => item.atleta_id))];
    if (athleteIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const [profilesResult, adherenceResult] = await Promise.all([
      supabase.from("perfis_atletas").select("id, nome, categoria, nivel, status").in("id", athleteIds),
      supabase.from("agp_adesao_questionario_diario").select("projeto_id, atleta_id, respostas_7d, adesao_7d_percentual, ultima_resposta").in("atleta_id", athleteIds)
    ]);

    if (profilesResult.error || adherenceResult.error) {
      const failure = profilesResult.error || adherenceResult.error;
      setError(`Falha ao carregar prontidão: ${failure.message}`);
      setLoading(false);
      return;
    }

    const profileMap = Object.fromEntries((profilesResult.data || []).map((item) => [item.id, item]));
    const adherenceMap = Object.fromEntries(
      (adherenceResult.data || []).map((item) => [`${item.projeto_id}:${item.atleta_id}`, item])
    );

    const normalized = (links || []).map((link) => {
      const adherence = adherenceMap[`${link.projeto_id}:${link.atleta_id}`] || {};
      return {
        ...link,
        athlete: profileMap[link.atleta_id],
        respostas7d: Number(adherence.respostas_7d || 0),
        adesao7d: Number(adherence.adesao_7d_percentual || 0),
        ultimaResposta: adherence.ultima_resposta || null
      };
    });

    setRows(normalized);
    setLoading(false);
  }

  async function openAthlete(row) {
    setSelectedAthlete(row);
    setHistory([]);
    const { data, error: historyError } = await supabase
      .from("agp_coletas")
      .select("id, data_hora_coleta, status, completude, confiabilidade, dados")
      .eq("atleta_id", row.atleta_id)
      .eq("projeto_id", row.projeto_id)
      .order("data_hora_coleta", { ascending: false })
      .limit(14);

    if (historyError) setError(`Falha ao carregar histórico: ${historyError.message}`);
    else setHistory(data || []);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const total = rows.length;
    const regular = rows.filter((row) => adherenceStatus(row.adesao7d, row.ultimaResposta).className === "ok").length;
    const attention = rows.filter((row) => adherenceStatus(row.adesao7d, row.ultimaResposta).className === "critical").length;
    return { total, regular, attention };
  }, [rows]);

  if (loading) return <div className="dashboard-loading">Carregando acompanhamento técnico...</div>;

  return (
    <main className="dashboard-comissao">
      <div className="dashboard-overlay">
        <header className="dashboard-header">
          <div>
            <span>MONITORAMENTO BASEADO EM EVIDÊNCIAS</span>
            <h1>Prontidão diária da equipe</h1>
            <p>Adesão e histórico real. Sem score automático ou diagnóstico clínico.</p>
          </div>
          <button onClick={loadDashboard}>Atualizar dados</button>
        </header>

        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="dashboard-section">
          <div className="athlete-grid">
            <article className="athlete-card"><h3>{summary.total}</h3><p>Atletas vinculados</p></article>
            <article className="athlete-card ok"><h3>{summary.regular}</h3><p>Adesão regular</p></article>
            <article className="athlete-card critical"><h3>{summary.attention}</h3><p>Exigem acompanhamento</p></article>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Acompanhamento por atleta</h2>
          {rows.length === 0 ? (
            <div className="dashboard-loading">Nenhum atleta ativo está vinculado ao ambiente deste profissional.</div>
          ) : (
            <div className="athlete-grid">
              {rows.map((row) => {
                const status = adherenceStatus(row.adesao7d, row.ultimaResposta);
                return (
                  <article key={row.id} className={`athlete-card ${status.className}`}>
                    <h3>{row.athlete?.nome || "Atleta"}</h3>
                    <p>{row.athlete?.categoria || row.athlete?.nivel || "Categoria não informada"}</p>
                    <strong>{row.adesao7d.toFixed(1)}% de adesão em 7 dias</strong>
                    <span>{row.respostas7d} resposta(s) válida(s)</span>
                    <span>Última resposta: {formatDate(row.ultimaResposta)}</span>
                    <span className="status">{status.label}</span>
                    <button onClick={() => openAthlete(row)}>Ver evidências</button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedAthlete && (
          <section className="dashboard-section">
            <h2>Histórico — {selectedAthlete.athlete?.nome}</h2>
            {history.length === 0 ? (
              <p>Sem coletas reais disponíveis. Estado analítico: dados insuficientes.</p>
            ) : (
              <div className="alert-list">
                {history.map((item) => (
                  <article key={item.id} className="athlete-card">
                    <strong>{formatDate(item.data_hora_coleta)}</strong>
                    <span>Status: {item.status}</span>
                    <span>Completude: {Number(item.completude || 0).toFixed(1)}%</span>
                    <span>Confiabilidade: {item.confiabilidade == null ? "Aguardando validação" : `${Number(item.confiabilidade).toFixed(1)}%`}</span>
                    <details>
                      <summary>Dados declarados</summary>
                      <pre>{JSON.stringify(item.dados, null, 2)}</pre>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
