import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = useMemo(
    () => new URLSearchParams(location.search).get("email") || "",
    [location.search]
  );

  const [email, setEmail] = useState(initialEmail);
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMensagem("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/redefinir-senha`;
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setMensagem("Se o endereço estiver cadastrado, você receberá um link seguro para redefinir a senha. Verifique também a caixa de spam.");
    setLoading(false);
  }

  return (
    <main className="agp-shell">
      <div className="agp-page auth-page">
        <section className="agp-panel agp-form-card">
          <h1>Recuperar acesso</h1>
          <p>Informe o e-mail vinculado à sua conta AGP.</p>
          <form className="agp-form" onSubmit={handleSubmit}>
            <div className="agp-field">
              <label htmlFor="recovery-email">Email</label>
              <input id="recovery-email" className="agp-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            {mensagem && <div className="agp-alert" role="status">{mensagem}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
          </form>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate("/login")}>Voltar ao login</span>
          </div>
        </section>
      </div>
    </main>
  );
}
