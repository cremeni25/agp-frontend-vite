// src/pages/DashboardAtleta.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-atleta.css";

export default function DashboardAtleta() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // provisório — depois virá do perfil
  const sport = "swimming";

  useEffect(() => {
    async function carregarPerfil() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      const { data, error } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      if (!data) {
        window.location.href = "/";
        return;
      }

      setPerfil(data);
      setLoading(false);
    }

    carregarPerfil();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className={`dashboard-atleta ${sport}`}>
      <div className="dashboard-overlay">

        <header className="dashboard-header">
          <h1>Dashboard do Atleta</h1>
          <span>{perfil?.nivel || "Atleta"}</span>
        </header>

        <section className="dashboard-section">
          <h2>Perfil</h2>
          <p><strong>Nome:</strong> {perfil?.nome}</p>
          <p><strong>Clube:</strong> {perfil?.clube}</p>
          <p><strong>Sexo:</strong> {perfil?.sexo}</p>
          <p><strong>Idade:</strong> {perfil?.idade}</p>
        </section>

        <section className="dashboard-section">
          <h2>Indicadores</h2>
          <ul>
            <li>Performance geral</li>
            <li>Carga de treino</li>
            <li>Recuperação</li>
            <li>Risco de lesão</li>
          </ul>
        </section>

        <section className="dashboard-section">
          <h2>Ações</h2>
          <button>Registrar treino</button>
          <button>Preencher diário</button>
          <button>Ver relatórios</button>
        </section>

      </div>
    </div>
  );
}
