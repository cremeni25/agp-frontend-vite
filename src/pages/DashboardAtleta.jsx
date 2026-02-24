import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardAtleta({ user }) {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data } = await supabase
      .from("dados_biologicos")
      .select("*")
      .eq("atleta_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) setDados(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard do Atleta</h1>

      {dados && (
        <>
          <p>Peso: {dados.peso}</p>
          <p>Sono: {dados.qualidade_sono}</p>
          <p>Fadiga: {dados.nivel_fadiga}</p>
          <p>FC Repouso: {dados.fc_repouso}</p>
        </>
      )}
    </div>
  );
}
