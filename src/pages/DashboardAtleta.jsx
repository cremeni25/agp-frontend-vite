import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-atleta.css";

export default function DashboardAtleta() {

  const [data, setData] = useState(null);

  useEffect(() => {

    async function carregarDashboard() {

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      const authId = session.user.id;

      const response = await fetch(
        `https://SEU_BACKEND_RENDER_URL/athlete/dashboard/${authId}`
      );

      const json = await response.json();

      setData(json);
    }

    carregarDashboard();

  }, []);

  if (!data) {
    return <div className="dashboard-loading">Carregando dashboard...</div>;
  }

  const perfil = data.perfil;

  return (
    <div className="dashboard-atleta">

      <header className="dashboard-header">
        <h1>Dashboard do Atleta</h1>
        <span>{perfil?.nivel}</span>
      </header>

      <section className="dashboard-section">
        <h2>Perfil</h2>
        <p><strong>Nome:</strong> {perfil?.nome}</p>
        <p><strong>Clube:</strong> {perfil?.clube}</p>
        <p><strong>Sexo:</strong> {perfil?.sexo}</p>
        <p><strong>Idade:</strong> {perfil?.idade}</p>
      </section>

      <section className="dashboard-section">
        <h2>Score Atual</h2>
        <pre>{JSON.stringify(data.score, null, 2)}</pre>
      </section>

      <section className="dashboard-section">
        <h2>Carga Recente</h2>
        <pre>{JSON.stringify(data.carga, null, 2)}</pre>
      </section>

      <section className="dashboard-section">
        <h2>Sono Recente</h2>
        <pre>{JSON.stringify(data.sono, null, 2)}</pre>
      </section>

    </div>
  );
}
