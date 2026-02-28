import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardAtleta() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data } = await supabase
        .from("perfis_atletas")
        .select(
          `
          nome,
          commercial_state,
          access_level,
          commercial_expires_at
        `
        )
        .eq("auth_id", user.id)
        .single();

      setPerfil(data);
      setLoading(false);
    }

    carregarPerfil();
  }, []);

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard do Atleta</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Perfil</h3>
        <p><strong>Nome:</strong> {perfil?.nome}</p>
        <p><strong>Status comercial:</strong> {perfil?.commercial_state}</p>
        <p><strong>Nível de acesso:</strong> {perfil?.access_level}</p>
        <p>
          <strong>Acesso válido até:</strong>{" "}
          {perfil?.commercial_expires_at
            ? new Date(perfil.commercial_expires_at).toLocaleDateString()
            : "—"}
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Indicadores Pessoais</h3>
        <p>(em breve: carga, risco, tendência)</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Alertas</h3>
        <p>(em breve: alertas individuais)</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <button>Ver relatório completo</button>
      </section>
    </div>
  );
}
