import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import {
  getDashboardPath,
  getProfileByRouteParam,
  normalizeUserType
} from "../config/accessProfiles";

export default function LoginDivisao() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const selectedProfile = getProfileByRouteParam(tipo);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErro("");

    if (!selectedProfile) {
      setErro("Divisão de acesso inválida.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error || !data.user) {
        setErro("Email ou senha inválidos.");
        return;
      }

      const { data: perfil, error: perfilErro } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (perfilErro || !perfil) {
        await supabase.auth.signOut();
        setErro("Perfil de acesso não encontrado.");
        return;
      }

      const normalizedProfileType = normalizeUserType(
        perfil.tipo_usuario || perfil.funcao
      );
      const [selectedType] = selectedProfile;

      if (!normalizedProfileType || normalizedProfileType !== selectedType) {
        await supabase.auth.signOut();
        setErro("Você não tem acesso a esta divisão.");
        return;
      }

      const dashboardPath = getDashboardPath(normalizedProfileType);

      if (!dashboardPath) {
        await supabase.auth.signOut();
        setErro("Dashboard não configurado para este perfil.");
        return;
      }

      navigate(dashboardPath, { replace: true });
    } catch {
      await supabase.auth.signOut();
      setErro("Erro inesperado no login.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProfile) {
    return (
      <div className="login-container">
        <p>Divisão de acesso inválida.</p>
        <button type="button" onClick={() => navigate("/divisao", { replace: true })}>
          Voltar
        </button>
      </div>
    );
  }

  const [, profileConfig] = selectedProfile;

  return (
    <div className="login-container">
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {profileConfig.label}
      </h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {erro && (
        <div role="alert" style={{ color: "red", marginTop: "10px" }}>
          {erro}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px"
        }}
      >
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/register")}>
          Criar conta
        </span>

        <span style={{ cursor: "pointer" }} onClick={() => navigate("/divisao")}>
          Voltar
        </span>
      </div>
    </div>
  );
}
