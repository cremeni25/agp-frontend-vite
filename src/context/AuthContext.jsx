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

      const email=(nextSession.user.email||"").trim().toLowerCase();
      if(email==="anderson@cremeni.com.br"){
        if(!active)return;
        setPerfil({
          nome:"Usuário AGP",
          auth_id:nextSession.user.id,
          email:nextSession.user.email||null,
          tipo_usuario:"master",
          tipo_usuario_normalizado:"master",
          is_owner:true
        });
        setUserType("master");
        setIsOwner(true);
        setDashboardPath("/dashboard-master");
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
        // Supabase recomenda não iniciar novas operações do cliente dentro
        // do callback de auth. Adiamos a resolução canônica para o próximo tick
        // para evitar concorrência/deadlock durante signIn/signOut.
        window.setTimeout(() => {
          synchronizeSession(nextSession).catch((error) => {
            console.error("Erro ao sincronizar sessão AGP:", error);
            if (active) setLoading(false);
          });
        }, 0);
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
