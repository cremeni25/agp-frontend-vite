import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro("O link pode ter expirado ou a sessão de recuperação não está válida. Solicite um novo link.");
    } else {
      setMensagem("Senha definida com sucesso. Você já pode acessar a plataforma.");
      setTimeout(() => navigate("/divisao", { replace: true }), 1800);
    }

    setLoading(false);
  };

  return (
    <main className="agp-shell">
      <div className="agp-page auth-page">
        <section className="agp-panel agp-form-card">
          <h1>Definir nova senha</h1>
          <p>Crie uma senha exclusiva para sua conta AGP.</p>
          <form className="agp-form" onSubmit={handleSubmit}>
            <div className="agp-field">
              <label htmlFor="new-password">Nova senha</label>
              <input id="new-password" className="agp-input" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="new-password" minLength={8} required />
            </div>
            <div className="agp-field">
              <label htmlFor="confirm-password">Confirmar senha</label>
              <input id="confirm-password" className="agp-input" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} autoComplete="new-password" minLength={8} required />
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            {mensagem && <div className="agp-alert" role="status">{mensagem}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar nova senha"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}