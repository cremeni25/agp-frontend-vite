import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getDashboardPath, normalizeUserType } from "../config/accessProfiles";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const administrativo = params.get("administrativo") === "1";
  const senhaAlterada = params.get("senha-alterada") === "1";
  const linkAntigo = params.get("link-antigo") === "1";
  const ativado = params.get("ativado") === "1";

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
        setErro("E-mail ou senha inválidos.");
        return;
      }

      const metadata = data.user.user_metadata || {};
      if (metadata.agp_initial_password_issued === true && metadata.agp_password_changed !== true) {
        navigate("/alterar-senha", { replace: true });
        return;
      }

      const { data: perfil, error: perfilErro } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (perfilErro || !perfil) {
        await supabase.auth.signOut();
        setErro("Seu usuário existe, mas o vínculo institucional ainda não foi concluído.");
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

  const recoveryPath = `/recuperar-senha?email=${encodeURIComponent(email)}`;

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Plataforma segura</span>
          <h1>{administrativo ? "Acesso administrativo." : "Acesso único ao AGP."}</h1>
          <p>
            {administrativo
              ? "Ambiente reservado ao proprietário e aos administradores autorizados."
              : "Entre com as credenciais recebidas da sua organização. O AGP identifica sua função e abre automaticamente o ambiente autorizado."}
          </p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Entrar</h1>
          <p>Use o e-mail vinculado ao seu perfil institucional.</p>
          {senhaAlterada && <div className="agp-alert agp-alert-success" role="status">Senha pessoal definida. Entre novamente com a nova senha.</div>}
          {ativado && <div className="agp-alert agp-alert-success" role="status">Acesso proprietário ativado. Entre com a senha pessoal definida.</div>}
          {linkAntigo && <div className="agp-alert" role="status">O fluxo antigo por link foi desativado.</div>}
          {administrativo && !ativado && (
            <div className="auth-provisioning-note">
              Primeiro acesso do proprietário: <span className="agp-link" onClick={() => navigate("/ativar-proprietario")}>ativar acesso definitivo</span>.
            </div>
          )}
          <form className="agp-form" onSubmit={handleLogin}>
            <div className="agp-field">
              <label htmlFor="email">E-mail</label>
              <input id="email" className="agp-input" type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            <div className="agp-field">
              <label htmlFor="senha">Senha</label>
              <input id="senha" className="agp-input" type="password" placeholder="Digite sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" required />
            </div>
            <div className="agp-link-row auth-support-row">
              {!administrativo && <span className="agp-link" onClick={() => navigate(recoveryPath)}>Recuperar senha</span>}
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar na plataforma"}</button>
          </form>
          <div className="auth-provisioning-note">
            Novos usuários são convidados e vinculados pela instituição ou pela administração do AGP.
          </div>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate("/")}>Voltar ao início</span>
          </div>
        </section>
      </div>
    </main>
  );
}
