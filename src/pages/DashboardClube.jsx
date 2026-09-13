import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-clube.css";

export default function DashboardClube() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function carregarResumo() {
    setLoading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data, error: requestError } = await supabase
      .from("resumo_clube")
      .select("*")
      .single();

    if (requestError) setError("A visão institucional ainda não está disponível para este acesso.");
    else setResumo(data);

    setLoading(false);
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  const nextAction = useMemo(() => {
    const alerts = Number(resumo?.alertas || 0);
    if (alerts > 0) {
      return {
        title: `${alerts} alerta${alerts > 1 ? "s" : ""} exige${alerts > 1 ? "m" : ""} atenção`,
        description: "Priorize os casos sinalizados pela equipe antes de analisar indicadores gerais."
      };
    }
    return {
      title: "Nenhuma atenção institucional imediata",
      description: "Acompanhe a base e intervenha somente quando houver evidência ou pendência real."
    };
  }, [resumo]);

  if (loading) return <div className="dashboard-loading">Carregando sua próxima ação...</div>;

  return (
    <main className="dashboard-clube">
      <div className="dashboard-overlay">
        <header className="dashboard-header">
          <div>
            <span>AGP · Instituição</span>
            <h1>O que precisa da sua atenção agora</h1>
            <p>A visão institucional começa pela exceção e pela decisão necessária, não por uma coleção de indicadores.</p>
          </div>
          <button onClick={carregarResumo}>Atualizar</button>
        </header>

        {error && <div className="club-notice">{error}</div>}

        <section className="club-now-card">
          <span>Agora</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.description}</p>
        </section>

        <section className="dashboard-section grid">
          <div className="card"><h3>Atletas</h3><p>{resumo?.total_atletas ?? "—"}</p></div>
          <div className="card"><h3>Modalidades</h3><p>{resumo?.modalidades ?? "—"}</p></div>
          <div className="card"><h3>Alertas ativos</h3><p>{resumo?.alertas ?? "—"}</p></div>
          <div className="card"><h3>Comissão técnica</h3><p>{resumo?.tecnicos ?? "—"}</p></div>
        </section>
      </div>
    </main>
  );
}
