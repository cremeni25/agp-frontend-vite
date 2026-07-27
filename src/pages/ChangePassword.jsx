import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function validatePassword(value) {
  return (
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const email = session?.user?.email || "";
  const required = useMemo(() => {
    const metadata = session?.user?.user_metadata || {};
    return metadata.agp_initial_password_issued === true && metadata.agp_password_changed !== true;
  }, [session]);

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validatePassword(newPassword)) {
      setError("A nova senha deve ter no mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });
      if (authError) {
        setError("A senha atual não foi confirmada.");
        return;
      }

      const currentMetadata = session.user.user_metadata || {};
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          ...currentMetadata,
          agp_password_changed: true,
          agp_password_changed_at: new Date().toISOString()
        }
      });
      if (updateError) {
        setError("Não foi possível atualizar a senha. Tente novamente.");
        return;
      }

      await supabase.auth.signOut({ scope: "global" });
      navigate("/login?senha-alterada=1", { replace: true });
    } catch {
      setError("Não foi possível concluir a alteração de senha.");
    } finally {
      setSaving(false);
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
          <span className="agp-eyebrow">Segurança da conta</span>
          <h1>Proteja seu acesso.</h1>
          <p>Antes de acessar o painel, substitua a senha temporária por uma senha pessoal e exclusiva.</p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>{required ? "Primeiro acesso" : "Alterar senha"}</h1>
          <p>Após a troca, todas as sessões serão encerradas e o novo acesso será feito com a senha pessoal.</p>
          <form className="agp-form" onSubmit={handleSubmit}>
            <div className="agp-field">
              <label htmlFor="currentPassword">Senha atual</label>
              <input id="currentPassword" className="agp-input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
            </div>
            <div className="agp-field">
              <label htmlFor="newPassword">Nova senha</label>
              <input id="newPassword" className="agp-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required />
            </div>
            <div className="agp-field">
              <label htmlFor="confirmPassword">Confirmar nova senha</label>
              <input id="confirmPassword" className="agp-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
            </div>
            <div className="auth-provisioning-note">Mínimo de 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.</div>
            {error && <div className="agp-alert" role="alert">{error}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={saving}>{saving ? "Alterando..." : "Definir senha pessoal"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
