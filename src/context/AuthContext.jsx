import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { normalizeUserType } from "../config/accessProfiles";

const AuthContext = createContext(null);

async function loadUserProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("perfis_atletas")
    .select("*")
    .eq("auth_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar perfil do usuário:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    tipo_usuario_normalizado: normalizeUserType(data.tipo_usuario || data.funcao)
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function synchronizeSession(nextSession) {
      if (!active) return;

      setSession(nextSession);

      if (!nextSession?.user?.id) {
        setPerfil(null);
        setLoading(false);
        return;
      }

      const profile = await loadUserProfile(nextSession.user.id);

      if (!active) return;

      setPerfil(profile);
      setLoading(false);
    }

    async function initializeAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao recuperar sessão:", error);
      }

      await synchronizeSession(data?.session || null);
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setLoading(true);
        synchronizeSession(nextSession);
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, perfil, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
