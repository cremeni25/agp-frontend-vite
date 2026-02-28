// src/pages/DashboardComissao.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-comissao.css";

export default function DashboardComissao() {
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarAtletas() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      // ⚠️ Exemplo simples — depois refinamos filtros
      const { data, error } = await supabase
        .from("perfis_atletas")
        .select("id, nome, categoria, status");

      if (!error) {
        setAtletas(data);
      }

      setLoading(false);
    }

    carregarAtletas();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Carregando comissão técnica...
      </div>
    );
  }

  return (
    <div className="dashboard-comissao">
      <div className="dashboard-overlay">

        <header className="dashboard-header">
          <h1>Dashboard Comissão Técnica</h1>
          <span>Visão geral dos atletas</span>
        </header>

        <section className="dashboard-section">
          <h2>Atletas</h2>

          <div className="athlete-grid">
            {atletas.map(atleta => (
              <div key={atleta.id} className={`athlete-card ${atleta.status || "ok"}`}>
                <h3>{atleta.nome}</h3>
                <p>{atleta.categoria}</p>
                <span className="status">{atleta.status || "OK"}</span>
                <button>Ver atleta</button>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Alertas</h2>
          <ul className="alert-list">
            <li>⚠️ Atletas com carga elevada</li>
            <li>⏱️ Diários não preenchidos</li>
            <li>🚑 Possível risco de lesão</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
