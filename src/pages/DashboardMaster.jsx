import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardMaster() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({
    atletas: 0,
    comissoes: 0,
    clubes: 0,
    contratos_ativos: 0
  });

  useEffect(() => {
    async function carregarResumo() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      // Quantitativos globais
      const { count: atletas } = await supabase
        .from("perfis_atletas")
        .select("*", { count: "exact", head: true });

      const { count: comissoes } = await supabase
        .from("perfis_comissao")
        .select("*", { count: "exact", head: true });

      const { count: clubes } = await supabase
        .from("perfis_clubes")
        .select("*", { count: "exact", head: true });

      // Contratos ativos (estado comercial)
      const { count: contratos } = await supabase
        .from("perfis_comerciais")
        .select("*", { count: "exact", head: true })
        .eq("commercial_state", "ativo");

      setResumo({
        atletas: atletas || 0,
        comissoes: comissoes || 0,
        clubes: clubes || 0,
        contratos_ativos: contratos || 0
      });

      setLoading(false);
    }

    carregarResumo();
  }, []);

  if (loading) return <div>Carregando visão master...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard — Master</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Visão Global do Sistema</h3>
        <p>Total de atletas: {resumo.atletas}</p>
        <p>Comissões técnicas: {resumo.comissoes}</p>
        <p>Clubes cadastrados: {resumo.clubes}</p>
        <p>Contratos ativos: {resumo.contratos_ativos}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Visão Comercial</h3>
        <p>
          (em breve: contratos por país, região, perfil e tempo de vida)
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Inteligência Estratégica</h3>
        <p>
          (em breve: mapas de expansão, densidade esportiva,
          oportunidades regionais)
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <button>Emitir relatório estratégico</button>
      </section>
    </div>
  );
}
