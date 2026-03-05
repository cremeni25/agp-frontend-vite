import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-atleta.css";

export default function DashboardAtleta() {

  const [perfil, setPerfil] = useState(null);
  const [score, setScore] = useState(null);
  const [carga, setCarga] = useState(null);
  const [sono, setSono] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function carregarDashboard() {

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      const authId = session.user.id;

      /* PERFIL ATLETA */

      const { data: perfilData } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", authId)
        .single();

      setPerfil(perfilData);

      /* SCORE */

      const { data: scoreData } = await supabase
        .from("score_atleta")
        .select("*")
        .eq("auth_id", authId)
        .order("created_at", { ascending: false })
        .limit(1);

      setScore(scoreData?.[0] || null);

      /* CARGA */

      const { data: cargaData } = await supabase
        .from("dados_fisiologicos_atleta")
        .select("*")
        .eq("auth_id", authId)
        .order("created_at", { ascending: false })
        .limit(5);

      setCarga(cargaData || []);

      /* SONO */

      const { data: sonoData } = await supabase
        .from("dados_biologicos_atleta")
        .select("*")
        .eq("auth_id", authId)
        .order("created_at", { ascending: false })
        .limit(5);

      setSono(sonoData || []);

      setLoading(false);

    }

    carregarDashboard();

  }, []);

  if (loading) {
    return <div className="dashboard-loading">Carregando dashboard...</div>;
  }

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

        {score
          ? <pre>{JSON.stringify(score, null, 2)}</pre>
          : <p>Sem score registrado</p>
        }

      </section>


      <section className="dashboard-section">

        <h2>Carga Recente</h2>

        {carga?.length
          ? <pre>{JSON.stringify(carga, null, 2)}</pre>
          : <p>Nenhuma carga registrada</p>
        }

      </section>


      <section className="dashboard-section">

        <h2>Sono Recente</h2>

        {sono?.length
          ? <pre>{JSON.stringify(sono, null, 2)}</pre>
          : <p>Nenhum dado de sono</p>
        }

      </section>

    </div>

  );

}
