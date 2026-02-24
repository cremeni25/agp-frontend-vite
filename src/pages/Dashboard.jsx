import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) return;

    const userId = session.user.id;

    const { data } = await supabase
      .from("perfis_atletas")
      .select("*")
      .eq("auth_id", userId)
      .single();

    setPerfil(data);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      {perfil && (
        <>
          <p><strong>Nome:</strong> {perfil.nome}</p>
          <p><strong>Função:</strong> {perfil.funcao}</p>
          <p><strong>Clube:</strong> {perfil.clube}</p>
          <p><strong>Esporte:</strong> {perfil.esporte}</p>
          <p><strong>Idade:</strong> {perfil.idade}</p>
        </>
      )}

      <button onClick={logout}>
        Sair
      </button>
    </div>
  );
}
