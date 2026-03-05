import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardAtleta() {

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {

    async function carregarDashboard() {

      try {

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = "/";
          return;
        }

        const authId = session.user.id;

        const { data: perfil } = await supabase
          .from("perfis_atletas")
          .select("*")
          .eq("auth_id", authId)
          .single();

        const { data: score } = await supabase
          .from("score_atleta")
          .select("*")
          .limit(1);

        const { data: carga } = await supabase
          .from("dados_fisiologicos_atleta")
          .select("*")
          .limit(5);

        const { data: sono } = await supabase
          .from("dados_biologicos_atleta")
          .select("*")
          .limit(5);

        setData({
          perfil,
          score,
          carga,
          sono
        });

      } catch (err) {

        console.error(err);
        setError(err);

      }

    }

    carregarDashboard();

  }, []);

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Erro no dashboard</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40 }}>
        Carregando dashboard...
      </div>
    );
  }

  const perfil = data.perfil;

  return (

    <div style={{ padding: 40 }}>

      <h1>Dashboard do Atleta</h1>

      <section>
        <h2>Perfil</h2>
        <p><strong>Nome:</strong> {perfil?.nome}</p>
        <p><strong>Clube:</strong> {perfil?.clube}</p>
        <p><strong>Sexo:</strong> {perfil?.sexo}</p>
        <p><strong>Idade:</strong> {perfil?.idade}</p>
        <p><strong>Nível:</strong> {perfil?.nivel}</p>
      </section>

      <section>
        <h2>Score Atual</h2>
        <pre>{JSON.stringify(data.score, null, 2)}</pre>
      </section>

      <section>
        <h2>Carga Recente</h2>
        <pre>{JSON.stringify(data.carga, null, 2)}</pre>
      </section>

      <section>
        <h2>Sono Recente</h2>
        <pre>{JSON.stringify(data.sono, null, 2)}</pre>
      </section>

    </div>

  );

}
