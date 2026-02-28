import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* Guards */
import AuthGuard from "./guards/AuthGuard";
import ProfileGuard from "./guards/ProfileGuard";
import CommercialStateGuard from "./guards/CommercialStateGuard";

/* Pages */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

/* Dashboards */
import DashboardAtleta from "./pages/DashboardAtleta";
import DashboardComissao from "./pages/DashboardComissao";
import DashboardClube from "./pages/DashboardClube";
import DashboardMaster from "./pages/DashboardMaster";

export default function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarSessao() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
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

    carregarSessao();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Redirect inteligente */}
      <Route
        path="/dashboard"
        element={
          <AuthGuard isAuthenticated={!!user}>
            {perfil?.tipo === "atleta" && <Navigate to="/dashboard/atleta" />}
            {perfil?.tipo === "comissao" && <Navigate to="/dashboard/comissao" />}
            {perfil?.tipo === "clube" && <Navigate to="/dashboard/clube" />}
            {perfil?.tipo === "master" && <Navigate to="/dashboard/master" />}
          </AuthGuard>
        }
      />

      {/* Dashboards por perfil */}
      <Route
        path="/dashboard/atleta"
        element={
          <AuthGuard isAuthenticated={!!user}>
            <ProfileGuard userProfile={perfil?.tipo} allowedProfile="atleta">
              <CommercialStateGuard commercialState={perfil?.estado_comercial}>
                <DashboardAtleta />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/comissao"
        element={
          <AuthGuard isAuthenticated={!!user}>
            <ProfileGuard userProfile={perfil?.tipo} allowedProfile="comissao">
              <CommercialStateGuard commercialState={perfil?.estado_comercial}>
                <DashboardComissao />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/clube"
        element={
          <AuthGuard isAuthenticated={!!user}>
            <ProfileGuard userProfile={perfil?.tipo} allowedProfile="clube">
              <CommercialStateGuard commercialState={perfil?.estado_comercial}>
                <DashboardClube />
              </CommercialStateGuard>
            </ProfileGuard>
          </AuthGuard>
        }
      />

      <Route
        path="/dashboard/master"
        element={
          <AuthGuard isAuthenticated={!!user}>
            <ProfileGuard userProfile={perfil?.tipo} allowedProfile="master">
              <DashboardMaster />
            </ProfileGuard>
          </AuthGuard>
        }
      />

      {/* Fallback */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
