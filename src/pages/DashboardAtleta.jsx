// src/pages/DashboardAtleta.jsx

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-atleta.css";

export default function DashboardAtleta() {

  const [perfil, setPerfil] = useState(null);
  const [score, setScore] = useState(null);
  const [carga, setCarga] = useState([]);
  const [sono, setSono] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function carregarDashboard() {

      try {

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = "/";
          return;
        }

        const authId = session.user.id;

        /* PERFIL */

        const { data: perfilData, error: perfilError } = await supabase
          .from("perfis_atletas")
          .select("*")
          .eq("auth_id", authId)
          .single();

        if (perfilError) {
          console.log("Erro perfil:", perfilError);
        }

        setPerfil(perfilData);


        /* SCORE */

        const { data: scoreData, error: scoreError } = await supabase
          .from("score_atleta")
          .select("*")
          .limit(1);

        if (!scoreError && scoreData) {
          setScore(scoreData[0]);
        }


        /* CARGA */

        const { data: cargaData, error: cargaError } = await supabase
          .from("dados_fisiologicos_atleta")
          .select("*")
          .limit(5);

        if (!cargaError && cargaData) {
          setCarga(cargaData);
        }


        /* SONO */

        const { data: sonoData, error: sonoError } = await supabase
          .from("dados_biologicos_atleta")
          .select("*")
          .limit(5);

        if (!sonoError && sonoData) {
          setSono(sonoData);
        }

      } catch (err) {

        console.log("Erro dashboard:", err);

      }

      setLoading(false);

    }

    carregarDashboard();

  }, []);


  if (loading) {
    return (
      <div className="dashboard-loading">
        Carregando dashboard...
      </div>
    );
  }

  return (

    <div className="dashboard-atleta">

      <header className="dashboard-header">
        <h1>Dashboard do Atleta</h1>
        <span>{perfil?.nivel || "-"}</span>
      </header>


      <section className="dashboard-section">
        <h2>Perfil</h2>

        <p><strong>Nome:</strong> {perfil?.nome || "-"}</p>
        <p><strong>Clube:</strong> {perfil?.clube || "-"}</p>
        <p><strong>Sexo:</strong> {perfil?.sexo || "-"}</p>
        <p><strong>Idade:</strong> {perfil?.idade || "-"}</p>
      </section>


      <section className="dashboard-section">
        <h2>Score Atual</h2>

        {score
          ? <pre>{JSON.stringify(score, null, 2)}</pre>
          : <p>Sem score registrado</p>
        }

      </section>


      <section className="dashboard-section">
        <h2>Carga Recente</h2>

        {carga.length
          ? <pre>{JSON.stringify(carga, null, 2)}</pre>
          : <p>Nenhuma carga registrada</p>
        }

      </section>


      <section className="dashboard-section">
        <h2>Sono Recente</h2>

        {sono.length
          ? <pre>{JSON.stringify(sono, null, 2)}</pre>
          : <p>Nenhum dado de sono</p>
        }

      </section>

    </div>

  );

}
