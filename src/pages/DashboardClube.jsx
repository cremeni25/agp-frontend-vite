// src/pages/DashboardClube.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-clube.css";

export default function DashboardClube() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarResumo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }

      // Exemplo de agregação simples (evolui depois)
      const { data, error } = await supabase
        .from("resumo_clube")
        .select("*")
        .single();

      if (!error) setResumo(data);
      setLoading(false);
    }

    carregarResumo();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Carregando clube...</div>;
  }

  return (
    <div className="dashboard-clube">
      <div className="dashboard-overlay">

        <header className="dashboard-header">
          <h1>Dashboard do Clube</h1>
          <span>Visão institucional</span>
        </header>

        <section className="dashboard-section grid">
          <div className="card">
            <h3>Atletas</h3>
            <p>{resumo?.total_atletas ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Modalidades</h3>
            <p>{resumo?.modalidades ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Alertas ativos</h3>
            <p>{resumo?.alertas ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Comissão técnica</h3>
            <p>{resumo?.tecnicos ?? "-"}</p>
          </div>
        </section>

      </div>
    </div>
  );
}
