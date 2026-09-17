import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/agp-swimming.css";

export default function SwimmingShell({ eyebrow, title, subtitle, children, actions = [] }) {
  const navigate = useNavigate();
  const { perfil } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main className="swim-app">
      <div className="swim-shell">
        <header className="swim-topbar">
          <div className="swim-brand">
            <div className="swim-mark" aria-hidden="true">AGP</div>
            <div>
              <strong>AGP Sports Intelligence</strong>
              <span>Natação · Marco 0</span>
            </div>
          </div>
          <div className="swim-user">
            <div>
              <strong>{perfil?.nome || "Usuário AGP"}</strong>
              <span>{perfil?.tipo_usuario_normalizado || perfil?.tipo_usuario || ""}</span>
            </div>
            <button type="button" className="swim-ghost" onClick={signOut}>Sair</button>
          </div>
        </header>

        <section className="swim-hero">
          <div>
            <span className="swim-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions.length > 0 && (
            <div className="swim-actions">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={action.primary ? "swim-primary" : "swim-secondary"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {children}

        <footer className="swim-footer">
          <span>AGP Swimming</span>
          <small>Evidência → interpretação → decisão → intervenção → resposta → aprendizado.</small>
        </footer>
      </div>
    </main>
  );
}
