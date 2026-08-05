import { useNavigate } from "react-router-dom";
import "../styles/dashboard-master.css";

const ITEMS = [
  { title: "Instituições", description: "Cadastrar e administrar as entidades institucionais do AGP.", path: "/dashboard-master/administracao/instituicoes", active: true },
  { title: "Projetos", description: "Administrar projetos vinculados às instituições.", path: "/dashboard-master/administracao/projetos", active: true },
  { title: "Clubes", description: "Administrar clubes e associações esportivas.", active: false },
  { title: "Equipe Técnica", description: "Administrar profissionais e vínculos técnicos.", path: "/dashboard-master/administracao/equipe-tecnica", active: true },
  { title: "Usuários", description: "Consultar registros, vínculos e status de acesso.", path: "/master/usuarios", active: true },
  { title: "Perfis", description: "Auditar e corrigir papéis globais da plataforma.", path: "/master/perfis", active: true },
  { title: "Configurações", description: "Configurações administrativas gerais do AGP.", active: false }
];

export default function MasterAdministration() {
  const navigate = useNavigate();
  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Núcleo Administrativo</span><h1>Administração</h1><p>Dados mestres e governança operacional do AGP Sports Intelligence.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button></header>
    <section className="dashboard-section"><div className="master-action-grid">{ITEMS.map((item) => <button key={item.title} className="master-action-card" disabled={!item.active} onClick={() => item.path && navigate(item.path)}><strong>{item.title}</strong><span>{item.description}</span>{!item.active && <small>Execução posterior</small>}</button>)}</div></section>
  </div></main>;
}
