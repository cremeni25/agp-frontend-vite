import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";

export default function App() {
  // Controle da Home pública
  const [entered, setEntered] = useState(false);

  // Estados já existentes
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só inicia auth DEPOIS que o usuário entrou no sistema
    if (!entered) return;

    async function iniciar() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", currentUser.id)
        .single();

      setPerfil(perfilData);
      setLoading(false);
    }

    iniciar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [entered]);

  // 🔹 HOME PÚBLICA (ETAPA 1)
  if (!entered) {
    return <Home onEnter={() => setEntered(true)} />;
  }

  // 🔹 Fluxo existente preservado
  if (loading) return <div>Carregando...</div>;

  if (!user) return <Login />;

  if (!perfil) return <ProfileSetup user={user} />;

  return <Dashboard user={user} perfil={perfil} />;
}
