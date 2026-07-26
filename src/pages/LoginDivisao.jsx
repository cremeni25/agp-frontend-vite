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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

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

      const normalizedProfileType = normalizeUserType(perfil.tipo_usuario || perfil.funcao);
      const [selectedType] = selectedProfile;

      if (!normalizedProfileType || normalizedProfileType !== selectedType) {
        await supabase.auth.signOut();
        setErro("Estas credenciais não estão vinculadas a esta área de acesso.");
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
      <main className="agp-shell">
        <div className="agp-page auth-page">
          <section className="agp-panel agp-form-card">
            <h1>Acesso inválido</h1>
            <p>A divisão selecionada não existe.</p>
            <button className="agp-button agp-button-primary" onClick={() => navigate("/divisao", { replace: true })}>Voltar</button>
          </section>
        </div>
      </main>
    );
  }

  const [, profileConfig] = selectedProfile;

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Acesso seguro</span>
          <h1>Bem-vindo à área de <span>{profileConfig.label}.</span></h1>
          <p>Entre somente com as credenciais previamente vinculadas a esta área da plataforma.</p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Entrar</h1>
          <p>Use suas credenciais cadastradas no AGP.</p>
          <form className="agp-form" onSubmit={handleLogin}>
            <div className="agp-field">
              <label htmlFor="email">Email</label>
              <input id="email" className="agp-input" type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            <div className="agp-field">
              <label htmlFor="senha">Senha</label>
              <input id="senha" className="agp-input" type="password" placeholder="Digite sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" required />
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar na plataforma"}</button>
          </form>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate("/divisao")}>Voltar às áreas de acesso</span>
          </div>
        </section>
      </div>
    </main>
  );
}
