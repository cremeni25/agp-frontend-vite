import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardComissao() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [atletas, setAtletas] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      // Perfil da comissão
      const { data: perfilComissao } = await supabase
        .from("perfis_comissao")
        .select("nome, commercial_state, access_level")
        .eq("auth_id", user.id)
        .single();

      setPerfil(perfilComissao);

      // Atletas sob responsabilidade (visão técnica)
      const { data: atletasData } = await supabase
        .from("perfis_atletas")
        .select("id, nome, risco_atual, carga_atual")
        .eq("comissao_id", user.id);

      setAtletas(atletasData || []);
      setLoading(false);
    }

    carregarDados();
  }, []);

  if (loading) return <div>Carregando dashboard técnico...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard — Comissão Técnica</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Perfil</h3>
        <p><strong>Responsável:</strong> {perfil?.nome}</p>
        <p><strong>Status comercial:</strong> {perfil?.commercial_state}</p>
        <p><strong>Nível de acesso:</strong> {perfil?.access_level}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Visão Coletiva de Atletas</h3>
        {atletas.length === 0 && <p>Nenhum atleta vinculado.</p>}

        {atletas.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 12,
              marginBottom: 8,
              border: "1px solid #ddd",
              borderRadius: 6
            }}
          >
            <p><strong>{a.nome}</strong></p>
            <p>Risco atual: {a.risco_atual ?? "—"}</p>
            <p>Carga atual: {a.carga_atual ?? "—"}</p>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Alertas Sistêmicos</h3>
        <p>(em breve: alertas de sobrecarga, tendência e recuperação)</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Distribuição de Carga</h3>
        <p>(em breve: visão agregada por grupo/categoria)</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <button>Emitir relatório técnico</button>
      </section>
    </div>
  );
}
