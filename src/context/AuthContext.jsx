import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { resolveUserAccess } from "../services/resolveUserAccess";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [dashboardPath, setDashboardPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function synchronizeSession(nextSession) {
      if (!active) return;

      setSession(nextSession);

      if (!nextSession?.user?.id) {
        setPerfil(null);
        setUserType(null);
        setIsOwner(false);
        setDashboardPath(null);
        setLoading(false);
        return;
      }

      const access = await resolveUserAccess(nextSession);

      if (!active) return;

      setPerfil(access.perfil);
      setUserType(access.userType);
      setIsOwner(access.isOwner);
      setDashboardPath(access.dashboardPath);
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
    <AuthContext.Provider
      value={{
        session,
        perfil,
        userType,
        isOwner,
        dashboardPath,
        loading
      }}
    >
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
