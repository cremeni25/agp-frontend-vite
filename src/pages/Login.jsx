import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getDashboardPath, normalizeUserType } from "../config/accessProfiles";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const administrativo = useMemo(
    () => new URLSearchParams(location.search).get("administrativo") === "1",
    [location.search]
  );

  const [email, setEmail] = useState(administrativo ? "anderson@cremeni.com.br" : "");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
        setErro("Perfil de acesso não encontrado. Procure o administrador da plataforma.");
        return;
      }

      const tipo = normalizeUserType(perfil.tipo_usuario || perfil.funcao);
      const destino = getDashboardPath(tipo);

      if (!tipo || !destino) {
        await supabase.auth.signOut();
        setErro("O perfil deste usuário ainda não possui uma área configurada.");
        return;
      }

      navigate(destino, { replace: true });
    } catch {
      await supabase.auth.signOut();
      setErro("Não foi possível concluir o acesso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Acesso seguro</span>
          <h1>{administrativo ? "Acesso administrativo reservado." : "Acesse sua área no AGP."}</h1>
          <p>
            {administrativo
              ? "Ambiente restrito ao proprietário e aos administradores autorizados."
              : "Informe suas credenciais. O sistema identificará automaticamente seu perfil e abrirá o painel correspondente."}
          </p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Entrar</h1>
          <p>Use as credenciais vinculadas ao seu perfil.</p>
          <form className="agp-form" onSubmit={handleLogin}>
            <div className="agp-field">
              <label htmlFor="email">Email</label>
              <input id="email" className="agp-input" type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            <div className="agp-field">
              <label htmlFor="senha">Senha</label>
              <input id="senha" className="agp-input" type="password" placeholder="Digite sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" required />
            </div>
            <div className="agp-link-row">
              <span className="agp-link" onClick={() => navigate(`/recuperar-senha?email=${encodeURIComponent(email)}`)}>Esqueci minha senha</span>
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar na plataforma"}</button>
          </form>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate("/")}>Voltar ao início</span>
            {!administrativo && <span className="agp-link" onClick={() => navigate("/register")}>Criar conta de atleta</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
