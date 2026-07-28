import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com";

function validPassword(value) {
  return value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export default function OwnerActivation() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validPassword(password)) {
      setError("A senha deve ter no mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }
    if (password !== confirm) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/owner/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "anderson@cremeni.com.br",
          activation_code: code.trim(),
          new_password: password
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.detail || "Não foi possível concluir a ativação.");
        return;
      }
      navigate("/login?administrativo=1&ativado=1", { replace: true });
    } catch {
      setError("Não foi possível conectar ao serviço de ativação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" role="button" tabIndex={0} onClick={() => navigate("/")}> 
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Ativação do proprietário</span>
          <h1>Defina seu acesso definitivo.</h1>
          <p>Use o código único de ativação e escolha diretamente sua senha pessoal. Nenhum link de e-mail será necessário.</p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Ativar acesso Master</h1>
          <p>E-mail proprietário: anderson@cremeni.com.br</p>
          <form className="agp-form" onSubmit={handleSubmit}>
            <div className="agp-field">
              <label htmlFor="activationCode">Código de ativação</label>
              <input id="activationCode" className="agp-input" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required />
            </div>
            <div className="agp-field">
              <label htmlFor="newPassword">Nova senha pessoal</label>
              <input id="newPassword" className="agp-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
            </div>
            <div className="agp-field">
              <label htmlFor="confirmPassword">Confirmar nova senha</label>
              <input id="confirmPassword" className="agp-input" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required />
            </div>
            <div className="auth-provisioning-note">Mínimo de 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.</div>
            {error && <div className="agp-alert" role="alert">{error}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Ativando..." : "Ativar acesso definitivo"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
