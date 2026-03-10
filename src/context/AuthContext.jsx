import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchSession = async () => {

      const { data } = await supabase.auth.getSession();

      if (data.session) {

        setSession(data.session);

        const { data: perfilData } = await supabase
          .from("perfis_atletas")
          .select("*")
          .eq("auth_id", data.session.user.id)
          .single();

        setPerfil(perfilData);

      }

      setLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {

        setSession(session);

        if (session) {

          const { data: perfilData } = await supabase
            .from("perfis_atletas")
            .select("*")
            .eq("auth_id", session.user.id)
            .single();

          setPerfil(perfilData);

        } else {

          setPerfil(null);

        }

      }
    );

    return () => listener.subscription.unsubscribe();

  }, []);

  return (
    <AuthContext.Provider value={{ session, perfil, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
