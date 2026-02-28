import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardClube() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [resumo, setResumo] = useState({
    total_atletas: 0,
    atletas_risco: 0,
    carga_media: null
  });

  useEffect(() => {
    async function carregarDados() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      // Perfil institucional do clube
      const { data: perfilClube } = await supabase
        .from("perfis_clubes")
        .select("nome, commercial_state, access_level")
        .eq("auth_id", user.id)
        .single();

      setPerfil(perfilClube);

      // Resumo institucional do elenco
      const { data: atletas } = await supabase
        .from("perfis_atletas")
        .select("risco_atual, carga_atual")
        .eq("clube_id", user.id);

      if (atletas && atletas.length > 0) {
        const atletasRisco = atletas.filter(
          (a) => a.risco_atual && a.risco_atual !== "baixo"
        ).length;

        const cargas = atletas
          .map((a) => a.carga_atual)
          .filter((c) => typeof c === "number");

        const cargaMedia =
          cargas.length > 0
            ? Math.round(
                cargas.reduce((acc, cur) => acc + cur, 0) / cargas.length
              )
            : null;

        setResumo({
          total_atletas: atletas.length,
          atletas_risco: atletasRisco,
          carga_media: cargaMedia
        });
      }

      setLoading(false);
    }

    carregarDados();
  }, []);

  if (loading) return <div>Carregando dashboard institucional...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard — Clube</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Perfil Institucional</h3>
        <p><strong>Clube:</strong> {perfil?.nome}</p>
        <p><strong>Status comercial:</strong> {perfil?.commercial_state}</p>
        <p><strong>Nível de acesso:</strong> {perfil?.access_level}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Resumo do Elenco</h3>
        <p>Total de atletas: {resumo.total_atletas}</p>
        <p>Atletas em risco: {resumo.atletas_risco}</p>
        <p>Carga média do elenco: {resumo.carga_media ?? "—"}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Alertas Sistêmicos</h3>
        <p>
          (em breve: alertas institucionais de carga excessiva,
          concentração de risco e tendência coletiva)
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <button>Emitir relatório institucional</button>
      </section>
    </div>
  );
}
