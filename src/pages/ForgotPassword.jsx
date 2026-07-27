import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const tipo = useMemo(() => new URLSearchParams(location.search).get("tipo") || "atletas", [location.search]);
  const [email, setEmail] = useState(tipo === "master" ? "anderson@cremeni.com.br" : "");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setErro("Não foi possível enviar o e-mail de recuperação. Verifique o endereço e tente novamente.");
    } else {
      setMensagem("Enviamos um link seguro para redefinir sua senha. Verifique também a caixa de spam.");
    }

    setLoading(false);
  };

  return (
    <main className="agp-shell">
      <div className="agp-page auth-page">
        <section className="agp-panel agp-form-card">
          <h1>Recuperar acesso</h1>
          <p>Informe o e-mail cadastrado para receber um link seguro de redefinição.</p>
          <form className="agp-form" onSubmit={handleSubmit}>
            <div className="agp-field">
              <label htmlFor="recovery-email">Email</label>
              <input id="recovery-email" className="agp-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            {mensagem && <div className="agp-alert" role="status">{mensagem}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
          </form>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate(`/login/${tipo}`)}>Voltar ao login</span>
          </div>
        </section>
      </div>
    </main>
  );
}