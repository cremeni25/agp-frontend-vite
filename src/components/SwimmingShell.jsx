import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/agp-swimming.css";

const NAV = {
  atleta: [
    ["Início","/dashboard-atleta"],
    ["Minha evolução","/dashboard-atleta?view=evolucao"],
    ["Treinos e provas","/dashboard-atleta?view=treinos"],
    ["Prontidão","/atleta/prontidao-diaria"],
    ["Histórico","/dashboard-atleta?view=historico"]
  ],
  comissao: [
    ["Início","/dashboard-comissao"],
    ["Atletas","/dashboard-comissao"],
    ["Planejamento","/profissional/treinos"],
    ["Piloto N1","/profissional/atletas-piloto"]
  ],
  clube: [
    ["Instituição","/dashboard-clube"]
  ],
  master: [
    ["Governança","/dashboard-master"],
    ["Treinos","/master/treinos-observacao"],
    ["Atletas","/master/atletas"],
    ["Instituições","/master/instituicoes"],
    ["Jornadas","/master/jornada-homologacao"]
  ]
};

export default function SwimmingShell({ eyebrow, title, subtitle, children, actions = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { perfil } = useAuth();
  const role = perfil?.tipo_usuario_normalizado || perfil?.tipo_usuario || "atleta";
  const items = NAV[role] || NAV.comissao || [];

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  function active(path){
    const [pathname,search]=path.split("?");
    if(location.pathname!==pathname)return false;
    if(!search)return !location.search || location.search==="";
    return location.search===`?${search}`;
  }

  return (
    <main className="swim-app">
      <div className="swim-shell">
        <header className="swim-topbar">
          <button type="button" className="swim-brand swim-brand-button" onClick={()=>navigate(role==="master"?"/dashboard-master":role==="clube"?"/dashboard-clube":role==="comissao"?"/dashboard-comissao":"/dashboard-atleta")}>
            <div className="swim-mark" aria-hidden="true">AGP</div>
            <div>
              <strong>AGP Sports Intelligence</strong>
              <span>Natação · Marco 0</span>
            </div>
          </button>
          <div className="swim-user">
            <div>
              <strong>{perfil?.nome || "Usuário AGP"}</strong>
              <span>{role}</span>
            </div>
            <button type="button" className="swim-ghost" onClick={signOut}>Sair</button>
          </div>
        </header>

        <div className="swim-product-layout">
          <aside className="swim-product-nav" aria-label="Navegação AGP Swim">
            <div className="swim-nav-title"><span>AGP Swim</span><small>{role==="comissao"?"Profissional":role==="clube"?"Instituição":role==="master"?"Governança":"Atleta"}</small></div>
            <nav>
              {items.map(([label,path])=><button key={label} type="button" className={active(path)?"active":""} onClick={()=>navigate(path)}><span>{label}</span></button>)}
            </nav>
            <div className="swim-nav-principle"><strong>Ciência em movimento</strong><span>Evidência → decisão → aprendizado</span></div>
          </aside>

          <div className="swim-product-content">
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
              <span>AGP Swim</span>
              <small>Evidência → interpretação → decisão → intervenção → resposta → aprendizado.</small>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
