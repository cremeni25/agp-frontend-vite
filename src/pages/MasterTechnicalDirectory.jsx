import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCanonicalTechnicalTeam } from "../services/technicalTeamManagement";
import "../styles/dashboard-master.css";

const ROLE_LABEL = { admin_institucional: "Administrador institucional", tecnico: "Técnico", assistente: "Assistente", observador: "Observador" };

export default function MasterTechnicalDirectory() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setMembers(await listCanonicalTechnicalTeam()); }
    catch (requestError) { setError(`Falha ao consultar comissão técnica: ${requestError.message}`); setMembers([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((item) => [item.nome, item.email, item.instituicao?.nome, ROLE_LABEL[item.papel] || item.papel].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [members, search]);

  function openAthletes(member) {
    const params = new URLSearchParams({
      tecnico: member.pessoa_id,
      tecnico_nome: member.nome || member.email || "Técnico"
    });
    navigate(`/master/atletas?${params.toString()}`);
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Administração</span><h1>Comissões técnicas</h1><p>Consulta e gestão dos profissionais vinculados às instituições do AGP.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button><button className="master-button" onClick={load}>Atualizar</button></div></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-panel"><input className="master-input" placeholder="Buscar por nome, e-mail, instituição ou papel" value={search} onChange={(event) => setSearch(event.target.value)} /></section>
    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Base técnica</span><h2>Profissionais vinculados</h2></div><strong>{filtered.length}</strong></div>
      {loading ? <div className="master-empty">Carregando profissionais...</div> : filtered.length === 0 ? <div className="master-empty">Nenhum profissional encontrado.</div> : <ul className="master-activity-list">{filtered.map((member) => <li key={member.id}><div><strong>{member.nome || "Nome não informado"}</strong><span>{member.instituicao?.nome || "Instituição não identificada"} · {ROLE_LABEL[member.papel] || member.papel}</span><small>{member.email || "E-mail não informado"} · {member.ativo ? "Ativo" : "Inativo"}</small></div><div className="master-row-actions"><button className="master-button" onClick={() => navigate(`/dashboard-master/administracao/equipe-tecnica?membro=${member.id}`)}>Editar vínculo</button><button className="master-button secondary" onClick={() => openAthletes(member)}>Consultar atletas deste técnico</button></div></li>)}</ul>}
    </section>
  </div></main>;
}
