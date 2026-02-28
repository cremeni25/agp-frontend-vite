// src/pages/DashboardMaster.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

export default function DashboardMaster() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarResumo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }

      // visão agregada global (placeholder seguro)
      const { data, error } = await supabase
        .from("resumo_master")
        .select("*")
        .single();

      if (!error) setResumo(data);
      setLoading(false);
    }

    carregarResumo();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Carregando gestão master...
      </div>
    );
  }

  return (
    <div className="dashboard-master">
      <div className="dashboard-overlay">

        <header className="dashboard-header">
          <h1>Dashboard Master</h1>
          <span>Gestão global do AGP</span>
        </header>

        <section className="dashboard-section grid">
          <div className="card">
            <h3>Usuários ativos</h3>
            <p>{resumo?.usuarios ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Atletas</h3>
            <p>{resumo?.atletas ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Comissões</h3>
            <p>{resumo?.comissoes ?? "-"}</p>
          </div>

          <div className="card">
            <h3>Clubes</h3>
            <p>{resumo?.clubes ?? "-"}</p>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Gestão</h2>
          <div className="action-row">
            <button>Gerenciar usuários</button>
            <button>Perfis e permissões</button>
            <button>Configurações do sistema</button>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Auditoria</h2>
          <ul className="audit-list">
            <li>Acesso admin — hoje</li>
            <li>Criação de usuário — ontem</li>
            <li>Alteração de permissão — 2 dias</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
