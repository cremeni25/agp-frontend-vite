import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const REQUEST_TIMEOUT_MS = 15000;

function withTimeout(promise, timeoutMs = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      window.setTimeout(() => reject(new Error("timeout")), timeoutMs)
    )
  ]);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function validarSessao() {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 10000);
        if (!ativo) return;
        setSessaoValida(Boolean(data?.session));
        if (!data?.session) {
          setErro("O link de redefinição não está mais válido. Solicite um novo link de acesso.");
        }
      } catch {
        if (!ativo) return;
        setErro("Não foi possível validar o link de redefinição. Solicite um novo link.");
      } finally {
        if (ativo) setVerificando(false);
      }
    }

    validarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessaoValida(true);
        setErro("");
        setVerificando(false);
      }
    });

    return () => {
      ativo = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setErro("");
    setMensagem("");

    if (!sessaoValida) {
      setErro("A sessão de redefinição expirou. Solicite um novo link de acesso.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: senha })
      );

      if (error) throw error;

      setMensagem("Senha definida com sucesso. Redirecionando para o acesso à plataforma...");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setErro(
        error?.message === "timeout"
          ? "A operação demorou além do esperado. Verifique sua conexão e tente novamente."
          : "Não foi possível salvar a senha. O link pode ter expirado; solicite um novo link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="agp-shell">
      <div className="agp-page auth-page">
        <section className="agp-panel agp-form-card">
          <h1>Definir nova senha</h1>
          <p>Crie uma senha exclusiva para sua conta AGP.</p>

          {verificando ? (
            <div className="agp-alert" role="status">Validando seu acesso seguro...</div>
          ) : (
            <form className="agp-form" onSubmit={handleSubmit}>
              <div className="agp-field">
                <label htmlFor="new-password">Nova senha</label>
                <input
                  id="new-password"
                  className="agp-input"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  disabled={!sessaoValida || loading}
                  required
                />
              </div>
              <div className="agp-field">
                <label htmlFor="confirm-password">Confirmar senha</label>
                <input
                  id="confirm-password"
                  className="agp-input"
                  type="password"
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  disabled={!sessaoValida || loading}
                  required
                />
              </div>
              {erro && <div className="agp-alert" role="alert">{erro}</div>}
              {mensagem && <div className="agp-alert" role="status">{mensagem}</div>}
              <button
                className="agp-button agp-button-primary"
                type="submit"
                disabled={!sessaoValida || loading}
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
              {!sessaoValida && (
                <button
                  className="agp-button agp-button-secondary"
                  type="button"
                  onClick={() => navigate("/recuperar-senha", { replace: true })}
                >
                  Solicitar novo link
                </button>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
