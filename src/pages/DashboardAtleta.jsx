import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DashboardAtleta() {

  const [perfil, setPerfil] = useState(null);
  const [esporte, setEsporte] = useState(null);
  const [modalidade, setModalidade] = useState(null);
  const [score, setScore] = useState([]);
  const [carga, setCarga] = useState([]);
  const [sono, setSono] = useState([]);

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

      /* ESPORTE */

      if (perfilData?.esporte_id) {

        const { data: esporteData } = await supabase
          .from("esportes")
          .select("*")
          .eq("id", perfilData.esporte_id)
          .single();

        setEsporte(esporteData);

      }

      /* MODALIDADE */

      if (perfilData?.modalidade_id) {

        const { data: modalidadeData } = await supabase
          .from("modalidades")
          .select("*")
          .eq("id", perfilData.modalidade_id)
          .single();

        setModalidade(modalidadeData);

      }

      /* SCORE */

      const { data: scoreData } = await supabase
        .from("score_atleta")
        .select("*")
        .limit(1);

      setScore(scoreData || []);

      /* CARGA */

      const { data: cargaData } = await supabase
        .from("dados_fisiologicos_atleta")
        .select("*")
        .limit(5);

      setCarga(cargaData || []);

      /* SONO */

      const { data: sonoData } = await supabase
        .from("dados_biologicos_atleta")
        .select("*")
        .limit(5);

      setSono(sonoData || []);

    }

    carregarDashboard();

  }, []);

  if (!perfil) {
    return <div style={{ padding: 40 }}>Carregando dashboard...</div>;
  }

  return (

    <div style={{ padding: 40 }}>

      <h1>Dashboard do Atleta</h1>

      <section>
        <h2>Perfil</h2>

        <p><strong>Nome:</strong> {perfil.nome}</p>
        <p><strong>Clube:</strong> {perfil.clube}</p>
        <p><strong>Sexo:</strong> {perfil.sexo}</p>
        <p><strong>Idade:</strong> {perfil.idade}</p>
        <p><strong>Nível:</strong> {perfil.nivel}</p>
        <p><strong>Esporte:</strong> {esporte?.nome}</p>
        <p><strong>Modalidade:</strong> {modalidade?.nome}</p>

      </section>

      <section>
        <h2>Score Atual</h2>
        <pre>{JSON.stringify(score, null, 2)}</pre>
      </section>

      <section>
        <h2>Carga Recente</h2>
        <pre>{JSON.stringify(carga, null, 2)}</pre>
      </section>

      <section>
        <h2>Sono Recente</h2>
        <pre>{JSON.stringify(sono, null, 2)}</pre>
      </section>

    </div>

  );

}
